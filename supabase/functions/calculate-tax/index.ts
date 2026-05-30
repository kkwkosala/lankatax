import { createClient } from '@supabase/supabase-js';
import { handleCors } from '../_shared/cors.ts';
import { errorResponse, jsonResponse, validationError } from '../_shared/response.ts';
import { getAuthenticatedUser } from '../_shared/auth.ts';
import { logAuditEvent } from '../_shared/audit.ts';
import { runEngine } from './engine.ts';
import type { TaxSlab, TaxRates } from './engine.ts';
import type { TaxCalculationRequest, TaxCalculationResult, TaxSlabSnapshot } from '../_shared/types.ts';

const DISCLAIMER =
  'This calculation is for estimation purposes only. ' +
  'Consult a qualified tax professional or the Inland Revenue Department of Sri Lanka ' +
  'for official APIT guidance. Rates are based on publicly available IRD publications.';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
  }

  const startTime = Date.now();

  // ── Auth (optional — anonymous users get no save) ────────────────────────
  const { user, supabase } = await getAuthenticatedUser(req, false);

  // ── Parse + Validate Request ─────────────────────────────────────────────
  let body: TaxCalculationRequest;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 'INVALID_JSON', 400);
  }

  const errors: Record<string, string> = {};
  if (typeof body.basicSalary !== 'number' || body.basicSalary < 0) {
    errors.basicSalary = 'Must be a non-negative number';
  }
  if (body.fixedAllowances !== undefined && body.fixedAllowances < 0) {
    errors.fixedAllowances = 'Must be non-negative';
  }
  if (body.transportAllowance !== undefined && body.transportAllowance < 0) {
    errors.transportAllowance = 'Must be non-negative';
  }
  if (body.dataAllowance !== undefined && body.dataAllowance < 0) {
    errors.dataAllowance = 'Must be non-negative';
  }
  if (body.otherAllowances !== undefined && body.otherAllowances < 0) {
    errors.otherAllowances = 'Must be non-negative';
  }
  if (body.taxReliefAnnual !== undefined && body.taxReliefAnnual < 0) {
    errors.taxReliefAnnual = 'Must be non-negative';
  }
  if (body.pegging?.enabled) {
    if (!body.pegging.baseRate || body.pegging.baseRate <= 0) {
      errors['pegging.baseRate'] = 'Required and must be > 0 when pegging is enabled';
    }
    if (!body.pegging.currentRate || body.pegging.currentRate <= 0) {
      errors['pegging.currentRate'] = 'Required and must be > 0 when pegging is enabled';
    }
    if (!body.pegging.peggedUsdValue || body.pegging.peggedUsdValue <= 0) {
      errors['pegging.peggedUsdValue'] = 'Required and must be > 0 when pegging is enabled';
    }
  }
  if (Object.keys(errors).length > 0) return validationError(errors);

  // ── Load Tax Configuration from DB ───────────────────────────────────────
  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Resolve tax year
  let taxYearQuery = serviceClient
    .from('tax_years')
    .select('id, label, start_date, end_date')
    .limit(1);

  if (body.taxYear) {
    taxYearQuery = taxYearQuery.eq('label', body.taxYear);
  } else {
    taxYearQuery = taxYearQuery.eq('is_current', true);
  }

  const { data: taxYearData, error: taxYearError } = await taxYearQuery.single();
  if (taxYearError || !taxYearData) {
    return errorResponse('Tax year not found', 'TAX_YEAR_NOT_FOUND', 404);
  }

  // Load latest effective slabs for this tax year
  const { data: slabRows, error: slabError } = await serviceClient
    .from('tax_slabs')
    .select('lower_bound, upper_bound, rate, fixed_amount, slab_order, effective_date')
    .eq('tax_year_id', taxYearData.id)
    .lte('effective_date', new Date().toISOString().split('T')[0])
    .order('effective_date', { ascending: false })
    .order('slab_order', { ascending: true });

  if (slabError || !slabRows || slabRows.length === 0) {
    return errorResponse('No active tax slabs found for this tax year', 'NO_TAX_SLABS', 422);
  }

  // De-duplicate slabs: keep latest effective_date per slab_order
  const latestSlabs = new Map<number, typeof slabRows[0]>();
  for (const slab of slabRows) {
    if (!latestSlabs.has(slab.slab_order)) {
      latestSlabs.set(slab.slab_order, slab);
    }
  }

  const slabs: TaxSlab[] = Array.from(latestSlabs.values()).map((s) => ({
    lowerBound: Number(s.lower_bound),
    upperBound: s.upper_bound !== null ? Number(s.upper_bound) : null,
    rate: Number(s.rate),
    fixedAmount: Number(s.fixed_amount),
    slabOrder: s.slab_order,
  }));

  // Load latest effective rates
  const { data: rateRows, error: rateError } = await serviceClient
    .from('tax_rules')
    .select('rule_type, rate_value')
    .in('rule_type', ['epf_employee_rate', 'epf_employer_rate', 'etf_employer_rate'])
    .lte('effective_date', new Date().toISOString().split('T')[0])
    .order('effective_date', { ascending: false });

  if (rateError || !rateRows) {
    return errorResponse('Failed to load tax rates', 'RATES_LOAD_ERROR', 500);
  }

  const rateMap = new Map<string, number>();
  for (const r of rateRows) {
    if (!rateMap.has(r.rule_type)) rateMap.set(r.rule_type, Number(r.rate_value));
  }

  const rates: TaxRates = {
    epfEmployeeRate: rateMap.get('epf_employee_rate') ?? 0.08,
    epfEmployerRate: rateMap.get('epf_employer_rate') ?? 0.12,
    etfEmployerRate: rateMap.get('etf_employer_rate') ?? 0.03,
  };

  // Load exchange rate (request override takes priority, then DB latest)
  let exchangeRate: number | null = body.exchangeRate ?? null;
  if (!exchangeRate) {
    const { data: rateRow } = await serviceClient
      .from('exchange_rates')
      .select('rate')
      .eq('currency_from', 'USD')
      .eq('currency_to', 'LKR')
      .order('rate_date', { ascending: false })
      .limit(1)
      .single();
    if (rateRow) exchangeRate = Number(rateRow.rate);
  }

  // ── Run Engine ────────────────────────────────────────────────────────────
  const engineResult = runEngine(
    { ...body, exchangeRate: exchangeRate ?? undefined },
    slabs,
    rates
  );

  // ── Build Slab Snapshot ───────────────────────────────────────────────────
  const taxSlabsSnapshot: TaxSlabSnapshot[] = slabs.map((s) => ({
    lowerBound: s.lowerBound,
    upperBound: s.upperBound,
    rate: s.rate,
    fixedAmount: s.fixedAmount,
    slabOrder: s.slabOrder,
  }));

  // ── Save Calculation (authenticated users only) ───────────────────────────
  let calculationId: string | undefined;
  if (user) {
    const { data: saved } = await supabase
      .from('salary_calculations')
      .insert({
        user_id: user.id,
        basic_salary: body.basicSalary,
        fixed_allowances: body.fixedAllowances ?? 0,
        transport_allowance: body.transportAllowance ?? 0,
        data_allowance: body.dataAllowance ?? 0,
        other_allowances: body.otherAllowances ?? 0,
        tax_relief_annual: body.taxReliefAnnual ?? 0,
        pegging_enabled: body.pegging?.enabled ?? false,
        pegging_base_rate: body.pegging?.baseRate ?? null,
        pegging_usd_value: body.pegging?.peggedUsdValue ?? null,
        pegging_current_rate: body.pegging?.currentRate ?? null,
        exchange_rate_used: exchangeRate,
        pegging_allowance: engineResult.peggingAllowance,
        gross_salary: engineResult.grossSalary,
        employee_epf: engineResult.employeeEpf,
        taxable_income: engineResult.taxableIncome,
        apit_tax: engineResult.apitTax,
        take_home_salary: engineResult.takeHomeSalary,
        employer_epf: engineResult.employerEpf,
        employer_etf: engineResult.employerEtf,
        employer_cost: engineResult.employerCost,
        usd_equivalent: engineResult.usdEquivalent,
        tax_year_label: taxYearData.label,
        tax_slabs_snapshot: taxSlabsSnapshot,
        epf_employee_rate: rates.epfEmployeeRate,
        epf_employer_rate: rates.epfEmployerRate,
        etf_employer_rate: rates.etfEmployerRate,
      })
      .select('id')
      .single();

    if (saved) {
      calculationId = saved.id;
      await logAuditEvent({
        entityType: 'salary_calculation',
        entityId: calculationId,
        action: 'CALCULATION',
        actorId: user.id,
        actorRole: user.role,
        newValues: { taxYear: taxYearData.label, grossSalary: engineResult.grossSalary },
      });
    }
  }

  // ── Build Response ────────────────────────────────────────────────────────
  const result: TaxCalculationResult = {
    inputs: body,
    peggingAllowance: engineResult.peggingAllowance,
    grossSalary: engineResult.grossSalary,
    employeeEpf: engineResult.employeeEpf,
    taxableIncome: engineResult.taxableIncome,
    apitTax: engineResult.apitTax,
    takeHomeSalary: engineResult.takeHomeSalary,
    employerEpf: engineResult.employerEpf,
    employerEtf: engineResult.employerEtf,
    employerCost: engineResult.employerCost,
    usdEquivalent: engineResult.usdEquivalent,
    exchangeRateUsed: exchangeRate,
    taxYearLabel: taxYearData.label,
    taxSlabsUsed: taxSlabsSnapshot,
    epfEmployeeRate: rates.epfEmployeeRate,
    epfEmployerRate: rates.epfEmployerRate,
    etfEmployerRate: rates.etfEmployerRate,
    calculationId,
    calculatedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER,
  };

  console.log(JSON.stringify({
    level: 'info',
    event: 'tax_calculation_completed',
    functionName: 'calculate-tax',
    userId: user?.id ?? 'anonymous',
    taxYear: taxYearData.label,
    saved: !!calculationId,
    durationMs: Date.now() - startTime,
  }));

  return jsonResponse(result, 200);
});

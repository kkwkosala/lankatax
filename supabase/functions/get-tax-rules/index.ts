import { createClient } from '@supabase/supabase-js';
import { handleCors } from '../_shared/cors.ts';
import { errorResponse, jsonResponse } from '../_shared/response.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'GET') {
    return errorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
  }

  const url = new URL(req.url);
  const yearLabel = url.searchParams.get('year');

  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // ── Tax Year ──────────────────────────────────────────────────────────────
  let taxYearQuery = serviceClient
    .from('tax_years')
    .select('id, label, start_date, end_date, is_current')
    .limit(1);

  if (yearLabel) {
    taxYearQuery = taxYearQuery.eq('label', yearLabel);
  } else {
    taxYearQuery = taxYearQuery.eq('is_current', true);
  }

  const { data: taxYear, error: taxYearError } = await taxYearQuery.single();
  if (taxYearError || !taxYear) {
    return errorResponse('Tax year not found', 'TAX_YEAR_NOT_FOUND', 404);
  }

  // ── Tax Slabs ─────────────────────────────────────────────────────────────
  const { data: slabRows, error: slabError } = await serviceClient
    .from('tax_slabs')
    .select('lower_bound, upper_bound, rate, fixed_amount, slab_order, effective_date')
    .eq('tax_year_id', taxYear.id)
    .lte('effective_date', new Date().toISOString().split('T')[0])
    .order('effective_date', { ascending: false })
    .order('slab_order', { ascending: true });

  if (slabError) {
    return errorResponse('Failed to load tax slabs', 'SLABS_LOAD_ERROR', 500);
  }

  const latestSlabs = new Map<number, typeof slabRows[0]>();
  for (const slab of (slabRows ?? [])) {
    if (!latestSlabs.has(slab.slab_order)) {
      latestSlabs.set(slab.slab_order, slab);
    }
  }

  // ── Tax Rates ─────────────────────────────────────────────────────────────
  const { data: rateRows, error: rateError } = await serviceClient
    .from('tax_rules')
    .select('rule_type, rate_value, effective_date')
    .in('rule_type', ['epf_employee_rate', 'epf_employer_rate', 'etf_employer_rate', 'monthly_relief'])
    .lte('effective_date', new Date().toISOString().split('T')[0])
    .order('effective_date', { ascending: false });

  if (rateError) {
    return errorResponse('Failed to load tax rates', 'RATES_LOAD_ERROR', 500);
  }

  const rateMap = new Map<string, number>();
  for (const r of (rateRows ?? [])) {
    if (!rateMap.has(r.rule_type)) rateMap.set(r.rule_type, Number(r.rate_value));
  }

  return jsonResponse({
    taxYear: {
      id: taxYear.id,
      label: taxYear.label,
      startDate: taxYear.start_date,
      endDate: taxYear.end_date,
      isCurrent: taxYear.is_current,
    },
    taxSlabs: Array.from(latestSlabs.values()).map((s) => ({
      lowerBound: Number(s.lower_bound),
      upperBound: s.upper_bound !== null ? Number(s.upper_bound) : null,
      rate: Number(s.rate),
      fixedAmount: Number(s.fixed_amount),
      slabOrder: s.slab_order,
      effectiveDate: s.effective_date,
    })),
    rates: {
      epfEmployeeRate: rateMap.get('epf_employee_rate') ?? 0.08,
      epfEmployerRate: rateMap.get('epf_employer_rate') ?? 0.12,
      etfEmployerRate: rateMap.get('etf_employer_rate') ?? 0.03,
      monthlyRelief: rateMap.get('monthly_relief') ?? 10000,
    },
    retrievedAt: new Date().toISOString(),
  }, 200);
});

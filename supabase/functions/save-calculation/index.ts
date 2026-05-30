import { handleCors } from '../_shared/cors.ts';
import { errorResponse, jsonResponse, validationError } from '../_shared/response.ts';
import { getAuthenticatedUser } from '../_shared/auth.ts';
import { logAuditEvent } from '../_shared/audit.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
  }

  const { user, supabase, error: authError } = await getAuthenticatedUser(req, true);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 'INVALID_JSON', 400);
  }

  const errors: Record<string, string> = {};
  const required = [
    'basicSalary', 'grossSalary', 'employeeEpf', 'taxableIncome',
    'apitTax', 'takeHomeSalary', 'employerEpf', 'employerEtf',
    'employerCost', 'taxYearLabel', 'taxSlabsSnapshot',
  ];
  for (const field of required) {
    if (body[field] === undefined || body[field] === null) {
      errors[field] = 'Required';
    }
  }

  // Validate calculationMonth format if provided (YYYY-MM)
  if (body.calculationMonth !== undefined && body.calculationMonth !== null) {
    if (!/^\d{4}-\d{2}$/.test(String(body.calculationMonth))) {
      errors.calculationMonth = 'Must be in YYYY-MM format';
    }
  }

  if (Object.keys(errors).length > 0) return validationError(errors);

  // Convert YYYY-MM to YYYY-MM-01 for the DATE column
  const calculationMonthDate = body.calculationMonth
    ? `${body.calculationMonth}-01`
    : null;

  const { data: saved, error: insertError } = await supabase!
    .from('salary_calculations')
    .insert({
      user_id:              user!.id,
      basic_salary:         body.basicSalary,
      fixed_allowances:     body.fixedAllowances     ?? 0,
      transport_allowance:  body.transportAllowance  ?? 0,
      data_allowance:       body.dataAllowance       ?? 0,
      other_allowances:     body.otherAllowances     ?? 0,
      tax_relief_annual:    body.taxReliefAnnual     ?? 0,
      pegging_enabled:      body.peggingEnabled      ?? false,
      pegging_base_rate:    body.peggingBaseRate     ?? null,
      pegging_usd_value:    body.peggingUsdValue     ?? null,
      pegging_current_rate: body.peggingCurrentRate  ?? null,
      exchange_rate_used:   body.exchangeRateUsed    ?? null,
      pegging_allowance:    body.peggingAllowance    ?? 0,
      gross_salary:         body.grossSalary,
      employee_epf:         body.employeeEpf,
      taxable_income:       body.taxableIncome,
      apit_tax:             body.apitTax,
      take_home_salary:     body.takeHomeSalary,
      employer_epf:         body.employerEpf,
      employer_etf:         body.employerEtf,
      employer_cost:        body.employerCost,
      usd_equivalent:       body.usdEquivalent       ?? null,
      tax_year_label:       body.taxYearLabel,
      tax_slabs_snapshot:   body.taxSlabsSnapshot,
      epf_employee_rate:    body.epfEmployeeRate     ?? 0.08,
      epf_employer_rate:    body.epfEmployerRate     ?? 0.12,
      etf_employer_rate:    body.etfEmployerRate     ?? 0.03,
      person_name:          body.personName          ?? null,
      calculation_month:    calculationMonthDate,
      comment:              body.comment             ?? null,
    })
    .select('id, calculated_at')
    .single();

  if (insertError) {
    console.error('save-calculation insert error:', insertError.message);
    return errorResponse('Failed to save calculation', 'SAVE_ERROR', 500);
  }

  await logAuditEvent({
    entityType: 'salary_calculation',
    entityId: saved.id,
    action: 'CREATE',
    actorId: user!.id,
    actorRole: user!.role,
    newValues: {
      taxYear: body.taxYearLabel,
      grossSalary: body.grossSalary,
      personName: body.personName ?? null,
    },
  });

  return jsonResponse({ id: saved.id, calculatedAt: saved.calculated_at }, 201);
});

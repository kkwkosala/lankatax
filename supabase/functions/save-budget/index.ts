import { handleCors } from '../_shared/cors.ts';
import { errorResponse, jsonResponse, validationError } from '../_shared/response.ts';
import { getAuthenticatedUser } from '../_shared/auth.ts';

interface OtherIncomeSource {
  label: string;
  amount: number;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const { user, supabase, error: authError } = await getAuthenticatedUser(req, true);
  if (authError) return authError;

  // GET — return full history for the authenticated user
  if (req.method === 'GET') {
    const { data, error } = await supabase!
      .from('budget_profiles')
      .select('id, budget_month, income_amount, other_income, spend_amount, starting_corpus, created_at, updated_at')
      .eq('user_id', user!.id)
      .order('budget_month', { ascending: false });

    if (error) {
      console.error('save-budget GET error:', error.message);
      return errorResponse('Failed to load budget history', 'FETCH_ERROR', 500);
    }

    return jsonResponse(data ?? []);
  }

  // POST — upsert a month's record
  if (req.method === 'POST') {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body', 'INVALID_JSON', 400);
    }

    const errors: Record<string, string> = {};
    if (!body.budgetMonth || !/^\d{4}-\d{2}$/.test(String(body.budgetMonth))) {
      errors.budgetMonth = 'Required, format YYYY-MM';
    }
    if (body.incomeAmount === undefined || body.incomeAmount === null || Number(body.incomeAmount) < 0) {
      errors.incomeAmount = 'Required, must be >= 0';
    }
    if (body.spendAmount === undefined || body.spendAmount === null || Number(body.spendAmount) < 0) {
      errors.spendAmount = 'Required, must be >= 0';
    }
    if (Object.keys(errors).length > 0) return validationError(errors);

    // Validate and sanitise other_income array
    const rawOther = Array.isArray(body.otherIncome) ? body.otherIncome : [];
    const otherIncome: OtherIncomeSource[] = [];
    for (const item of rawOther) {
      if (
        typeof item === 'object' && item !== null &&
        typeof (item as Record<string, unknown>).label === 'string' &&
        typeof (item as Record<string, unknown>).amount === 'number' &&
        (item as Record<string, unknown>).amount >= 0
      ) {
        otherIncome.push({
          label:  String((item as Record<string, unknown>).label).slice(0, 100),
          amount: Number((item as Record<string, unknown>).amount),
        });
      }
    }

    const upsertData = {
      user_id:         user!.id,
      budget_month:    `${body.budgetMonth}-01`,
      income_amount:   Number(body.incomeAmount),
      other_income:    otherIncome,
      spend_amount:    Number(body.spendAmount),
      starting_corpus: Number(body.startingCorpus ?? 0),
      name:            body.name ?? null,
      calculation_id:  body.calculationId ?? null,
      updated_at:      new Date().toISOString(),
    };

    const { data: saved, error: upsertError } = await supabase!
      .from('budget_profiles')
      .upsert(upsertData, { onConflict: 'user_id,budget_month' })
      .select('id, budget_month, updated_at')
      .single();

    if (upsertError) {
      console.error('save-budget POST error:', upsertError.message);
      return errorResponse('Failed to save budget', 'SAVE_ERROR', 500);
    }

    return jsonResponse({ id: saved.id, budgetMonth: saved.budget_month, updatedAt: saved.updated_at }, 201);
  }

  return errorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
});

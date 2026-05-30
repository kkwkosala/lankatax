import { createClient } from 'npm:@supabase/supabase-js@^2';
import { handleCors } from '../_shared/cors.ts';
import { errorResponse, jsonResponse } from '../_shared/response.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'GET') {
    return errorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
  }

  const url = new URL(req.url);
  const asOf = url.searchParams.get('date'); // optional: YYYY-MM-DD

  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const targetDate = asOf ?? new Date().toISOString().split('T')[0];

  const { data, error } = await serviceClient
    .from('exchange_rates')
    .select('id, currency_from, currency_to, rate, rate_date, source')
    .eq('currency_from', 'USD')
    .eq('currency_to', 'LKR')
    .lte('rate_date', targetDate)
    .order('rate_date', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return errorResponse(
      'No exchange rate found for the specified date',
      'EXCHANGE_RATE_NOT_FOUND',
      404
    );
  }

  return jsonResponse({
    currencyFrom: data.currency_from,
    currencyTo: data.currency_to,
    rate: Number(data.rate),
    rateDate: data.rate_date,
    source: data.source,
    retrievedAt: new Date().toISOString(),
  }, 200);
});

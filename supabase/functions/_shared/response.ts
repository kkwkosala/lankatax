import { corsHeaders } from './cors.ts';
import type { ApiError } from './types.ts';

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}

export function errorResponse(message: string, code: string, status: number): Response {
  const body: ApiError = { error: message, code };
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}

export function validationError(fields: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: 'Validation failed', code: 'VALIDATION_ERROR', fields }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
  );
}

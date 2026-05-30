import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { errorResponse } from './response.ts';

interface AuthResult {
  user: { id: string; role: string } | null;
  supabase: SupabaseClient;
  error: Response | null;
}

export async function getAuthenticatedUser(
  req: Request,
  required = true
): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader ?? '' } } }
  );

  if (!authHeader) {
    if (required) {
      return { user: null, supabase, error: errorResponse('Unauthorized', 'UNAUTHORIZED', 401) };
    }
    return { user: null, supabase, error: null };
  }

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    if (required) {
      return { user: null, supabase, error: errorResponse('Unauthorized', 'UNAUTHORIZED', 401) };
    }
    return { user: null, supabase, error: null };
  }

  const role = (user.app_metadata?.role as string) ?? 'user';
  return { user: { id: user.id, role }, supabase, error: null };
}

export function requireAdmin(user: { role: string } | null): Response | null {
  if (!user || user.role !== 'admin') {
    return errorResponse('Admin access required', 'ADMIN_REQUIRED', 403);
  }
  return null;
}

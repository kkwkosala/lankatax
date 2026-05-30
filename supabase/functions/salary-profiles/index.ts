import { handleCors } from '../_shared/cors.ts';
import { errorResponse, jsonResponse, validationError } from '../_shared/response.ts';
import { getAuthenticatedUser } from '../_shared/auth.ts';
import { logAuditEvent } from '../_shared/audit.ts';

const MAX_PROFILES = 10;

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const { user, supabase, error: authError } = await getAuthenticatedUser(req, true);
  if (authError) return authError;

  const url = new URL(req.url);
  const profileId = url.pathname.split('/').pop(); // last segment = UUID or undefined
  const hasProfileId = profileId && profileId !== 'salary-profiles';

  // ── GET /salary-profiles ──────────────────────────────────────────────────
  if (req.method === 'GET' && !hasProfileId) {
    const { data, error } = await supabase!
      .from('salary_profiles')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) return errorResponse('Failed to load profiles', 'LIST_ERROR', 500);
    return jsonResponse(data ?? [], 200);
  }

  // ── GET /salary-profiles/:id ──────────────────────────────────────────────
  if (req.method === 'GET' && hasProfileId) {
    const { data, error } = await supabase!
      .from('salary_profiles')
      .select('*')
      .eq('id', profileId)
      .eq('user_id', user!.id)
      .single();

    if (error || !data) return errorResponse('Profile not found', 'NOT_FOUND', 404);
    return jsonResponse(data, 200);
  }

  // ── POST /salary-profiles ─────────────────────────────────────────────────
  if (req.method === 'POST') {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body', 'INVALID_JSON', 400);
    }

    const errors: Record<string, string> = {};
    if (!body.profileName || typeof body.profileName !== 'string' || !body.profileName.trim()) {
      errors.profileName = 'Required';
    } else if ((body.profileName as string).length > 100) {
      errors.profileName = 'Maximum 100 characters';
    }
    if (typeof body.basicSalary !== 'number' || body.basicSalary < 0) {
      errors.basicSalary = 'Must be a non-negative number';
    }
    if (Object.keys(errors).length > 0) return validationError(errors);

    // Enforce per-user limit
    const { count } = await supabase!
      .from('salary_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user!.id);

    if ((count ?? 0) >= MAX_PROFILES) {
      return errorResponse(
        `Maximum ${MAX_PROFILES} profiles per user. Delete an existing profile first.`,
        'PROFILE_LIMIT_REACHED',
        422
      );
    }

    const { data, error } = await supabase!
      .from('salary_profiles')
      .insert({
        user_id: user!.id,
        profile_name: (body.profileName as string).trim(),
        basic_salary: body.basicSalary,
        fixed_allowances: body.fixedAllowances ?? 0,
        transport_allowance: body.transportAllowance ?? 0,
        data_allowance: body.dataAllowance ?? 0,
        other_allowances: body.otherAllowances ?? 0,
        tax_relief_annual: body.taxReliefAnnual ?? 0,
        pegging_enabled: body.peggingEnabled ?? false,
        pegging_base_rate: body.peggingBaseRate ?? null,
        pegging_usd_value: body.peggingUsdValue ?? null,
        is_active: true,
      })
      .select('*')
      .single();

    if (error) return errorResponse('Failed to create profile', 'CREATE_ERROR', 500);

    await logAuditEvent({
      entityType: 'salary_profile',
      entityId: data.id,
      action: 'CREATE',
      actorId: user!.id,
      actorRole: user!.role,
      newValues: { profileName: body.profileName },
    });

    return jsonResponse(data, 201);
  }

  // ── PUT /salary-profiles/:id ──────────────────────────────────────────────
  if (req.method === 'PUT' && hasProfileId) {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body', 'INVALID_JSON', 400);
    }

    const errors: Record<string, string> = {};
    if (body.profileName !== undefined) {
      if (typeof body.profileName !== 'string' || !body.profileName.trim()) {
        errors.profileName = 'Must be a non-empty string';
      } else if ((body.profileName as string).length > 100) {
        errors.profileName = 'Maximum 100 characters';
      }
    }
    if (body.basicSalary !== undefined && (typeof body.basicSalary !== 'number' || body.basicSalary < 0)) {
      errors.basicSalary = 'Must be a non-negative number';
    }
    if (Object.keys(errors).length > 0) return validationError(errors);

    const updatePayload: Record<string, unknown> = {};
    const allowed = [
      'profileName', 'basicSalary', 'fixedAllowances', 'transportAllowance',
      'dataAllowance', 'otherAllowances', 'taxReliefAnnual',
      'peggingEnabled', 'peggingBaseRate', 'peggingUsdValue', 'isActive',
    ];
    const dbKeys: Record<string, string> = {
      profileName: 'profile_name',
      basicSalary: 'basic_salary',
      fixedAllowances: 'fixed_allowances',
      transportAllowance: 'transport_allowance',
      dataAllowance: 'data_allowance',
      otherAllowances: 'other_allowances',
      taxReliefAnnual: 'tax_relief_annual',
      peggingEnabled: 'pegging_enabled',
      peggingBaseRate: 'pegging_base_rate',
      peggingUsdValue: 'pegging_usd_value',
      isActive: 'is_active',
    };
    for (const key of allowed) {
      if (body[key] !== undefined) {
        updatePayload[dbKeys[key]] = key === 'profileName'
          ? (body[key] as string).trim()
          : body[key];
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return errorResponse('No updatable fields provided', 'NO_CHANGES', 400);
    }

    const { data: existing } = await supabase!
      .from('salary_profiles')
      .select('*')
      .eq('id', profileId)
      .eq('user_id', user!.id)
      .single();

    if (!existing) return errorResponse('Profile not found', 'NOT_FOUND', 404);

    const { data, error } = await supabase!
      .from('salary_profiles')
      .update(updatePayload)
      .eq('id', profileId)
      .eq('user_id', user!.id)
      .select('*')
      .single();

    if (error) return errorResponse('Failed to update profile', 'UPDATE_ERROR', 500);

    await logAuditEvent({
      entityType: 'salary_profile',
      entityId: profileId,
      action: 'UPDATE',
      actorId: user!.id,
      actorRole: user!.role,
      oldValues: existing,
      newValues: updatePayload,
    });

    return jsonResponse(data, 200);
  }

  // ── DELETE /salary-profiles/:id ───────────────────────────────────────────
  if (req.method === 'DELETE' && hasProfileId) {
    const { data: existing } = await supabase!
      .from('salary_profiles')
      .select('id, profile_name')
      .eq('id', profileId)
      .eq('user_id', user!.id)
      .single();

    if (!existing) return errorResponse('Profile not found', 'NOT_FOUND', 404);

    const { error } = await supabase!
      .from('salary_profiles')
      .delete()
      .eq('id', profileId)
      .eq('user_id', user!.id);

    if (error) return errorResponse('Failed to delete profile', 'DELETE_ERROR', 500);

    await logAuditEvent({
      entityType: 'salary_profile',
      entityId: profileId,
      action: 'DELETE',
      actorId: user!.id,
      actorRole: user!.role,
      oldValues: existing,
    });

    return jsonResponse({ deleted: true, id: profileId }, 200);
  }

  return errorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
});

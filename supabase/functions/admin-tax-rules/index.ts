import { createClient } from 'npm:@supabase/supabase-js@^2';
import { handleCors } from '../_shared/cors.ts';
import { errorResponse, jsonResponse, validationError } from '../_shared/response.ts';
import { getAuthenticatedUser, requireAdmin } from '../_shared/auth.ts';
import { logAuditEvent } from '../_shared/audit.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Admin-only endpoint
  const { user, supabase, error: authError } = await getAuthenticatedUser(req, true);
  if (authError) return authError;

  const adminCheck = requireAdmin(user!);
  if (adminCheck) return adminCheck;

  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const url = new URL(req.url);
  const path = url.pathname.split('/').filter(Boolean);

  // â”€â”€ GET /admin-tax-rules â”€ list tax years, slabs, rules â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (req.method === 'GET') {
    const resource = url.searchParams.get('resource') ?? 'overview';

    if (resource === 'overview' || resource === 'years') {
      const { data: years, error } = await serviceClient
        .from('tax_years')
        .select('id, label, start_date, end_date, is_current')
        .order('start_date', { ascending: false });
      if (error) return errorResponse('Failed to load tax years', 'YEARS_LOAD_ERROR', 500);

      if (resource === 'years') return jsonResponse(years, 200);

      // Full overview: years + slabs
      const { data: slabs, error: slabError } = await serviceClient
        .from('tax_slabs')
        .select('id, tax_year_id, slab_order, lower_bound, upper_bound, rate, fixed_amount, effective_date')
        .order('effective_date', { ascending: false })
        .order('slab_order', { ascending: true });
      if (slabError) return errorResponse('Failed to load slabs', 'SLABS_LOAD_ERROR', 500);

      const { data: rules, error: rulesError } = await serviceClient
        .from('tax_rules')
        .select('id, rule_type, rate_value, effective_date, description')
        .order('effective_date', { ascending: false });
      if (rulesError) return errorResponse('Failed to load rules', 'RULES_LOAD_ERROR', 500);

      return jsonResponse({ years, slabs, rules, retrievedAt: new Date().toISOString() }, 200);
    }

    if (resource === 'slabs') {
      const yearId = url.searchParams.get('yearId');
      let query = serviceClient
        .from('tax_slabs')
        .select('id, tax_year_id, slab_order, lower_bound, upper_bound, rate, fixed_amount, effective_date')
        .order('slab_order', { ascending: true });
      if (yearId) query = query.eq('tax_year_id', yearId);

      const { data, error } = await query;
      if (error) return errorResponse('Failed to load slabs', 'SLABS_LOAD_ERROR', 500);
      return jsonResponse(data, 200);
    }

    if (resource === 'rules') {
      const { data, error } = await serviceClient
        .from('tax_rules')
        .select('id, rule_type, rate_value, effective_date, description')
        .order('effective_date', { ascending: false });
      if (error) return errorResponse('Failed to load rules', 'RULES_LOAD_ERROR', 500);
      return jsonResponse(data, 200);
    }

    return errorResponse('Unknown resource. Use: overview | years | slabs | rules', 'UNKNOWN_RESOURCE', 400);
  }

  // â”€â”€ POST /admin-tax-rules â€” create slab, rule, or tax year â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (req.method === 'POST') {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body', 'INVALID_JSON', 400);
    }

    const action = body.action as string;

    // â”€â”€ Create new tax year â”€â”€
    if (action === 'create_year') {
      const errors: Record<string, string> = {};
      if (!body.label) errors.label = 'Required';
      if (!body.startDate) errors.startDate = 'Required';
      if (!body.endDate) errors.endDate = 'Required';
      if (Object.keys(errors).length > 0) return validationError(errors);

      if (body.isCurrent) {
        // Unset current on all existing years first
        await serviceClient.from('tax_years').update({ is_current: false }).eq('is_current', true);
      }

      const { data, error } = await serviceClient
        .from('tax_years')
        .insert({
          label: body.label,
          start_date: body.startDate,
          end_date: body.endDate,
          is_current: body.isCurrent ?? false,
        })
        .select('*')
        .single();

      if (error) return errorResponse('Failed to create tax year', 'CREATE_YEAR_ERROR', 500);

      await logAuditEvent({
        entityType: 'tax_year',
        entityId: data.id,
        action: 'CREATE',
        actorId: user!.id,
        actorRole: 'admin',
        newValues: { label: body.label },
      });

      return jsonResponse(data, 201);
    }

    // â”€â”€ Create new tax slab â”€â”€
    if (action === 'create_slab') {
      const errors: Record<string, string> = {};
      if (!body.taxYearId) errors.taxYearId = 'Required';
      if (body.slabOrder === undefined) errors.slabOrder = 'Required';
      if (body.lowerBound === undefined) errors.lowerBound = 'Required';
      if (body.rate === undefined) errors.rate = 'Required';
      if (!body.effectiveDate) errors.effectiveDate = 'Required';
      if (Object.keys(errors).length > 0) return validationError(errors);

      const { data, error } = await serviceClient
        .from('tax_slabs')
        .insert({
          tax_year_id: body.taxYearId,
          slab_order: body.slabOrder,
          lower_bound: body.lowerBound,
          upper_bound: body.upperBound ?? null,
          rate: body.rate,
          fixed_amount: body.fixedAmount ?? 0,
          effective_date: body.effectiveDate,
        })
        .select('*')
        .single();

      if (error) return errorResponse('Failed to create tax slab', 'CREATE_SLAB_ERROR', 500);

      await logAuditEvent({
        entityType: 'tax_slab',
        entityId: data.id,
        action: 'CREATE',
        actorId: user!.id,
        actorRole: 'admin',
        newValues: { slabOrder: body.slabOrder, rate: body.rate },
      });

      return jsonResponse(data, 201);
    }

    // â”€â”€ Create new tax rule â”€â”€
    if (action === 'create_rule') {
      const errors: Record<string, string> = {};
      if (!body.ruleType) errors.ruleType = 'Required';
      if (body.rateValue === undefined) errors.rateValue = 'Required';
      if (!body.effectiveDate) errors.effectiveDate = 'Required';
      if (Object.keys(errors).length > 0) return validationError(errors);

      const { data, error } = await serviceClient
        .from('tax_rules')
        .insert({
          rule_type: body.ruleType,
          rate_value: body.rateValue,
          effective_date: body.effectiveDate,
          description: body.description ?? null,
        })
        .select('*')
        .single();

      if (error) return errorResponse('Failed to create tax rule', 'CREATE_RULE_ERROR', 500);

      await logAuditEvent({
        entityType: 'tax_rule',
        entityId: data.id,
        action: 'CREATE',
        actorId: user!.id,
        actorRole: 'admin',
        newValues: { ruleType: body.ruleType, rateValue: body.rateValue },
      });

      return jsonResponse(data, 201);
    }

    return errorResponse(
      'Unknown action. Use: create_year | create_slab | create_rule',
      'UNKNOWN_ACTION',
      400
    );
  }

  return errorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
});

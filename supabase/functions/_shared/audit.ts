import { createClient } from 'npm:@supabase/supabase-js@^2';

interface AuditPayload {
  entityType: string;
  entityId?: string | null;
  action: string;
  actorId?: string | null;
  actorRole?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Append an entry to the audit_logs table using the service role key.
 * Never throws â€” audit failure must not break the main operation.
 */
export async function logAuditEvent(payload: AuditPayload): Promise<void> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabase.from('audit_logs').insert({
      entity_type: payload.entityType,
      entity_id: payload.entityId ?? null,
      action: payload.action,
      actor_id: payload.actorId ?? null,
      actor_role: payload.actorRole ?? 'system',
      old_values: payload.oldValues ?? null,
      new_values: payload.newValues ?? null,
      ip_address: payload.ipAddress ?? null,
      user_agent: payload.userAgent ?? null,
    });
  } catch {
    // Audit failure must never propagate to caller
    console.error(JSON.stringify({
      level: 'error',
      event: 'audit_log_failed',
      entityType: payload.entityType,
      action: payload.action,
    }));
  }
}

-- ============================================================
-- Migration: 20260615000100_create_audit_logs
-- Creates: audit_logs (append-only compliance table)
-- Depends on: 20260601000100_create_users_table
-- Rollback: rollback/rollback_20260615000100.sql
-- ============================================================

CREATE TABLE public.audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT        NOT NULL,
  -- 'tax_slab' | 'tax_rule' | 'tax_year' | 'salary_calculation'
  -- 'salary_profile' | 'user' | 'exchange_rate' | 'auth' | 'report'
  -- 'budget' | 'app_config'
  entity_id   UUID,
  action      TEXT        NOT NULL,
  -- 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGIN_FAILED'
  -- 'CALCULATION' | 'REPORT_GENERATED' | 'ADMIN_LOGIN' | 'ACCOUNT_DELETED'
  actor_id    UUID,        -- NULL for system; anonymised on account deletion
  actor_role  TEXT         CHECK (actor_role IN ('user', 'admin', 'system')),
  old_values  JSONB,
  new_values  JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_entity
  ON public.audit_logs (entity_type, entity_id);

CREATE INDEX idx_audit_actor_date
  ON public.audit_logs (actor_id, created_at DESC);

CREATE INDEX idx_audit_action_date
  ON public.audit_logs (action, created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- INSERT only — any authenticated or service-role call can write
CREATE POLICY "audit_insert_all" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- Only admins can read audit logs
CREATE POLICY "audit_admin_select" ON public.audit_logs
  FOR SELECT USING ((auth.jwt() ->> 'role') = 'admin');

-- NO UPDATE policy
-- NO DELETE policy

COMMENT ON TABLE  public.audit_logs IS 'Append-only compliance log. No UPDATE or DELETE RLS policies exist.';
COMMENT ON COLUMN public.audit_logs.actor_id  IS 'Set to NULL for system events or after account deletion (anonymisation)';
COMMENT ON COLUMN public.audit_logs.old_values IS 'Previous state snapshot (NULL for CREATE events)';
COMMENT ON COLUMN public.audit_logs.new_values IS 'New state snapshot (NULL for DELETE events)';

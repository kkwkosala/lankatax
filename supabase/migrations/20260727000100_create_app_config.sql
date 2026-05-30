-- ============================================================
-- Migration: 20260727000100_create_app_config
-- Creates: app_config (feature flags and system settings)
-- Depends on: (none)
-- Rollback: rollback/rollback_20260727000100.sql
-- ============================================================

CREATE TABLE public.app_config (
  key         TEXT        PRIMARY KEY CHECK (length(key) BETWEEN 1 AND 100),
  value       JSONB       NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Everyone can read config (feature flags needed by frontend)
CREATE POLICY "app_config_select_all" ON public.app_config
  FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "app_config_admin_all" ON public.app_config
  FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

COMMENT ON TABLE  public.app_config IS 'Feature flags and system-wide settings. Key-value with JSONB values.';
COMMENT ON COLUMN public.app_config.key   IS 'Dot-notation: e.g. ff.pegging.enabled';
COMMENT ON COLUMN public.app_config.value IS 'JSONB object: e.g. {"enabled": true}';

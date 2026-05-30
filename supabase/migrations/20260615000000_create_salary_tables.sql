-- ============================================================
-- Migration: 20260615000000_create_salary_tables
-- Creates: salary_profiles, salary_calculations
-- Depends on: 20260601000100_create_users_table
-- Rollback: rollback/rollback_20260615000000.sql
-- ============================================================

-- ── salary_profiles ────────────────────────────────────────
CREATE TABLE public.salary_profiles (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT          NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  basic_salary        NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (basic_salary >= 0),
  fixed_allowances    NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (fixed_allowances >= 0),
  transport_allowance NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (transport_allowance >= 0),
  data_allowance      NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (data_allowance >= 0),
  other_allowances    NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (other_allowances >= 0),
  tax_relief_annual   NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (tax_relief_annual >= 0),
  pegging_enabled     BOOLEAN       NOT NULL DEFAULT FALSE,
  pegging_base_rate   NUMERIC(10,4) CHECK (pegging_base_rate > 0),
  pegging_usd_value   NUMERIC(12,2) CHECK (pegging_usd_value > 0),
  is_default          BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT profiles_pegging_fields CHECK (
    NOT pegging_enabled
    OR (pegging_base_rate IS NOT NULL AND pegging_usd_value IS NOT NULL)
  )
);

CREATE INDEX idx_salary_profiles_user
  ON public.salary_profiles (user_id);

-- Enforce max one default profile per user
CREATE UNIQUE INDEX idx_salary_profiles_one_default
  ON public.salary_profiles (user_id)
  WHERE is_default = TRUE;

ALTER TABLE public.salary_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_all_own" ON public.salary_profiles
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.salary_profiles IS 'Saved salary configurations per user (max 10 per user enforced in application layer)';

-- ── salary_calculations ────────────────────────────────────
CREATE TABLE public.salary_calculations (
  id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  profile_id           UUID          REFERENCES public.salary_profiles(id) ON DELETE SET NULL,

  -- ── Input snapshot ──────────────────────────────────────
  basic_salary         NUMERIC(14,2) NOT NULL,
  fixed_allowances     NUMERIC(14,2) NOT NULL DEFAULT 0,
  transport_allowance  NUMERIC(14,2) NOT NULL DEFAULT 0,
  data_allowance       NUMERIC(14,2) NOT NULL DEFAULT 0,
  other_allowances     NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_relief_annual    NUMERIC(14,2) NOT NULL DEFAULT 0,
  pegging_enabled      BOOLEAN       NOT NULL DEFAULT FALSE,
  pegging_base_rate    NUMERIC(10,4),
  pegging_usd_value    NUMERIC(12,2),
  pegging_current_rate NUMERIC(10,4),
  exchange_rate_used   NUMERIC(10,4),

  -- ── Output snapshot ─────────────────────────────────────
  pegging_allowance    NUMERIC(14,2) NOT NULL DEFAULT 0,
  gross_salary         NUMERIC(14,2) NOT NULL,
  employee_epf         NUMERIC(14,2) NOT NULL,
  taxable_income       NUMERIC(14,2) NOT NULL,
  apit_tax             NUMERIC(14,2) NOT NULL,
  take_home_salary     NUMERIC(14,2) NOT NULL,
  employer_epf         NUMERIC(14,2) NOT NULL,
  employer_etf         NUMERIC(14,2) NOT NULL,
  employer_cost        NUMERIC(14,2) NOT NULL,
  usd_equivalent       NUMERIC(12,4),

  -- ── Tax rule snapshot (audit/dispute resolution) ─────
  tax_year_label       TEXT          NOT NULL,
  tax_slabs_snapshot   JSONB         NOT NULL,  -- Full slab set frozen at calc time
  epf_employee_rate    NUMERIC(8,6)  NOT NULL,
  epf_employer_rate    NUMERIC(8,6)  NOT NULL,
  etf_employer_rate    NUMERIC(8,6)  NOT NULL,

  -- ── Metadata ─────────────────────────────────────────
  calculated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_calculations_user_date
  ON public.salary_calculations (user_id, calculated_at DESC);

ALTER TABLE public.salary_calculations ENABLE ROW LEVEL SECURITY;

-- Read own calculations
CREATE POLICY "calculations_select_own" ON public.salary_calculations
  FOR SELECT USING (auth.uid() = user_id);

-- Insert own (or anonymous — user_id may be NULL)
CREATE POLICY "calculations_insert_own" ON public.salary_calculations
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- NO UPDATE policy — calculations are immutable
-- NO DELETE policy — calculations are immutable

COMMENT ON TABLE  public.salary_calculations IS 'Immutable calculation results. No UPDATE or DELETE allowed.';
COMMENT ON COLUMN public.salary_calculations.tax_slabs_snapshot IS 'JSONB snapshot of slabs used — preserves accuracy even after slab updates';

-- ============================================================
-- Migration: 20260601000000_create_tax_tables
-- Creates: tax_years, tax_rules, tax_slabs
-- Rollback: rollback/rollback_20260601000000.sql
-- ============================================================

-- ── tax_years ──────────────────────────────────────────────
CREATE TABLE public.tax_years (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  label       TEXT        NOT NULL UNIQUE,     -- e.g. '2024/2025'
  start_date  DATE        NOT NULL,            -- e.g. 2024-04-01
  end_date    DATE        NOT NULL,            -- e.g. 2025-03-31
  is_current  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tax_years_date_range CHECK (end_date > start_date)
);

-- Only one tax year can be current at a time
CREATE UNIQUE INDEX idx_tax_years_single_current
  ON public.tax_years (is_current)
  WHERE is_current = TRUE;

ALTER TABLE public.tax_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tax_years_select_all"   ON public.tax_years FOR SELECT USING (true);
CREATE POLICY "tax_years_insert_admin" ON public.tax_years FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

COMMENT ON TABLE  public.tax_years IS 'Sri Lankan fiscal year definitions (Apr 1 – Mar 31)';
COMMENT ON COLUMN public.tax_years.is_current IS 'Exactly one row must be TRUE at all times';

-- ── tax_rules ──────────────────────────────────────────────
CREATE TABLE public.tax_rules (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type      TEXT         NOT NULL,
  -- Values: 'epf_employee_rate' | 'epf_employer_rate' | 'etf_employer_rate'
  --         | 'annual_tax_relief_default'
  rate_value     NUMERIC(8,6) NOT NULL CHECK (rate_value >= 0),
  effective_date DATE         NOT NULL,
  created_by     UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tax_rules_type_date
  ON public.tax_rules (rule_type, effective_date DESC);

ALTER TABLE public.tax_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tax_rules_select_all"   ON public.tax_rules FOR SELECT USING (true);
CREATE POLICY "tax_rules_insert_admin" ON public.tax_rules FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

COMMENT ON TABLE  public.tax_rules IS 'Versioned statutory rates (EPF/ETF). Never UPDATE — INSERT new rows.';
COMMENT ON COLUMN public.tax_rules.effective_date IS 'Engine uses latest rate WHERE effective_date <= NOW()';

-- ── tax_slabs ──────────────────────────────────────────────
CREATE TABLE public.tax_slabs (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_year_id     UUID          NOT NULL REFERENCES public.tax_years(id),
  effective_date  DATE          NOT NULL,
  lower_bound     NUMERIC(14,2) NOT NULL CHECK (lower_bound >= 0),
  upper_bound     NUMERIC(14,2) CHECK (upper_bound > lower_bound), -- NULL = top slab
  rate            NUMERIC(5,4)  NOT NULL CHECK (rate >= 0 AND rate <= 1),
  fixed_amount    NUMERIC(14,2) NOT NULL DEFAULT 0,
  slab_order      INTEGER       NOT NULL CHECK (slab_order > 0),
  created_by      UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tax_slabs_year_date
  ON public.tax_slabs (tax_year_id, effective_date DESC);

CREATE INDEX idx_tax_slabs_ordered
  ON public.tax_slabs (effective_date DESC, slab_order ASC);

ALTER TABLE public.tax_slabs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tax_slabs_select_all"   ON public.tax_slabs FOR SELECT USING (true);
CREATE POLICY "tax_slabs_insert_admin" ON public.tax_slabs FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

COMMENT ON TABLE  public.tax_slabs IS 'APIT monthly tax bands. Versioned by effective_date. Never UPDATE existing rows.';
COMMENT ON COLUMN public.tax_slabs.upper_bound IS 'NULL for the top (uncapped) slab';
COMMENT ON COLUMN public.tax_slabs.rate        IS 'Decimal rate: 0.06 = 6%';

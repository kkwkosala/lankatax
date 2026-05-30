-- ============================================================
-- Migration: 20260727000000_create_budget_tables
-- Creates: budget_profiles, budget_items
-- Depends on: 20260615000000_create_salary_tables
-- Rollback: rollback/rollback_20260727000000.sql
-- ============================================================

-- ── budget_profiles ────────────────────────────────────────
CREATE TABLE public.budget_profiles (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calculation_id UUID          REFERENCES public.salary_calculations(id) ON DELETE SET NULL,
  name           TEXT          NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  budget_month   DATE          NOT NULL,   -- Always stored as first day of month
  income_amount  NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (income_amount >= 0),
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_budget_profiles_user_month
  ON public.budget_profiles (user_id, budget_month DESC);

ALTER TABLE public.budget_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "budget_profiles_own" ON public.budget_profiles
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE  public.budget_profiles IS 'Monthly budget plan linked to a salary calculation';
COMMENT ON COLUMN public.budget_profiles.budget_month IS 'Stored as first day: e.g. 2026-06-01 = June 2026 budget';

-- ── budget_items ───────────────────────────────────────────
CREATE TABLE public.budget_items (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id      UUID          NOT NULL REFERENCES public.budget_profiles(id) ON DELETE CASCADE,
  category_name  TEXT          NOT NULL CHECK (length(category_name) BETWEEN 1 AND 100),
  category_type  TEXT          NOT NULL DEFAULT 'variable'
                               CHECK (category_type IN ('fixed', 'variable')),
  planned_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (planned_amount >= 0),
  actual_amount  NUMERIC(14,2) CHECK (actual_amount >= 0),
  sort_order     INTEGER       NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_budget_items_budget_order
  ON public.budget_items (budget_id, sort_order ASC);

ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

-- Access is inherited from parent budget_profile ownership
CREATE POLICY "budget_items_own" ON public.budget_items
  USING (
    EXISTS (
      SELECT 1 FROM public.budget_profiles bp
      WHERE bp.id = budget_id AND bp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.budget_profiles bp
      WHERE bp.id = budget_id AND bp.user_id = auth.uid()
    )
  );

COMMENT ON TABLE  public.budget_items IS 'Individual expense categories within a budget_profile';
COMMENT ON COLUMN public.budget_items.category_type IS 'fixed = rent/loan; variable = food/transport';

-- ============================================================
-- Migration: 20260604000000_update_budget_profiles_fire
-- Purpose:   Extend budget_profiles for FIRE tracker:
--            - add spend_amount, other_income, starting_corpus
--            - make name nullable (auto-generated from month)
--            - enforce one record per (user, month)
-- Rollback:  rollback/rollback_20260604000000.sql
-- ============================================================

-- 1. Add new columns
ALTER TABLE public.budget_profiles
  ADD COLUMN spend_amount     NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (spend_amount >= 0),
  ADD COLUMN other_income     JSONB         NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN starting_corpus  NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (starting_corpus >= 0);

-- 2. Make name nullable (was NOT NULL; we auto-generate it now)
ALTER TABLE public.budget_profiles
  ALTER COLUMN name DROP NOT NULL;

-- 3. Enforce first-of-month storage (budget_month must be YYYY-MM-01)
ALTER TABLE public.budget_profiles
  ADD CONSTRAINT budget_profiles_month_first_of_month
    CHECK (EXTRACT(DAY FROM budget_month) = 1);

-- 4. One record per user per month
ALTER TABLE public.budget_profiles
  ADD CONSTRAINT budget_profiles_user_month_unique
    UNIQUE (user_id, budget_month);

COMMENT ON COLUMN public.budget_profiles.spend_amount    IS 'Total monthly spend (income - spend = savings)';
COMMENT ON COLUMN public.budget_profiles.other_income    IS 'Additional income sources: [{label: text, amount: numeric}]';
COMMENT ON COLUMN public.budget_profiles.starting_corpus IS 'Existing savings/investments at time of first record (used as FIRE projection base)';

-- ============================================================
-- Migration: 20260530000000_add_save_metadata
-- Adds optional metadata fields to salary_calculations
-- person_name, calculation_month, comment
-- ============================================================

ALTER TABLE public.salary_calculations
  ADD COLUMN IF NOT EXISTS person_name        TEXT,
  ADD COLUMN IF NOT EXISTS calculation_month  DATE,
  ADD COLUMN IF NOT EXISTS comment            TEXT;

COMMENT ON COLUMN public.salary_calculations.person_name       IS 'Optional label — whose salary this calculation is for';
COMMENT ON COLUMN public.salary_calculations.calculation_month IS 'Optional month this calculation applies to (stored as first day of month)';
COMMENT ON COLUMN public.salary_calculations.comment           IS 'Optional free-text note from the user';

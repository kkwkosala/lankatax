-- Rollback: 20260604000000_update_budget_profiles_fire
ALTER TABLE public.budget_profiles
  DROP CONSTRAINT IF EXISTS budget_profiles_user_month_unique,
  DROP CONSTRAINT IF EXISTS budget_profiles_month_first_of_month,
  DROP COLUMN IF EXISTS starting_corpus,
  DROP COLUMN IF EXISTS other_income,
  DROP COLUMN IF EXISTS spend_amount;

ALTER TABLE public.budget_profiles
  ALTER COLUMN name SET NOT NULL;

# 03 — Database Schema

## Overview

All tables use PostgreSQL via Supabase. Every table has:
- `UUID` primary keys (`gen_random_uuid()`)
- `created_at TIMESTAMPTZ DEFAULT NOW()`
- Row Level Security (RLS) **enabled**
- Explicit RLS policies (no table is left open)

---

## Migration Files

| File | Purpose |
|---|---|
| `20260601000000_create_tax_tables.sql` | `tax_rules`, `tax_slabs`, `tax_years` |
| `20260601000100_create_users_table.sql` | `users` |
| `20260615000000_create_salary_tables.sql` | `salary_profiles`, `salary_calculations` |
| `20260615000100_create_audit_logs.sql` | `audit_logs` |
| `20260629000000_create_exchange_rates.sql` | `exchange_rates` |
| `20260727000000_create_budget_tables.sql` | `budget_profiles`, `budget_items` |
| `20260727000100_create_app_config.sql` | `app_config` (feature flags) |

---

## Migration 1 — Tax Tables

```sql
-- ============================================================
-- tax_years: Sri Lankan fiscal year definitions (Apr 1 – Mar 31)
-- ============================================================
CREATE TABLE tax_years (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  label         TEXT        NOT NULL UNIQUE,  -- e.g. '2024/2025'
  start_date    DATE        NOT NULL,         -- e.g. 2024-04-01
  end_date      DATE        NOT NULL,         -- e.g. 2025-03-31
  is_current    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_tax_years_current ON tax_years (is_current)
  WHERE is_current = TRUE;  -- Only one current tax year

ALTER TABLE tax_years ENABLE ROW LEVEL SECURITY;
-- Everyone can read; only admins can write
CREATE POLICY "tax_years_read_all"   ON tax_years FOR SELECT USING (true);
CREATE POLICY "tax_years_admin_write" ON tax_years FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================
-- tax_rules: Configurable rates (EPF, ETF, etc.)
-- ============================================================
CREATE TABLE tax_rules (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type      TEXT        NOT NULL,
  -- Values: 'epf_employee_rate' | 'epf_employer_rate' | 'etf_employer_rate'
  --         | 'annual_tax_relief_default' | 'pegging_formula'
  rate_value     NUMERIC(8, 6) NOT NULL,  -- Stored as decimal: 0.08 = 8%
  effective_date DATE         NOT NULL,
  created_by     UUID         REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tax_rules_type_date ON tax_rules (rule_type, effective_date DESC);

ALTER TABLE tax_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tax_rules_read_all"    ON tax_rules FOR SELECT USING (true);
CREATE POLICY "tax_rules_admin_write" ON tax_rules FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ============================================================
-- tax_slabs: APIT slab tiers
-- ============================================================
CREATE TABLE tax_slabs (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_year_id     UUID         NOT NULL REFERENCES tax_years(id),
  effective_date  DATE         NOT NULL,
  lower_bound     NUMERIC(14,2) NOT NULL,              -- Monthly LKR
  upper_bound     NUMERIC(14,2),                        -- NULL = top slab (no ceiling)
  rate            NUMERIC(5,4)  NOT NULL,               -- 0.0600 = 6%
  fixed_amount    NUMERIC(14,2) NOT NULL DEFAULT 0,     -- Fixed LKR amount for this slab
  slab_order      INTEGER       NOT NULL,               -- 1, 2, 3... for ordering
  created_by      UUID          REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tax_slabs_year_date ON tax_slabs (tax_year_id, effective_date DESC);
CREATE INDEX idx_tax_slabs_order     ON tax_slabs (effective_date DESC, slab_order ASC);

ALTER TABLE tax_slabs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tax_slabs_read_all"    ON tax_slabs FOR SELECT USING (true);
CREATE POLICY "tax_slabs_admin_write" ON tax_slabs FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
```

---

## Migration 2 — Users Table

```sql
-- ============================================================
-- users: Profile linked to Supabase Auth
-- ============================================================
CREATE TABLE users (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role         TEXT        NOT NULL DEFAULT 'user',
  -- 'user' | 'admin'  (admin set via app_metadata, not user-editable)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own"   ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM users WHERE id = auth.uid()));
-- Users cannot change their own role

-- Auto-create user profile on first sign-in
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE(NEW.raw_app_meta_data ->> 'role', 'user')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Migration 3 — Salary Tables

```sql
-- ============================================================
-- salary_profiles: Saved salary configurations
-- ============================================================
CREATE TABLE salary_profiles (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT         NOT NULL,
  basic_salary        NUMERIC(14,2) NOT NULL DEFAULT 0,
  fixed_allowances    NUMERIC(14,2) NOT NULL DEFAULT 0,
  transport_allowance NUMERIC(14,2) NOT NULL DEFAULT 0,
  data_allowance      NUMERIC(14,2) NOT NULL DEFAULT 0,
  other_allowances    NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_relief_annual   NUMERIC(14,2) NOT NULL DEFAULT 0,
  pegging_enabled     BOOLEAN      NOT NULL DEFAULT FALSE,
  pegging_base_rate   NUMERIC(10,4),
  pegging_usd_value   NUMERIC(12,2),
  is_default          BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_salary_profiles_user ON salary_profiles (user_id);
CREATE UNIQUE INDEX idx_salary_profiles_default ON salary_profiles (user_id)
  WHERE is_default = TRUE;

ALTER TABLE salary_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_all_own" ON salary_profiles
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- salary_calculations: Immutable calculation history
-- ============================================================
CREATE TABLE salary_calculations (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  profile_id           UUID         REFERENCES salary_profiles(id) ON DELETE SET NULL,
  -- Inputs (snapshot)
  basic_salary         NUMERIC(14,2) NOT NULL,
  fixed_allowances     NUMERIC(14,2) NOT NULL DEFAULT 0,
  transport_allowance  NUMERIC(14,2) NOT NULL DEFAULT 0,
  data_allowance       NUMERIC(14,2) NOT NULL DEFAULT 0,
  other_allowances     NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_relief_annual    NUMERIC(14,2) NOT NULL DEFAULT 0,
  pegging_enabled      BOOLEAN      NOT NULL DEFAULT FALSE,
  pegging_base_rate    NUMERIC(10,4),
  pegging_usd_value    NUMERIC(12,2),
  pegging_current_rate NUMERIC(10,4),
  exchange_rate_used   NUMERIC(10,4),
  -- Outputs (snapshot)
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
  -- Tax rule snapshot (protect historical accuracy)
  tax_year_label       TEXT         NOT NULL,
  tax_slabs_snapshot   JSONB        NOT NULL,  -- Full slab set at time of calculation
  epf_employee_rate    NUMERIC(8,6) NOT NULL,
  epf_employer_rate    NUMERIC(8,6) NOT NULL,
  etf_employer_rate    NUMERIC(8,6) NOT NULL,
  -- Metadata
  calculated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_calculations_user_date ON salary_calculations (user_id, calculated_at DESC);

ALTER TABLE salary_calculations ENABLE ROW LEVEL SECURITY;
-- Users can read their own; no UPDATE/DELETE (immutable)
CREATE POLICY "calculations_select_own" ON salary_calculations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "calculations_insert_own" ON salary_calculations
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
-- No UPDATE policy — calculations are immutable
```

---

## Migration 4 — Audit Logs

```sql
-- ============================================================
-- audit_logs: Append-only compliance log
-- ============================================================
CREATE TABLE audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT        NOT NULL,
  -- 'tax_slab' | 'tax_rule' | 'tax_year' | 'salary_calculation'
  -- | 'salary_profile' | 'user' | 'exchange_rate' | 'auth' | 'report'
  entity_id   UUID,
  action      TEXT        NOT NULL,
  -- 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGIN_FAILED'
  -- | 'CALCULATION' | 'REPORT_GENERATED' | 'ADMIN_LOGIN' | 'ACCOUNT_DELETED'
  actor_id    UUID,         -- NULL for system; anonymised after account deletion
  actor_role  TEXT,         -- 'user' | 'admin' | 'system'
  old_values  JSONB,
  new_values  JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_entity      ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_actor_date  ON audit_logs (actor_id, created_at DESC);
CREATE INDEX idx_audit_action_date ON audit_logs (action, created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- Append-only: anyone (service role) can insert; only admins can read
CREATE POLICY "audit_insert_all"  ON audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "audit_admin_read"  ON audit_logs FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');
-- NO UPDATE policy
-- NO DELETE policy
```

---

## Migration 5 — Exchange Rates

```sql
-- ============================================================
-- exchange_rates: USD/LKR rate history
-- ============================================================
CREATE TABLE exchange_rates (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_from TEXT         NOT NULL DEFAULT 'USD',
  currency_to   TEXT         NOT NULL DEFAULT 'LKR',
  rate          NUMERIC(10,4) NOT NULL,
  rate_date     DATE         NOT NULL,
  source        TEXT         NOT NULL DEFAULT 'manual',  -- 'manual' | 'api'
  created_by    UUID         REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exchange_rates_date ON exchange_rates (rate_date DESC);
CREATE UNIQUE INDEX idx_exchange_rates_unique_day
  ON exchange_rates (currency_from, currency_to, rate_date);

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exchange_rates_read_all"    ON exchange_rates FOR SELECT USING (true);
CREATE POLICY "exchange_rates_admin_write" ON exchange_rates FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
```

---

## Migration 6 — Budget Tables

```sql
-- ============================================================
-- budget_profiles: Monthly budget definitions
-- ============================================================
CREATE TABLE budget_profiles (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calculation_id UUID        REFERENCES salary_calculations(id) ON DELETE SET NULL,
  name           TEXT        NOT NULL,
  budget_month   DATE        NOT NULL,  -- First day of budget month
  income_amount  NUMERIC(14,2) NOT NULL DEFAULT 0,  -- From linked calculation
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_budget_profiles_user ON budget_profiles (user_id, budget_month DESC);

ALTER TABLE budget_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "budget_profiles_own" ON budget_profiles
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- budget_items: Individual budget line items
-- ============================================================
CREATE TABLE budget_items (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id      UUID         NOT NULL REFERENCES budget_profiles(id) ON DELETE CASCADE,
  category_name  TEXT         NOT NULL,
  category_type  TEXT         NOT NULL DEFAULT 'variable',  -- 'fixed' | 'variable'
  planned_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  actual_amount  NUMERIC(14,2),
  sort_order     INTEGER      NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_budget_items_budget ON budget_items (budget_id, sort_order);

ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
-- Inherit access from parent budget_profile
CREATE POLICY "budget_items_own" ON budget_items
  USING (
    EXISTS (
      SELECT 1 FROM budget_profiles bp
      WHERE bp.id = budget_id AND bp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_profiles bp
      WHERE bp.id = budget_id AND bp.user_id = auth.uid()
    )
  );
```

---

## Migration 7 — App Config (Feature Flags)

```sql
-- ============================================================
-- app_config: Feature flags and system settings
-- ============================================================
CREATE TABLE app_config (
  key         TEXT    PRIMARY KEY,
  value       JSONB   NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID    REFERENCES auth.users(id)
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_config_read_all"    ON app_config FOR SELECT USING (true);
CREATE POLICY "app_config_admin_write" ON app_config FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Seed feature flags
INSERT INTO app_config (key, value, description) VALUES
  ('ff.pegging.enabled',             '{"enabled": true}',  'Enable pegging allowance calculator'),
  ('ff.usd_conversion.enabled',      '{"enabled": true}',  'Show USD equivalent salary'),
  ('ff.ai_insights.enabled',         '{"enabled": false}', 'AI financial insights (OpenAI)'),
  ('ff.budget_planner.enabled',      '{"enabled": false}', 'Personal budget planning'),
  ('ff.historical_comparison.enabled','{"enabled": false}', 'Tax year comparison'),
  ('ff.pdf_export.enabled',          '{"enabled": true}',  'PDF salary report download');
```

---

## Entity Relationship Diagram

```
auth.users (Supabase managed)
    │
    ├─────────────────────────────────────────────────────────────┐
    │                                                             │
    ▼                                                             ▼
users                                                       audit_logs
(profile + role)                                        (actor_id → user)
    │
    ├──────────────────┐───────────────────────────┐
    │                  │                           │
    ▼                  ▼                           ▼
salary_profiles  salary_calculations          budget_profiles
    │                  │                           │
    │        tax_slabs_snapshot (JSONB)            ▼
    │                                         budget_items
    │
tax_years ──< tax_slabs
tax_rules  (rates by type + effective_date)
exchange_rates
app_config
```

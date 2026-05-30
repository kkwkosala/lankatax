# 02 — Tax Rules & Slabs Seed Data

SQL seed files to populate the database with Sri Lanka's current tax configuration.
Run these after running the schema migrations.

---

## Seed File 1: Tax Year 2024/2025

**File:** `supabase/seed/01_tax_year_2024_2025.sql`

```sql
-- ============================================================
-- Sri Lanka Tax Year 2024/2025
-- Fiscal year: April 1, 2024 – March 31, 2025
-- Authority: Inland Revenue Act No. 24 of 2017 (as amended)
-- ============================================================

INSERT INTO tax_years (id, label, start_date, end_date, is_current) VALUES
(
  '11111111-0000-0000-0000-202420250000',
  '2024/2025',
  '2024-04-01',
  '2025-03-31',
  FALSE   -- Set to TRUE for 2024/2025 if that is the active year on your deployment date
);

INSERT INTO tax_years (id, label, start_date, end_date, is_current) VALUES
(
  '11111111-0000-0000-0000-202520260000',
  '2025/2026',
  '2025-04-01',
  '2026-03-31',
  TRUE    -- Current as of deployment (May 2026)
);
```

---

## Seed File 2: Statutory Rates

**File:** `supabase/seed/02_tax_rules.sql`

```sql
-- ============================================================
-- Statutory rates effective from 2023-10-01
-- Source: Circular No. SEC/2023/E/01 — IRD Sri Lanka
-- Employee EPF: 8% | Employer EPF: 12% | Employer ETF: 3%
-- ============================================================

INSERT INTO tax_rules (rule_type, rate_value, effective_date) VALUES
  ('epf_employee_rate', 0.080000, '2023-10-01'),
  ('epf_employer_rate', 0.120000, '2023-10-01'),
  ('etf_employer_rate', 0.030000, '2023-10-01'),
  ('annual_tax_relief_default', 0.000000, '2023-10-01');

-- ============================================================
-- Template: When rates change, INSERT a new row (never UPDATE)
-- Example: If EPF employee rate increases to 10% from 2026-04-01:
--
-- INSERT INTO tax_rules (rule_type, rate_value, effective_date) VALUES
--   ('epf_employee_rate', 0.100000, '2026-04-01');
--
-- The engine will automatically use 10% for calculations on/after 2026-04-01
-- and 8% for historical calculations before that date.
-- ============================================================
```

---

## Seed File 3: APIT Tax Slabs — 2024/2025

**File:** `supabase/seed/03_tax_slabs_2024_2025.sql`

```sql
-- ============================================================
-- APIT Tax Slabs — Tax Year 2024/2025
-- Source: IRD APIT Table 01 (Monthly) — published April 2024
-- https://www.ird.gov.lk
--
-- All amounts are MONTHLY (annual ÷ 12)
-- Annual exemption: LKR 1,200,000 → Monthly: LKR 100,000
-- ============================================================

DO $$
DECLARE
  v_tax_year_id UUID := '11111111-0000-0000-0000-202420250000';
  v_effective_date DATE := '2024-04-01';
BEGIN

  INSERT INTO tax_slabs
    (tax_year_id, effective_date, lower_bound, upper_bound, rate, fixed_amount, slab_order)
  VALUES
    -- Slab 1: Exempt band — LKR 0 to 100,000/month (annual: 0 to 1,200,000)
    (v_tax_year_id, v_effective_date,      0.00, 100000.00, 0.0000, 0.00, 1),

    -- Slab 2: 6% band — LKR 100,001 to 141,666.67/month (annual: 1,200,001 to 1,700,000)
    (v_tax_year_id, v_effective_date, 100000.00, 141666.67, 0.0600, 0.00, 2),

    -- Slab 3: 12% band — LKR 141,666.68 to 183,333.33/month (annual: 1,700,001 to 2,200,000)
    (v_tax_year_id, v_effective_date, 141666.67, 183333.33, 0.1200, 0.00, 3),

    -- Slab 4: 18% band — LKR 183,333.34 to 225,000/month (annual: 2,200,001 to 2,700,000)
    (v_tax_year_id, v_effective_date, 183333.33, 225000.00, 0.1800, 0.00, 4),

    -- Slab 5: 24% band — LKR 225,001 to 266,666.67/month (annual: 2,700,001 to 3,200,000)
    (v_tax_year_id, v_effective_date, 225000.00, 266666.67, 0.2400, 0.00, 5),

    -- Slab 6: 30% band — LKR 266,666.68 to 308,333.33/month (annual: 3,200,001 to 3,700,000)
    (v_tax_year_id, v_effective_date, 266666.67, 308333.33, 0.3000, 0.00, 6),

    -- Slab 7: 36% band — Over LKR 308,333.33/month (annual: over 3,700,000) — no upper bound
    (v_tax_year_id, v_effective_date, 308333.33,       NULL, 0.3600, 0.00, 7);

END $$;
```

---

## Seed File 4: APIT Tax Slabs — 2025/2026

**File:** `supabase/seed/04_tax_slabs_2025_2026.sql`

```sql
-- ============================================================
-- APIT Tax Slabs — Tax Year 2025/2026
-- Source: IRD APIT Table 01 (Monthly) — published April 2025
-- NOTE: Verify against IRD official publication before use.
--       These slabs match 2024/2025 structure — update if IRD
--       announces changes in the 2025 national budget.
-- ============================================================

DO $$
DECLARE
  v_tax_year_id UUID := '11111111-0000-0000-0000-202520260000';
  v_effective_date DATE := '2025-04-01';
BEGIN

  INSERT INTO tax_slabs
    (tax_year_id, effective_date, lower_bound, upper_bound, rate, fixed_amount, slab_order)
  VALUES
    (v_tax_year_id, v_effective_date,      0.00, 100000.00, 0.0000, 0.00, 1),
    (v_tax_year_id, v_effective_date, 100000.00, 141666.67, 0.0600, 0.00, 2),
    (v_tax_year_id, v_effective_date, 141666.67, 183333.33, 0.1200, 0.00, 3),
    (v_tax_year_id, v_effective_date, 183333.33, 225000.00, 0.1800, 0.00, 4),
    (v_tax_year_id, v_effective_date, 225000.00, 266666.67, 0.2400, 0.00, 5),
    (v_tax_year_id, v_effective_date, 266666.67, 308333.33, 0.3000, 0.00, 6),
    (v_tax_year_id, v_effective_date, 308333.33,       NULL, 0.3600, 0.00, 7);

END $$;
```

---

## Seed File 5: Initial Exchange Rate

**File:** `supabase/seed/05_exchange_rate.sql`

```sql
-- ============================================================
-- USD/LKR initial exchange rate (update to current rate on deploy)
-- ============================================================
INSERT INTO exchange_rates (currency_from, currency_to, rate, rate_date, source)
VALUES ('USD', 'LKR', 320.00, CURRENT_DATE, 'manual');
-- Admin must update this via the Admin panel after deployment
```

---

## Annual APIT Slab Reference Table

For clarity — the full annual and monthly breakdown:

| Slab | Annual Range (LKR) | Monthly Range (LKR) | Rate |
|---|---|---|---|
| 1 — Exempt | 0 – 1,200,000 | 0 – 100,000 | **0%** |
| 2 | 1,200,001 – 1,700,000 | 100,001 – 141,667 | **6%** |
| 3 | 1,700,001 – 2,200,000 | 141,668 – 183,333 | **12%** |
| 4 | 2,200,001 – 2,700,000 | 183,334 – 225,000 | **18%** |
| 5 | 2,700,001 – 3,200,000 | 225,001 – 266,667 | **24%** |
| 6 | 3,200,001 – 3,700,000 | 266,668 – 308,333 | **30%** |
| 7 — Top | Over 3,700,000 | Over 308,333 | **36%** |

---

## How to Update Tax Slabs When Law Changes

When IRD publishes new APIT tables:

1. **Admin logs in** to LankaTax admin panel
2. **Admin → Tax Rules → New Tax Year**
3. Enters new slab boundaries and rates
4. Sets `effective_date` (usually April 1 of new fiscal year)
5. System automatically uses new slabs for calculations on/after that date
6. All past calculations retain their snapshot — unaffected

> ⚠️ **Never edit existing slab rows.** Always insert new rows with a new `effective_date`. The engine uses the latest slabs with `effective_date <= NOW()`.

-- ============================================================
-- LankaTax — Migration: Update 2025/2026 APIT Tax Slabs
-- Source: IRD APIT Tax Table No. 01 (2025/2026)
--         "Monthly Tax Deductions from Regular Profits from Primary Employment"
-- URL:    https://www.ird.gov.lk/en/publications/APIT_Tax_Tables/2025-2026/
-- Date:   2026-07-27
-- ============================================================
--
-- KEY CHANGES FROM 2024/2025:
--   • Personal relief raised: Rs. 100,000/month → Rs. 150,000/month
--     (Annual exemption: Rs. 1,200,000 → Rs. 1,800,000)
--   • 7 bands → 6 bands (12% band removed)
--   • Rates: 0%, 6%, 18%, 24%, 30%, 36%
--   • Formula method: rate × gross_salary − fixed_amount
--     (personal relief is embedded in fixed_amount — do NOT pre-deduct)
--
-- IRD Table 1 Summarized:
--   Band 1: ≤ 150,000           → Relief from Tax (0%)
--   Band 2: 150,001 – 233,333   → 6%  × income − 9,000
--   Band 3: 233,334 – 275,000   → 18% × income − 37,000
--   Band 4: 275,001 – 316,667   → 24% × income − 53,500
--   Band 5: 316,668 – 358,333   → 30% × income − 72,500
--   Band 6: > 358,333           → 36% × income − 94,000
--
-- NOTE: 2024/2025 slabs are preserved for future tax year comparison feature.
-- ============================================================

DO $$
DECLARE
  v_tax_year_id UUID := '11111111-0000-0000-0000-202520260000';
  v_eff_date    DATE := '2025-04-01';
BEGIN
  -- Remove the incorrect 2025/2026 slabs (copied from 2024/2025)
  DELETE FROM public.tax_slabs WHERE tax_year_id = v_tax_year_id;

  -- Insert official 2025/2026 IRD Table 1 slabs
  -- fixed_amount encodes the personal relief (150,000/month) already applied
  -- Engine MUST apply formula: rate × grossSalary − fixed_amount (NOT progressive slices)
  INSERT INTO public.tax_slabs
    (tax_year_id, effective_date, lower_bound, upper_bound, rate, fixed_amount, slab_order)
  VALUES
    -- Band 1: Relief from Tax — monthly income up to Rs. 150,000
    (v_tax_year_id, v_eff_date,      0.00,  150000.00, 0.0000,      0.00, 1),
    -- Band 2: 6% of income − 9,000  (150,001 – 233,333)
    (v_tax_year_id, v_eff_date, 150000.00,  233333.00, 0.0600,   9000.00, 2),
    -- Band 3: 18% of income − 37,000  (233,334 – 275,000)
    (v_tax_year_id, v_eff_date, 233333.00,  275000.00, 0.1800,  37000.00, 3),
    -- Band 4: 24% of income − 53,500  (275,001 – 316,667)
    (v_tax_year_id, v_eff_date, 275000.00,  316667.00, 0.2400,  53500.00, 4),
    -- Band 5: 30% of income − 72,500  (316,668 – 358,333)
    (v_tax_year_id, v_eff_date, 316667.00,  358333.00, 0.3000,  72500.00, 5),
    -- Band 6: 36% of income − 94,000  (above 358,333)
    (v_tax_year_id, v_eff_date, 358333.00,       NULL, 0.3600,  94000.00, 6);

  RAISE NOTICE 'Updated 2025/2026 APIT slabs to official IRD Table 1 values (6 bands, 150k monthly relief)';
END $$;

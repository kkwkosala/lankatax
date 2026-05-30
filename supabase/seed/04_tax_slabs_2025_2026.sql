-- ============================================================
-- LankaTax — Seed File 4: APIT Tax Slabs 2025/2026
-- Source: IRD APIT Tax Table No. 01 (2025/2026)
--         "Monthly Tax Deductions from Regular Profits from Primary Employment"
-- URL:    https://www.ird.gov.lk/en/publications/APIT_Tax_Tables/2025-2026/
--
-- KEY CHANGES FROM 2024/2025:
--   • Personal relief: Rs. 100,000/month → Rs. 150,000/month (annual Rs. 1.8M)
--   • 7 bands → 6 bands (12% band removed entirely)
--   • Rates: 0%, 6%, 18%, 24%, 30%, 36%
--   • Formula: rate × gross_salary − fixed_amount (applied to GROSS — no pre-deductions)
--
-- IRD explicitly states: apply table WITHOUT deducting any sum from employment profits.
-- Personal relief is embedded in fixed_amount values.
-- ============================================================

DO $$
DECLARE
  v_tax_year_id UUID := '11111111-0000-0000-0000-202520260000';
  v_eff_date    DATE := '2025-04-01';
BEGIN
  INSERT INTO public.tax_slabs
    (tax_year_id, effective_date, lower_bound, upper_bound, rate, fixed_amount, slab_order)
  VALUES
    -- Band 1: Relief from Tax (0%) — monthly income up to Rs. 150,000
    (v_tax_year_id, v_eff_date,      0.00,  150000.00, 0.0000,      0.00, 1),
    -- Band 2: 6%  × income − 9,000    (150,001 – 233,333)
    (v_tax_year_id, v_eff_date, 150000.00,  233333.00, 0.0600,   9000.00, 2),
    -- Band 3: 18% × income − 37,000   (233,334 – 275,000)
    (v_tax_year_id, v_eff_date, 233333.00,  275000.00, 0.1800,  37000.00, 3),
    -- Band 4: 24% × income − 53,500   (275,001 – 316,667)
    (v_tax_year_id, v_eff_date, 275000.00,  316667.00, 0.2400,  53500.00, 4),
    -- Band 5: 30% × income − 72,500   (316,668 – 358,333)
    (v_tax_year_id, v_eff_date, 316667.00,  358333.00, 0.3000,  72500.00, 5),
    -- Band 6: 36% × income − 94,000   (above 358,333)
    (v_tax_year_id, v_eff_date, 358333.00,        NULL, 0.3600,  94000.00, 6);
END $$;

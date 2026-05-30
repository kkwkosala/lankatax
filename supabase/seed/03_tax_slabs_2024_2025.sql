-- ============================================================
-- LankaTax — Seed File 3: APIT Tax Slabs 2024/2025
-- Source: IRD APIT Table 01 (Monthly) — April 2024
-- Authority: Inland Revenue Act No. 24 of 2017 (as amended)
-- Annual exemption: LKR 1,200,000 → Monthly: LKR 100,000
-- All bounds are MONTHLY amounts
-- ============================================================

DO $$
DECLARE
  v_tax_year_id UUID   := '11111111-0000-0000-0000-202420250000';
  v_eff_date    DATE   := '2024-04-01';
BEGIN
  INSERT INTO public.tax_slabs
    (tax_year_id, effective_date, lower_bound, upper_bound, rate, fixed_amount, slab_order)
  VALUES
    -- Band 1: 0% — Monthly 0 to 100,000 (Annual 0 to 1,200,000)
    (v_tax_year_id, v_eff_date,      0.00, 100000.00, 0.0000, 0.00, 1),
    -- Band 2: 6% — Monthly 100,001 to 141,666.67 (Annual 1,200,001 to 1,700,000)
    (v_tax_year_id, v_eff_date, 100000.00, 141666.67, 0.0600, 0.00, 2),
    -- Band 3: 12% — Monthly 141,666.68 to 183,333.33 (Annual 1,700,001 to 2,200,000)
    (v_tax_year_id, v_eff_date, 141666.67, 183333.33, 0.1200, 0.00, 3),
    -- Band 4: 18% — Monthly 183,333.34 to 225,000 (Annual 2,200,001 to 2,700,000)
    (v_tax_year_id, v_eff_date, 183333.33, 225000.00, 0.1800, 0.00, 4),
    -- Band 5: 24% — Monthly 225,001 to 266,666.67 (Annual 2,700,001 to 3,200,000)
    (v_tax_year_id, v_eff_date, 225000.00, 266666.67, 0.2400, 0.00, 5),
    -- Band 6: 30% — Monthly 266,666.68 to 308,333.33 (Annual 3,200,001 to 3,700,000)
    (v_tax_year_id, v_eff_date, 266666.67, 308333.33, 0.3000, 0.00, 6),
    -- Band 7: 36% — Over 308,333 monthly (Over 3,700,000 annually) — no upper bound
    (v_tax_year_id, v_eff_date, 308333.33,       NULL, 0.3600, 0.00, 7);
END $$;

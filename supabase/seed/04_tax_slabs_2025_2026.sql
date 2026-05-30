-- ============================================================
-- LankaTax — Seed File 4: APIT Tax Slabs 2025/2026
-- NOTE: Verify against IRD official APIT publication for 2025/2026
--       before running on production. Update if national budget
--       announces slab changes.
-- ============================================================

DO $$
DECLARE
  v_tax_year_id UUID   := '11111111-0000-0000-0000-202520260000';
  v_eff_date    DATE   := '2025-04-01';
BEGIN
  INSERT INTO public.tax_slabs
    (tax_year_id, effective_date, lower_bound, upper_bound, rate, fixed_amount, slab_order)
  VALUES
    (v_tax_year_id, v_eff_date,      0.00, 100000.00, 0.0000, 0.00, 1),
    (v_tax_year_id, v_eff_date, 100000.00, 141666.67, 0.0600, 0.00, 2),
    (v_tax_year_id, v_eff_date, 141666.67, 183333.33, 0.1200, 0.00, 3),
    (v_tax_year_id, v_eff_date, 183333.33, 225000.00, 0.1800, 0.00, 4),
    (v_tax_year_id, v_eff_date, 225000.00, 266666.67, 0.2400, 0.00, 5),
    (v_tax_year_id, v_eff_date, 266666.67, 308333.33, 0.3000, 0.00, 6),
    (v_tax_year_id, v_eff_date, 308333.33,       NULL, 0.3600, 0.00, 7);
END $$;

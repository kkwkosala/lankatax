-- ============================================================
-- LankaTax — Seed File 2: Tax Rules (Statutory Rates)
-- Source: Employees' Provident Fund Act, Employees' Trust Fund Act
-- Effective: 2023-10-01
-- ============================================================

INSERT INTO public.tax_rules (rule_type, rate_value, effective_date) VALUES
  ('epf_employee_rate',       0.080000, '2023-10-01'),
  ('epf_employer_rate',       0.120000, '2023-10-01'),
  ('etf_employer_rate',       0.030000, '2023-10-01'),
  ('annual_tax_relief_default', 0.000000, '2023-10-01');

-- ============================================================
-- To update rates: INSERT a new row — never UPDATE existing rows
-- Example (if EPF employee rate changes to 10% from 2026-04-01):
--
-- INSERT INTO public.tax_rules (rule_type, rate_value, effective_date)
-- VALUES ('epf_employee_rate', 0.100000, '2026-04-01');
-- ============================================================

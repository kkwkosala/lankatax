-- ============================================================
-- LankaTax — Seed File 1: Tax Years
-- Sri Lanka fiscal year: April 1 – March 31
-- Run after schema migrations
-- ============================================================

INSERT INTO public.tax_years (id, label, start_date, end_date, is_current) VALUES
(
  '11111111-0000-0000-0000-202420250000',
  '2024/2025',
  '2024-04-01',
  '2025-03-31',
  FALSE
),
(
  '11111111-0000-0000-0000-202520260000',
  '2025/2026',
  '2025-04-01',
  '2026-03-31',
  TRUE
);

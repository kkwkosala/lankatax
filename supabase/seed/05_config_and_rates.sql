-- ============================================================
-- LankaTax — Seed File 5: Initial Exchange Rate & Feature Flags
-- Update exchange rate to current market rate before production deploy
-- ============================================================

-- Exchange rate (update to current USD/LKR before deploying)
INSERT INTO public.exchange_rates (currency_from, currency_to, rate, rate_date, source)
VALUES ('USD', 'LKR', 320.00, CURRENT_DATE, 'manual');

-- Feature flags
INSERT INTO public.app_config (key, value, description) VALUES
  ('ff.pegging.enabled',              '{"enabled": true}',  'Enable pegging allowance calculator'),
  ('ff.usd_conversion.enabled',       '{"enabled": true}',  'Show USD equivalent salary'),
  ('ff.budget_planner.enabled',       '{"enabled": false}', 'Personal budget planning module'),
  ('ff.historical_comparison.enabled','{"enabled": false}', 'Tax year comparison feature'),
  ('ff.pdf_export.enabled',           '{"enabled": true}',  'PDF salary report download');

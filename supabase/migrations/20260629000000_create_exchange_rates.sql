-- ============================================================
-- Migration: 20260629000000_create_exchange_rates
-- Creates: exchange_rates
-- Depends on: 20260601000100_create_users_table
-- Rollback: rollback/rollback_20260629000000.sql
-- ============================================================

CREATE TABLE public.exchange_rates (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_from TEXT          NOT NULL DEFAULT 'USD' CHECK (length(currency_from) = 3),
  currency_to   TEXT          NOT NULL DEFAULT 'LKR' CHECK (length(currency_to) = 3),
  rate          NUMERIC(10,4) NOT NULL CHECK (rate > 0),
  rate_date     DATE          NOT NULL,
  source        TEXT          NOT NULL DEFAULT 'manual'
                              CHECK (source IN ('manual', 'api')),
  created_by    UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Latest rate lookup
CREATE INDEX idx_exchange_rates_date
  ON public.exchange_rates (rate_date DESC);

-- One rate per currency pair per day
CREATE UNIQUE INDEX idx_exchange_rates_unique_per_day
  ON public.exchange_rates (currency_from, currency_to, rate_date);

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Everyone can read rates (used anonymously for calculations)
CREATE POLICY "exchange_rates_select_all" ON public.exchange_rates
  FOR SELECT USING (true);

-- Only admins can insert
CREATE POLICY "exchange_rates_insert_admin" ON public.exchange_rates
  FOR INSERT WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

-- NO UPDATE — insert new entry with today's date to update rate
-- NO DELETE

COMMENT ON TABLE  public.exchange_rates IS 'USD/LKR rate history. One record per currency pair per day.';
COMMENT ON COLUMN public.exchange_rates.rate IS 'LKR per 1 USD (e.g. 320.0000 means USD 1 = LKR 320)';

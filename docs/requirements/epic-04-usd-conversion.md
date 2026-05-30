# EPIC 4 — USD Conversion Module

**Epic Label:** `epic:usd-conversion`  
**Priority:** 🟠 High  
**Sprint:** 3  
**GitHub Milestone:** Sprint 3 — Pegging & USD

---

## Epic Goal
Display the USD equivalent of the user's LKR gross salary using a current exchange rate, with support for manual rate entry and optional automated daily rate fetching.

---

## User Stories

### US-4.1 — Display USD Equivalent Salary
**As a** Sri Lankan employee  
**I want to** see my gross salary converted to USD  
**So that** I can understand my salary in an internationally comparable currency  

#### Acceptance Criteria
- **AC1:** Given gross salary LKR 200,000 and rate 320, then USD equivalent = $625.00
- **AC2:** USD value displayed to 2 decimal places with "$" prefix
- **AC3:** Exchange rate used and its date are displayed alongside the USD value
- **AC4:** USD conversion shown on calculation result card and PDF report
- **AC5:** If no exchange rate available, USD field shows "Rate not configured" — no error

#### Business Rules
- BR4.1.1: `usd_equivalent = gross_salary / current_exchange_rate`
- BR4.1.2: Exchange rate is LKR per 1 USD (e.g., 320 means 1 USD = LKR 320)
- BR4.1.3: USD conversion is informational only — it does not affect tax calculations

#### Edge Cases
- Exchange rate = 0 → division by zero protected, show "Invalid rate"
- Very high rate (> 500) or very low rate (< 100) → still calculate, no constraint
- Rate not configured → show "—" not error

---

### US-4.2 — Manual Exchange Rate Entry
**As a** user  
**I want to** manually enter the current USD/LKR exchange rate  
**So that** I can use the exact rate applicable to my situation  

#### Acceptance Criteria
- **AC1:** User can enter a rate directly in the calculator form
- **AC2:** Entered rate is used for both USD conversion and pegging calculations
- **AC3:** Rate is pre-populated from the latest stored rate if available
- **AC4:** User can override the pre-populated rate
- **AC5:** Rate is validated: numeric, > 100, < 1,000

#### Business Rules
- BR4.2.1: User-entered rate overrides any system rate for that calculation
- BR4.2.2: User-entered rate is not persisted as the system rate

---

### US-4.3 — Admin — Configure Exchange Rate Source
**As a** LankaTax administrator  
**I want to** manage the system exchange rate used for all calculations  
**So that** users get an up-to-date rate without manual entry  

#### Acceptance Criteria
- **AC1:** Admin can manually enter and save the current USD/LKR rate
- **AC2:** Rate record includes: rate value, source (manual/api), effective_date
- **AC3:** System displays the rate date so users know how fresh it is
- **AC4:** Admin can view rate history (last 30 entries)
- **AC5:** Rate older than 3 days shows a "stale rate" warning to users

#### Business Rules
- BR4.3.1: Only users with `role = admin` can update system exchange rates
- BR4.3.2: Every rate update creates a new record (immutable history)
- BR4.3.3: Latest rate = most recent `exchange_rates` record by `rate_date`

#### API Requirements
```
GET  /functions/v1/get-exchange-rate       → { rate, rateDate, source, isStale }
POST /functions/v1/admin-exchange-rate     → { rate, source } (admin only)
GET  /functions/v1/admin-exchange-rate/history → [last 30 rates]
```

---

## DB Requirements

```sql
CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_from TEXT NOT NULL DEFAULT 'USD',
  currency_to TEXT NOT NULL DEFAULT 'LKR',
  rate NUMERIC(10, 4) NOT NULL,
  rate_date DATE NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual', -- 'manual' | 'api'
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_exchange_rates_date ON exchange_rates(rate_date DESC);
```

## Definition of Epic Done
- [ ] USD equivalent displayed on all calculation results
- [ ] Rate entry in calculator form with validation
- [ ] Admin rate management UI
- [ ] Stale rate warning (> 3 days old)
- [ ] Rate history table in admin panel

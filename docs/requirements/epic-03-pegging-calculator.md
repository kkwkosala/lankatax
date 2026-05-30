# EPIC 3 — Pegging Calculator

**Epic Label:** `epic:pegging`  
**Priority:** 🟠 High  
**Sprint:** 3  
**GitHub Milestone:** Sprint 3 — Pegging & USD

---

## Epic Goal
Implement the USD-pegged allowance calculator that computes the LKR equivalent of a USD-denominated allowance based on the difference between a contracted base rate and the current exchange rate. This allowance is added to taxable income.

---

## Canonical Formula

```
PeggingAllowance = (CurrentRate - BaseRate) × PeggedUSDValue

IF PeggingAllowance < 0 → PeggingAllowance = 0
(Pegging cannot reduce salary below what it would be without pegging)
```

---

## User Stories

### US-3.1 — Calculate Pegging Allowance
**As a** Sri Lankan employee with a USD-pegged salary component  
**I want to** calculate the LKR value of my pegging allowance  
**So that** I know how much extra income the exchange rate movement has added to my salary  

#### Acceptance Criteria
- **AC1 (Happy path):** Given BaseRate=290, CurrentRate=320, PeggedUSD=1500, then PeggingAllowance = (320-290) × 1500 = LKR 45,000
- **AC2 (No appreciation):** Given CurrentRate ≤ BaseRate, then PeggingAllowance = 0
- **AC3 (Rate parity):** Given CurrentRate = BaseRate, then PeggingAllowance = 0
- **AC4 (Included in gross):** PeggingAllowance is added to gross salary before EPF and APIT
- **AC5 (Tax impact):** APIT is calculated on taxable income that includes PeggingAllowance (minus EPF)
- **AC6 (Toggle off):** Given pegging is disabled, then all pegging fields are hidden and PeggingAllowance = 0

#### Business Rules
- BR3.1.1: `pegging_allowance = MAX(0, (current_rate - base_rate) × pegged_usd_value)`
- BR3.1.2: Pegging allowance is fully taxable income
- BR3.1.3: EPF is applied to gross salary inclusive of pegging allowance
- BR3.1.4: Pegging formula is configurable via `tax_rules` table (type: `pegging_formula`)

#### Edge Cases
- CurrentRate < BaseRate → allowance = 0 (no negative pegging deduction)
- Very large USD value (e.g., $10,000) with large rate movement
- BaseRate = 0 (invalid — must be > 0, validation required)
- CurrentRate changes mid-month — calculation uses rate at time of calculation

#### Validation Rules
- BaseRate: required if pegging enabled, numeric, > 0, ≤ 1,000
- CurrentRate: required if pegging enabled, numeric, > 0, ≤ 1,000
- PeggedUSDValue: required if pegging enabled, numeric, > 0, ≤ 1,000,000
- BaseRate must be provided (not defaulted — user must enter their contract rate)

---

### US-3.2 — Scenario Comparison (With vs Without Pegging)
**As a** user with a pegged allowance  
**I want to** compare my salary calculation with and without pegging  
**So that** I can see the isolated impact of the exchange rate movement  

#### Acceptance Criteria
- **AC1:** Side-by-side view shows: Without Pegging | With Pegging
- **AC2:** Difference row highlights: additional gross, additional APIT, net additional take-home
- **AC3:** Net take-home increase = pegging_allowance − additional_epf − additional_apit
- **AC4:** Comparison is generated from a single calculation (no second API call)

#### Business Rules
- BR3.2.1: "Without pegging" baseline = same inputs with pegging_allowance = 0
- BR3.2.2: Both scenarios use the same tax slabs

---

### US-3.3 — Rate Sensitivity Analysis
**As a** user  
**I want to** see how different exchange rates would affect my pegging allowance  
**So that** I can plan for rate fluctuations  

#### Acceptance Criteria
- **AC1:** User can enter a range of rates (e.g., 280–340 in steps of 10)
- **AC2:** System shows a table: Rate → Pegging Allowance → APIT Impact → Net Benefit
- **AC3:** Current rate is highlighted in the table
- **AC4:** Chart shows the relationship between rate and net take-home

#### Business Rules
- BR3.3.1: Sensitivity analysis uses the same salary inputs — only the current rate varies
- BR3.3.2: Maximum 20 rate points in a single analysis

---

### US-3.4 — Save Pegging Configuration
**As a** registered user with a consistent pegging arrangement  
**I want to** save my pegging configuration (base rate, USD value)  
**So that** I don't need to re-enter it every month  

#### Acceptance Criteria
- **AC1:** Pegging config saved as part of salary profile
- **AC2:** Current rate is not saved (it changes daily — must be entered fresh)
- **AC3:** User can update base rate when contract changes
- **AC4:** Toggle state (enabled/disabled) is saved per profile

---

## DB Requirements

Pegging config stored as part of `salary_profiles`:
```sql
pegging_enabled BOOLEAN DEFAULT FALSE,
pegging_base_rate NUMERIC(10,4),
pegging_usd_value NUMERIC(12,2)
-- current_rate always fetched fresh / entered by user
```

## API Requirements
```
POST /functions/v1/calculate-tax
  Body includes: { peggingConfig: { enabled, baseRate, currentRate, usdValue } }
  Returns: { ..., peggingAllowance, peggingBreakdown: { withPegging, withoutPegging } }
```

## Definition of Epic Done
- [ ] Pegging toggle UI implemented
- [ ] Pegging allowance formula correct (verified with manual examples)
- [ ] Cannot produce negative pegging allowance
- [ ] With/without pegging comparison view
- [ ] Rate sensitivity analysis table
- [ ] Pegging config saved per profile

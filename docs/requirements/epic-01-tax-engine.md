# EPIC 1 — Tax Calculation Engine

**Epic Label:** `epic:tax-engine`  
**Priority:** 🔴 Critical  
**Sprint:** 1  
**GitHub Milestone:** Sprint 1 — Tax Engine & Auth

---

## Epic Goal
Build the core configurable APIT/PAYE + EPF/ETF tax calculation engine as Supabase Edge Functions, backed by database-driven tax slabs and rates. This is the foundation of the entire platform.

---

## User Stories

### US-1.1 — Calculate Monthly APIT Tax
**As a** Sri Lankan employee  
**I want to** enter my monthly salary details and receive an accurate APIT tax calculation  
**So that** I know exactly how much income tax will be withheld from my pay  

#### Acceptance Criteria
- **AC1 (Happy path):** Given a user enters basic salary of LKR 200,000 with no allowances, when they submit the calculation, then the system returns the correct APIT tax amount per the active tax slabs
- **AC2 (Below threshold):** Given a user enters a salary below the APIT-free threshold (LKR 100,000/month), when calculated, then APIT tax = LKR 0
- **AC3 (Multi-slab):** Given a salary spanning multiple tax slabs, when calculated, then each portion is taxed at its applicable rate and summed correctly
- **AC4 (Validation):** Given a user enters a negative salary, when submitted, then a validation error is returned and no calculation is performed
- **AC5 (Tax year):** Given multiple tax years exist in the database, when calculating, then the system uses the tax slabs effective on the current date

#### Business Rules
- BR1.1.1: Tax slabs are loaded from `tax_slabs` table filtered by `effective_date <= calculation_date`
- BR1.1.2: APIT is calculated on monthly `taxable_income` (not gross salary)
- BR1.1.3: `taxable_income = gross_salary - employee_epf - tax_relief`
- BR1.1.4: For slabs with a fixed amount: `tax = fixed_amount + (income_in_slab × rate)`
- BR1.1.5: If no tax slabs found for the current date, return an error — never default to zero

#### Edge Cases
- Salary exactly at a slab boundary (e.g., exactly LKR 100,000)
- Tax relief exceeds gross salary → taxable_income = 0, APIT = 0
- Multiple gazette updates in the same tax year — use latest effective_date ≤ today
- Salary of LKR 0 → all values = 0
- Very high salary (> LKR 5,000,000/month) hitting the highest slab

#### API Requirement
```
POST /functions/v1/calculate-tax
Auth: Required (Bearer JWT)
Request: { basicSalary, allowances, taxRelief, peggingConfig?, taxYear? }
Response: { grossSalary, taxableIncome, apitTax, employeeEpf, employerEpf, employerEtf, takeHome, employerCost, peggingAllowance, usdEquivalent }
```

---

### US-1.2 — Calculate Employee EPF Contribution
**As a** Sri Lankan employee  
**I want to** see my mandatory EPF deduction (8%)  
**So that** I understand the total deductions from my gross salary  

#### Acceptance Criteria
- **AC1:** Given gross salary LKR 150,000, when calculated, then employee EPF = LKR 12,000 (8%)
- **AC2:** Given EPF rate is updated by admin to a new rate, when calculated, then the new rate is applied
- **AC3:** Given a user with a salary profile, when EPF rate changes in DB, then recalculating shows the new rate

#### Business Rules
- BR1.2.1: `employee_epf = gross_salary × epf_employee_rate`
- BR1.2.2: `epf_employee_rate` loaded from `tax_rules` table (type: `epf_employee_rate`)
- BR1.2.3: EPF deduction is applied BEFORE calculating taxable income
- BR1.2.4: EPF is calculated on gross salary including pegging allowance

#### Edge Cases
- EPF rate = 0% (edge case for future flexibility)
- Gross salary includes pegging allowance — EPF must be on full gross

---

### US-1.3 — Calculate Employer EPF and ETF Contributions
**As a** Sri Lankan employer / HR manager  
**I want to** see the employer's EPF (12%) and ETF (3%) obligations  
**So that** I can plan the total cost of employing a staff member  

#### Acceptance Criteria
- **AC1:** Given gross salary LKR 150,000, then employer EPF = LKR 18,000 and ETF = LKR 4,500
- **AC2:** Employer cost = gross + employer EPF + employer ETF displayed separately
- **AC3:** Total employer cost is always > gross salary

#### Business Rules
- BR1.3.1: `employer_epf = gross_salary × 12%` (from `tax_rules`)
- BR1.3.2: `employer_etf = gross_salary × 3%` (from `tax_rules`)
- BR1.3.3: `employer_cost = gross_salary + employer_epf + employer_etf`

---

### US-1.4 — Include Tax Relief in Calculation
**As a** Sri Lankan employee  
**I want to** enter my qualifying tax relief amount  
**So that** my taxable income is correctly reduced before APIT is applied  

#### Acceptance Criteria
- **AC1:** Given tax relief = LKR 1,200,000/year (LKR 100,000/month), when calculating a LKR 200,000 salary, then taxable_income is reduced by the relief amount
- **AC2:** Given tax relief > taxable income, then taxable_income = 0 and APIT = 0
- **AC3:** Given no tax relief entered, then tax relief defaults to 0

#### Business Rules
- BR1.4.1: Tax relief is the annual amount entered by the user (converted to monthly for monthly calculation)
- BR1.4.2: `taxable_income = gross_salary - employee_epf - (annual_tax_relief / 12)`
- BR1.4.3: Taxable income cannot be negative — floor at 0

#### Validation Rules
- Tax relief: optional, numeric, ≥ 0, ≤ 3,000,000 LKR (annual)

---

### US-1.5 — View Complete Take-Home Salary
**As a** Sri Lankan employee  
**I want to** see my final take-home salary after all deductions  
**So that** I know exactly what will be credited to my bank account  

#### Acceptance Criteria
- **AC1:** `take_home = gross_salary - employee_epf - apit_tax`
- **AC2:** Take-home is always ≤ gross salary
- **AC3:** Take-home is always ≥ 0
- **AC4:** Calculation result includes a timestamp and the tax year used

#### Business Rules
- BR1.5.1: `take_home = gross_salary - employee_epf - apit_tax`
- BR1.5.2: Result includes metadata: `calculated_at`, `tax_year`, `tax_slab_version`

---

### US-1.6 — Calculation History
**As a** registered user  
**I want to** automatically save each calculation I perform  
**So that** I can review past calculations and track changes over time  

#### Acceptance Criteria
- **AC1:** Every calculation by a logged-in user is saved to `salary_calculations` table
- **AC2:** Anonymous calculations are not saved
- **AC3:** User can retrieve last 12 calculations
- **AC4:** Each saved calculation includes all inputs and outputs

#### Business Rules
- BR1.6.1: Calculations are immutable once saved — no editing
- BR1.6.2: RLS ensures user can only read their own calculations

---

## DB Requirements (Sprint 1)

Tables needed:
- `tax_rules` — EPF/ETF rates keyed by type and effective_date
- `tax_slabs` — APIT slab tiers with lower/upper bounds, rate, fixed_amount
- `salary_calculations` — persisted calculation results

---

## Definition of Epic Done
- [ ] `calculate-tax` Edge Function deployed and returning correct results
- [ ] Tax slabs seeded for current tax year
- [ ] EPF/ETF rates seeded in tax_rules
- [ ] All unit tests passing with 100% slab boundary coverage
- [ ] Results verified against IRD published APIT tables
- [ ] Disclaimer text included in API response metadata

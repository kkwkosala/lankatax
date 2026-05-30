# Phase 1 — Product Discovery
## LankaTax: Sri Lankan Salary Tax & Budgeting Platform

**Status:** ✅ Approved  
**Date:** 2026-05-30  
**Phase:** 1 of 10  
**Author:** AI Delivery Manager / Product Owner  
**Next Phase:** Phase 2 — Requirement Analysis

---

## 📌 Product Vision

> **LankaTax** is a configurable, accurate, and transparent salary tax and budgeting platform built specifically for Sri Lankan employees and employers. It empowers individuals to understand their true take-home pay, plan their budgets, and navigate the Sri Lankan APIT/PAYE tax system with confidence — while giving HR and finance teams a reliable calculation engine that adapts to regulatory changes without code deployments.

---

## 🎯 Goals

| # | Goal |
|---|------|
| G1 | Accurately calculate APIT/PAYE tax based on the latest Sri Lankan Inland Revenue Act slabs |
| G2 | Calculate EPF (8% employee / 12% employer) and ETF (3% employer) contributions |
| G3 | Support pegging allowance calculations tied to USD/LKR exchange rate fluctuations |
| G4 | Provide real-time USD equivalent salary display |
| G5 | Generate detailed salary breakdown reports (PDF/Excel) |
| G6 | Enable historical tax year comparisons |
| G7 | Allow HR admins to update tax slabs via admin UI — no code changes required |
| G8 | Provide AI-driven financial insights and budget recommendations via OpenAI |
| G9 | Support personal budget planning against net take-home pay |
| G10 | Maintain full audit trail for all calculations and configuration changes |

---

## 🚫 Non-Goals

| # | Non-Goal |
|---|----------|
| NG1 | Not a payroll processing system — no bulk payslip generation |
| NG2 | Does not handle corporate income tax or VAT |
| NG3 | Does not integrate with banking APIs in Phase 1 |
| NG4 | Does not file tax returns with IRD directly |
| NG5 | Does not handle foreign-sourced income in Phase 1 |
| NG6 | Does not replace professional tax advisory services |

---

## 🧱 Assumptions

| # | Assumption |
|---|-----------|
| A1 | Tax slabs follow the Inland Revenue (Amendment) Act No. 45 of 2022 and subsequent gazette notices |
| A2 | EPF/ETF rates are fixed at statutory rates (8/12/3%) unless overridden by an admin |
| A3 | Exchange rates are fetched from a configurable source (manual entry or API) |
| A4 | All monetary values are in LKR unless explicitly converted |
| A5 | Users are Sri Lankan residents employed under PAYE/APIT withholding |
| A6 | Supabase provides sufficient scale for MVP user load (< 10,000 MAU) |
| A7 | Tax year follows Sri Lankan fiscal year (April 1 – March 31) |
| A8 | APIT is assessed on monthly income (annualised threshold basis) |

---

## ⚠️ Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R1 | Sri Lankan tax laws change mid-year | High | High | Database-driven slabs with versioning and effective-date controls |
| R2 | Exchange rate volatility affects pegging calculations | High | Medium | Daily rate refresh with manual override capability |
| R3 | Users misinterpret "tax estimate" as legal advice | Medium | High | Prominent disclaimer on all calculation outputs |
| R4 | Supabase RLS misconfiguration exposes user salary data | Low | Critical | Security-first RLS design + audit checklist on every PR |
| R5 | IRD gazetted slab changes not discovered promptly | Medium | High | Admin notification + changelog tracking |
| R6 | USD conversion API rate limits on free tier | Low | Medium | Cache daily rate; allow manual override |

---

## 👤 Personas

### Persona 1 — Sithumi, Software Engineer (Primary)
- **Age:** 27 | **Location:** Colombo 3
- **Goal:** Understand her exact take-home after tax, EPF deductions, and USD-pegged allowance
- **Pain Point:** Manually calculates tax on Excel every month; fears making errors when salary changes
- **Tech Savvy:** High
- **Key Need:** Fast, accurate monthly calculator with full breakdown and USD equivalent
- **Quote:** *"I just want to know exactly what hits my bank account this month."*

### Persona 2 — Ruwan, HR Manager (Secondary)
- **Age:** 42 | **Location:** Kandy
- **Goal:** Verify APIT withholding for 50+ employees; update tax slabs when laws change
- **Pain Point:** Every Finance Gazette requires manually updating spreadsheets across teams
- **Tech Savvy:** Medium
- **Key Need:** Admin panel to update tax slabs; verification of correct deductions
- **Quote:** *"When the budget changes rates, I need to update the system the same day — without calling a developer."*

### Persona 3 — Thilak, Finance Director (Secondary)
- **Age:** 51 | **Location:** Colombo 7
- **Goal:** Compare employer cost year-over-year; plan salary increments vs. total cost
- **Pain Point:** No single tool shows gross salary → total employer cost (EPF + ETF) in one view
- **Tech Savvy:** Low-Medium
- **Key Need:** Reporting, historical comparison, export to Excel
- **Quote:** *"I need to show the board what a 20% salary increase actually costs us including all statutory contributions."*

### Persona 4 — Dilini, Freelance Consultant (Tertiary)
- **Age:** 33 | **Location:** Gampaha
- **Goal:** Understand tax on USD-pegged consulting income converted to LKR
- **Pain Point:** Unsure how USD-LKR rate changes affect her taxable income each month
- **Tech Savvy:** Medium
- **Key Need:** Pegging calculator, USD conversion, tax on pegged income
- **Quote:** *"My contract is in USD but I'm taxed in LKR — it changes every month and I can never work out what I owe."*

---

## 🗺️ User Journeys

### Journey 1 — Monthly Tax Calculation (Sithumi)
```
1. Visit LankaTax → Enter basic salary + allowances
2. Toggle "Pegging Enabled" → Enter base rate + current rate + USD value
3. System calculates: Gross → Taxable Income → APIT Tax → EPF → ETF
4. View full salary breakdown (card + chart)
5. See USD equivalent
6. Download PDF report
7. Save calculation to profile history
```

### Journey 2 — Tax Slab Update (Ruwan — HR Admin)
```
1. Login as Admin
2. Navigate to Tax Rules panel
3. Select tax year → Edit slab thresholds/rates
4. Set effective date (e.g., 2025-04-01)
5. Preview how changes affect a sample salary
6. Save → Audit log recorded
7. All future calculations use new slabs from effective date
```

### Journey 3 — Year-over-Year Comparison (Thilak)
```
1. Login → Navigate to Reports
2. Enter salary (or select saved profile)
3. Choose two tax years to compare
4. System shows: Tax paid, EPF, ETF, employer cost — side by side
5. Export to Excel
```

### Journey 4 — Pegging Allowance (Dilini)
```
1. Enter basic salary (LKR)
2. Enable pegging toggle
3. Enter: Base Rate = 290, Current Rate = 320, USD Value = 1500
4. System computes: Pegging Allowance = (320-290) × 1500 = LKR 45,000
5. Added to taxable income → APIT recalculated
6. View breakdown with and without pegging
```

### Journey 5 — Budget Planning
```
1. View calculated take-home salary
2. Create budget profile → Add expense categories (rent, food, transport...)
3. System shows: Income vs. Expenses vs. Savings gap
4. AI recommends reallocation based on Sri Lankan cost benchmarks
```

---

## 🏛️ Domain Model

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DOMAIN MODEL                                │
├──────────────────────┬──────────────────────────────────────────────┤
│  AGGREGATE           │  ENTITIES / VALUE OBJECTS                    │
├──────────────────────┼──────────────────────────────────────────────┤
│ User                 │ UserProfile, AuthIdentity                    │
│ SalaryProfile        │ AllowanceSet, PeggingConfig                  │
│ SalaryCalculation    │ GrossSalary, TaxableIncome, APitTax,         │
│                      │ EmployeeEPF, EmployerEPF, EmployerETF,       │
│                      │ TakeHomeSalary, EmployerCost,                │
│                      │ PeggingAllowance, UsdEquivalent              │
│ TaxRule              │ TaxYear, EffectiveDate, RuleType, Rate       │
│ TaxSlab              │ LowerBound, UpperBound, Rate, FixedAmount    │
│ ExchangeRate         │ Currency, Rate, RateDate, Source             │
│ BudgetProfile        │ BudgetItem, Category, PlannedAmt, ActualAmt │
│ AuditLog             │ EntityType, EntityId, Action, Actor,         │
│                      │ OldValues, NewValues, Timestamp              │
└──────────────────────┴──────────────────────────────────────────────┘
```

### Relationships
```
User ──────────< SalaryProfile ──────────< SalaryCalculation
TaxRule ────────< TaxSlab
ExchangeRate ───> PeggingConfig (via current_rate)
User ──────────< BudgetProfile ──────────< BudgetItem
All mutations ──> AuditLog
```

---

## 🔢 Core Calculation Flow

```
INPUT:
  BasicSalary, FixedAllowances, TransportAllowance, DataAllowance,
  OtherAllowances, TaxRelief, PeggingEnabled, BaseRate,
  CurrentExchangeRate, PeggedUSDValue

STEP 1 — Pegging Allowance:
  IF PeggingEnabled:
    PeggingAllowance = (CurrentRate - BaseRate) × PeggedUSDValue
  ELSE:
    PeggingAllowance = 0

STEP 2 — Gross Salary:
  GrossSalary = BasicSalary + FixedAllowances + TransportAllowance
                + DataAllowance + OtherAllowances + PeggingAllowance

STEP 3 — Employee EPF:
  EmployeeEPF = GrossSalary × 8%           [from tax_rules table]

STEP 4 — Taxable Income:
  TaxableIncome = GrossSalary - EmployeeEPF - TaxRelief

STEP 5 — APIT Tax:
  APitTax = ApplySlabs(TaxableIncome, ActiveTaxSlabs)  [from tax_slabs table]

STEP 6 — Take-Home:
  TakeHome = GrossSalary - EmployeeEPF - APitTax

STEP 7 — Employer Contributions:
  EmployerEPF  = GrossSalary × 12%          [from tax_rules table]
  EmployerETF  = GrossSalary × 3%           [from tax_rules table]

STEP 8 — Employer Cost:
  EmployerCost = GrossSalary + EmployerEPF + EmployerETF

STEP 9 — USD Equivalent:
  USDEquivalent = GrossSalary ÷ CurrentExchangeRate

OUTPUT:
  GrossSalary, TaxableIncome, APitTax, EmployeeEPF,
  EmployerEPF, EmployerETF, TakeHome, EmployerCost,
  PeggingAllowance, USDEquivalent
```

---

## 📋 Sri Lankan APIT Tax Slabs (Tax Year 2023/2024)

*Stored in `tax_slabs` table — configurable by admin. Below are reference values.*

| Monthly Taxable Income (LKR) | Rate | Notes |
|---|---|---|
| 0 – 100,000 | 0% | Tax-free threshold (monthly basis: 1,200,000 ÷ 12) |
| 100,001 – 141,667 | 6% | (annual: 1,200,001 – 1,700,000) |
| 141,668 – 225,000 | 12% | (annual: 1,700,001 – 2,700,000) |
| 225,001 – 308,333 | 18% | (annual: 2,700,001 – 3,700,000) |
| 308,334 – 391,667 | 24% | (annual: 3,700,001 – 4,700,000) |
| 391,668 – 541,667 | 30% | (annual: 4,700,001 – 6,500,000) |
| 541,668 and above | 36% | (annual: above 6,500,000) |

*Note: Slabs may have been updated by subsequent gazettes. Admin must verify and update via the admin panel when new gazettes are published.*

---

## 🗺️ Proposed Epics (Phase 2 Preview)

| Epic | Title | Priority |
|---|---|---|
| EPIC 1 | Tax Calculation Engine | Critical |
| EPIC 2 | Salary Breakdown Module | Critical |
| EPIC 3 | Pegging Calculator | High |
| EPIC 4 | USD Conversion Module | High |
| EPIC 5 | Tax Rule Administration | High |
| EPIC 6 | Reporting & Exports | Medium |
| EPIC 7 | Authentication & Profiles | Critical |
| EPIC 8 | AI Financial Insights | Low (Sprint 6) |
| EPIC 9 | Budget Planning | Medium |
| EPIC 10 | Audit & Compliance | High |

---

## ✅ Phase 1 Deliverables

| Artifact | Status |
|----------|--------|
| Product Vision | ✅ Complete |
| Goals & Non-Goals | ✅ Complete |
| Assumptions | ✅ Complete |
| Risks | ✅ Complete |
| Personas (4) | ✅ Complete |
| User Journeys (5) | ✅ Complete |
| Domain Model | ✅ Complete |
| Calculation Flow | ✅ Complete |
| APIT Slab Reference | ✅ Complete |
| Epic Map (preview) | ✅ Complete |

---

## ✍️ Approval

| Role | Name | Status | Date |
|---|---|---|---|
| Product Owner | Koshala Wickramasinghe | ✅ Approved | 2026-05-30 |
| Solution Architect | AI Architect Agent | ✅ Approved | 2026-05-30 |

---

**Next:** [Phase 2 — Requirement Analysis](../requirements/) — Epics, User Stories, Acceptance Criteria, GitHub Issues

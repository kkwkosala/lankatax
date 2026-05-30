# Phase 2 — Requirement Analysis
## LankaTax: Sri Lankan Salary Tax & Budgeting Platform

**Status:** ✅ Complete  
**Date:** 2026-05-30  
**Phase:** 2 of 10  
**Previous Phase:** [Phase 1 — Product Discovery](../product-discovery/phase-01-product-discovery.md)  
**Next Phase:** Phase 3 — Solution Architecture

---

## Epic Index

| Epic | Title | Stories | Priority | Sprint |
|------|-------|---------|----------|--------|
| [EPIC 1](epic-01-tax-engine.md) | Tax Calculation Engine | 6 | 🔴 Critical | 1 |
| [EPIC 2](epic-02-salary-breakdown.md) | Salary Breakdown Module | 5 | 🔴 Critical | 1–2 |
| [EPIC 3](epic-03-pegging-calculator.md) | Pegging Calculator | 4 | 🟠 High | 3 |
| [EPIC 4](epic-04-usd-conversion.md) | USD Conversion Module | 3 | 🟠 High | 3 |
| [EPIC 5](epic-05-tax-admin.md) | Tax Rule Administration | 5 | 🟠 High | 2 |
| [EPIC 6](epic-06-reporting.md) | Reporting & Exports | 4 | 🟡 Medium | 4 |
| [EPIC 7](epic-07-auth-profiles.md) | Authentication & Profiles | 5 | 🔴 Critical | 1 |
| [EPIC 8](epic-08-ai-insights.md) | ~~AI Financial Insights~~ *(removed — external API cost)* | - | - | - |
| [EPIC 9](epic-09-budget-planning.md) | Budget Planning | 4 | 🟡 Medium | 5 |
| [EPIC 10](epic-10-audit-compliance.md) | Audit & Compliance | 4 | 🟠 High | 2 |

---

## Sprint Allocation Summary

| Sprint | Focus | Epics |
|--------|-------|-------|
| Sprint 1 | Core Engine + Auth | EPIC 1 (Tax Engine), EPIC 7 (Auth) |
| Sprint 2 | Breakdown + Admin | EPIC 2 (Breakdown), EPIC 5 (Tax Admin), EPIC 10 (Audit) |
| Sprint 3 | Pegging + USD | EPIC 3 (Pegging), EPIC 4 (USD) |
| Sprint 4 | Reporting | EPIC 6 (Reports) |
| Sprint 5 | Budget Planner | EPIC 9 (Budget) |
| Sprint 6 | Audit & Compliance | EPIC 10 (Audit) |

---

## Global Business Rules

| # | Rule |
|---|------|
| BR-G1 | All tax calculations are estimates — disclaimer must be shown on every result |
| BR-G2 | Tax slabs and rates are NEVER hardcoded — always loaded from database |
| BR-G3 | Calculations use the tax rules effective on the calculation date |
| BR-G4 | All salary values are in LKR unless explicitly stated otherwise |
| BR-G5 | User salary data is private — never accessible by other users |
| BR-G6 | All admin changes to tax rules are audited with before/after values |
| BR-G7 | Historical calculations are preserved — never retroactively modified |
| BR-G8 | APIT is calculated on monthly taxable income (annualised slab method) |

---

## Global Validation Rules

| Field | Rule |
|-------|------|
| Basic Salary | Required, numeric, ≥ 0, ≤ 100,000,000 (LKR) |
| Any Allowance | Optional, numeric, ≥ 0, ≤ 50,000,000 (LKR) |
| Tax Relief | Optional, numeric, ≥ 0, ≤ 3,000,000 (LKR) |
| Exchange Rate | Required if pegging enabled, numeric, > 0, ≤ 1,000 |
| USD Value | Required if pegging enabled, numeric, > 0, ≤ 1,000,000 |
| Base Rate | Required if pegging enabled, numeric, > 0, must be ≤ Current Rate |
| Tax Year | Must match an active tax year in tax_rules table |

---

## GitHub Issues Summary

All user stories are tracked as GitHub Issues with:
- Labels: `epic:*`, `priority:*`, `sprint:*`, type (`db`/`backend`/`frontend`)
- Milestones: Sprint 1–6
- Dependencies tracked via "Blocked by" references

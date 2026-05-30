# Phase 4 — Sri Lankan Tax Domain Design

## Overview

This phase defines the **configurable tax engine** for LankaTax — the heart of the platform. All tax rates, slabs, and rules are stored in PostgreSQL and administered through the UI, so no code deployments are needed when Sri Lanka's Inland Revenue Department (IRD) updates the law.

---

## Documents

| # | Document | Purpose |
|---|---|---|
| 1 | [01-tax-engine-spec.md](01-tax-engine-spec.md) | Engine inputs, outputs, configuration model |
| 2 | [02-tax-rules-seed.md](02-tax-rules-seed.md) | SQL seed data — 2024/2025 tax year, slabs, rates |
| 3 | [03-calculation-sequence.md](03-calculation-sequence.md) | Step-by-step calculation with formulas and worked example |
| 4 | [04-unit-test-scenarios.md](04-unit-test-scenarios.md) | 20 test cases covering slab boundaries and edge cases |

---

## Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Tax rates | Database tables (never hardcoded) | Admin can update rates without code change or deployment |
| Tax slabs | Versioned by `effective_date` | Historical calculations stay accurate when slabs change |
| Calculation unit | **Monthly** | APIT is deducted monthly by employers; annual amounts derived |
| EPF relief | Employee EPF deducted before tax slab lookup | Per IRD APIT guidelines |
| Pegging | Pre-calculation step that adds to gross | Pegging allowance is taxable income |
| Slab snapshot | JSONB stored in `salary_calculations` | Freeze tax rules at time of calculation for audit/dispute resolution |
| Negative guard | `MAX(0, value)` on all components | Protect against negative salary edge cases |

---

## Sri Lankan Tax Year

- **Fiscal year:** April 1 – March 31
- **Current tax year:** 2024/2025 (April 1, 2024 – March 31, 2025)
- **Next tax year:** 2025/2026 (April 1, 2025 – March 31, 2026)
- **Calculation cadence:** Monthly (employer deducts APIT each month from salary)
- **APIT threshold:** LKR 100,000/month (LKR 1,200,000 annually)

---

## Statutory Rates (2024/2025)

| Component | Rate | Basis |
|---|---|---|
| Employee EPF | **8%** of gross salary | Employees' Provident Fund Act |
| Employer EPF | **12%** of gross salary | Employees' Provident Fund Act |
| Employer ETF | **3%** of gross salary | Employees' Trust Fund Act |
| APIT | Progressive slabs | Inland Revenue Act No. 24 of 2017 (as amended) |

---

## Configurable Parameters

All values below are stored in `tax_rules` or `tax_slabs` — never hardcoded:

| Parameter | Current Value | `rule_type` |
|---|---|---|
| Employee EPF rate | 0.08 | `epf_employee_rate` |
| Employer EPF rate | 0.12 | `epf_employer_rate` |
| Employer ETF rate | 0.03 | `etf_employer_rate` |
| Default annual tax relief | 0 | `annual_tax_relief_default` |

> When rates change (e.g., new budget), admin inserts a new row in `tax_rules` with the new `effective_date`. The engine always uses the latest rate on or before the calculation date.

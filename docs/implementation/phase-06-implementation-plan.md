# Phase 6 — Implementation Planning

## Overview

LankaTax is delivered across **6 two-week sprints** from June to September 2026. Each sprint is a GitHub Milestone. Every feature follows the full AI-SDLC pipeline before merge.

---

## Sprint Roadmap

| Sprint | Milestone | Dates | Focus | Epics |
|---|---|---|---|---|
| 1 | [Sprint 1 - Tax Engine & Auth](https://github.com/kkwkosala/lankatax/milestone/1) | Jun 1–26 2026 | Foundation: DB + Auth + Tax Engine | EPIC 1, EPIC 7 |
| 2 | [Sprint 2 - Breakdown & Admin](https://github.com/kkwkosala/lankatax/milestone/2) | Jun 27–Jul 10 2026 | Salary UI + Tax Admin | EPIC 2, EPIC 5 |
| 3 | [Sprint 3 - Pegging & USD](https://github.com/kkwkosala/lankatax/milestone/3) | Jul 11–24 2026 | Pegging Calculator + USD Conversion | EPIC 3, EPIC 4 |
| 4 | [Sprint 4 - Reporting](https://github.com/kkwkosala/lankatax/milestone/4) | Jul 25–Aug 7 2026 | Reports, PDF, History Comparison | EPIC 6 |
| 5 | [Sprint 5 - Budget Planner](https://github.com/kkwkosala/lankatax/milestone/5) | Aug 8–21 2026 | Personal Budget Planning | EPIC 9 |
| 6 | [Sprint 6 - Audit & Compliance](https://github.com/kkwkosala/lankatax/milestone/6) | Aug 22–Sep 4 2026 | Audit Trail, Compliance Exports | EPIC 10 |

---

## Implementation Order Rationale

```
Sprint 1 (Foundation — MUST be first)
  ├── Database migrations run on Supabase
  ├── Supabase Auth configured (email + Google OAuth)
  ├── Core tax calculation Edge Function
  └── User profile creation

Sprint 2 (Core UI — depends on Sprint 1 API)
  ├── Angular NX monorepo scaffolded
  ├── Salary calculator UI (consumes calculate-tax Edge Function)
  └── Admin panel for tax rule management

Sprint 3 (Extensions — depends on Sprint 1+2 calculator)
  ├── Pegging allowance module (adds to calculate-tax inputs)
  └── USD conversion display

Sprint 4 (Reporting — depends on Sprint 1+2 calculations)
  ├── PDF/Excel report generation
  ├── Salary history table
  └── Tax year comparison

Sprint 5 (Budget — depends on Sprint 1+2 salary data)
  └── Budget profiles + expense tracking UI

Sprint 6 (Audit — depends on all prior sprints)
  ├── Audit log UI (admin)
  └── Compliance export (CSV)
```

---

## Branch Strategy

```
main          ← production-ready only; protected; requires PR + 1 approval
  └── develop ← integration branch (optional for larger teams)
        └── feature/<issue-number>-<short-description>
              e.g. feature/12-calculate-tax-edge-function
              e.g. feature/25-pegging-calculator-ui
```

### Branch Naming Convention

| Type | Pattern | Example |
|---|---|---|
| Feature | `feature/<issue-number>-<kebab-desc>` | `feature/12-calculate-tax-edge-function` |
| Bug fix | `fix/<issue-number>-<kebab-desc>` | `fix/44-epf-rounding-error` |
| DB migration | `db/<issue-number>-<migration-name>` | `db/8-create-tax-tables` |
| Release | `release/v<major>.<minor>.<patch>` | `release/v1.0.0` |

---

## Sprint Definition of Done

A story is **Done** only when ALL of:
- [ ] Code implemented following Clean Architecture (feature slice)
- [ ] Unit tests written and passing
- [ ] Edge Function: JWT validation present
- [ ] Angular: OnPush change detection; no `any` types
- [ ] CI passes: lint + build + test + security scan
- [ ] PR reviewed (AI review + 1 human approval)
- [ ] Merged to `main` via squash merge
- [ ] GitHub Issue closed and linked to PR

---

## Story Sequencing Rules

Within each sprint, PBIs must ship in this order:

```
[DB] migration PBI → [BE] Edge Function PBI → [FE] Angular PBI
```

Frontend cannot be built before the API exists. API cannot be built before the schema exists.

---

## GitHub Issues → Sprints Mapping

See individual sprint documents for full issue lists:
- [sprint-01.md](sprint-01.md) — Tax Engine & Auth
- [sprint-02.md](sprint-02.md) — Breakdown & Admin
- [sprint-03.md](sprint-03.md) — Pegging & USD
- [sprint-04.md](sprint-04.md) — Reporting
- [sprint-05.md](sprint-05.md) — Budget Planner
- [sprint-06.md](sprint-06.md) — Audit & Compliance

---

## Velocity Assumptions

| Sprint | Story Points | Team Size |
|---|---|---|
| Sprint 1 | 21 pts | 1 developer |
| Sprint 2 | 18 pts | 1 developer |
| Sprint 3 | 13 pts | 1 developer |
| Sprint 4 | 13 pts | 1 developer |
| Sprint 5 | 13 pts | 1 developer |
| Sprint 6 | 10 pts | 1 developer |

Each story point ≈ half a developer day. Adjusted as actuals emerge.

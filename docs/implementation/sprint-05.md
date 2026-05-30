# Sprint 5 — Budget Planner

**Milestone:** [Sprint 5 - Budget Planner](https://github.com/kkwkosala/lankatax/milestone/5)
**Dates:** Aug 8 – Aug 21, 2026 (2 weeks)
**Epics:** EPIC 9 (Budget Planning)
**Goal:** Users can create a monthly budget linked to their salary calculation, track planned vs actual expenses, and see how much of their take-home is allocated.
**Depends on:** Sprint 1 (salary_calculations), Sprint 2 (UI foundation)

---

## Stories

### [BE] Budget API
| # | Story | Points | Issue |
|---|---|---|---|
| 1 | `get-budget` Edge Function: GET list by month | 1 | #33 |
| 2 | `get-budget` Edge Function: POST create budget | 2 | #33 |
| 3 | `get-budget` Edge Function: PUT update budget + items | 2 | #33 |
| 4 | `get-budget` Edge Function: DELETE budget | 1 | #33 |

### [FE] Budget UI
| # | Story | Points | Issue |
|---|---|---|---|
| 5 | Budget dashboard page with month selector | 2 | #34 |
| 6 | Income card (linked from salary calculation) | 1 | #34 |
| 7 | Add/edit expense categories (fixed and variable) | 2 | #34 |
| 8 | Budget summary: planned total, remaining, % allocated | 1 | #34 |
| 9 | Actual vs planned progress bars per category | 1 | #34 |

**Total: 13 story points**

---

## Acceptance Criteria (Sprint Exit)
- [ ] User can create a budget for a month linked to a salary calculation
- [ ] Add/edit/delete expense categories
- [ ] Summary shows: income, total planned, balance
- [ ] Feature flag `ff.budget_planner.enabled = false` hides entire budget section
- [ ] Budget items inherit access RLS from parent budget_profile

---

## Technical Notes
- `budget_month` stored as first day of month: `2026-06-01` = June 2026
- Budget items RLS via parent budget_profile ownership (no direct user_id column)
- Max budget items per profile: 20 (enforced in Edge Function, not DB)

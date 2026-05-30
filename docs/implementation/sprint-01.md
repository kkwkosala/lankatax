# Sprint 1 — Tax Engine & Auth

**Milestone:** [Sprint 1 - Tax Engine & Auth](https://github.com/kkwkosala/lankatax/milestone/1)
**Dates:** Jun 1 – Jun 26, 2026 (4 weeks)
**Epics:** EPIC 1 (Tax Calculation Engine), EPIC 7 (Authentication & Profiles)
**Goal:** Production-ready tax calculation API + working auth. A user can sign up, sign in, and calculate their monthly APIT/EPF/ETF via API.

---

## Stories

### [DB] Database Foundation
| # | Story | Points | Issue |
|---|---|---|---|
| 1 | Run all 7 schema migrations on Supabase | 1 | #8 |
| 2 | Run seed data (tax years, slabs, rates, config) | 1 | #8 |
| 3 | Verify RLS policies with Supabase policy tester | 1 | #8 |

### [BE] Auth & User Profile
| # | Story | Points | Issue |
|---|---|---|---|
| 4 | Configure Supabase Auth (email + Google OAuth) | 2 | #29 |
| 5 | Verify `handle_new_user()` trigger creates profile | 1 | #29 |

### [BE] Tax Engine Edge Functions
| # | Story | Points | Issue |
|---|---|---|---|
| 6 | `get-tax-rules` — return current tax year slabs + rates | 2 | #5 |
| 7 | `calculate-tax` — implement 8-step calculation engine | 5 | #5 |
| 8 | `calculate-tax` — load rates/slabs from DB (never hardcoded) | 2 | #5 |
| 9 | `calculate-tax` — snapshot slabs + save calculation for auth users | 2 | #6 |
| 10 | `get-exchange-rate` — return latest USD/LKR rate | 1 | #5 |
| 11 | Tax engine unit tests (TC-01 to TC-20) | 3 | #5 |

**Total: 21 story points**

---

## Acceptance Criteria (Sprint Exit)
- [ ] `POST /functions/v1/calculate-tax` returns correct results for all 20 test scenarios
- [ ] Tax slabs loaded from DB — changing a slab in DB changes calculation output
- [ ] Auth users' calculations saved to `salary_calculations` with slab snapshot
- [ ] Anonymous users can calculate (no save)
- [ ] RLS prevents cross-user data access (verified)
- [ ] All CI checks pass on PR

---

## Technical Notes
- Start with DB migrations (prerequisite for all Edge Functions)
- `calculate-tax` is the most critical function — allocate 5 points
- Use Deno test runner for Edge Function unit tests
- Deploy to Supabase staging after every merged PR

---

## Sprint 1 Deliverables
```
supabase/
  migrations/         ← all 7 migration files applied ✓
  seed/               ← all 5 seed files applied ✓
  functions/
    calculate-tax/    ← core engine with tests
    get-tax-rules/    ← slab + rate lookup
    get-exchange-rate/ ← USD/LKR rate
```

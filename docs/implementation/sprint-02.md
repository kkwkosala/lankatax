# Sprint 2 — Salary Breakdown & Admin

**Milestone:** [Sprint 2 - Breakdown & Admin](https://github.com/kkwkosala/lankatax/milestone/2)
**Dates:** Jun 27 – Jul 10, 2026 (2 weeks)
**Epics:** EPIC 2 (Salary Breakdown Module), EPIC 5 (Tax Rule Administration)
**Goal:** Angular frontend scaffolded with working salary calculator. Admin can update tax slabs via UI.
**Depends on:** Sprint 1 complete (calculate-tax API live)

---

## Stories

### [FE] Angular NX Monorepo Setup
| # | Story | Points | Issue |
|---|---|---|---|
| 1 | Scaffold NX workspace with Angular 20, Tailwind, NgRx | 3 | #14 |
| 2 | Configure Supabase client library + environment setup | 1 | #14 |
| 3 | Implement auth guard + login/register pages | 2 | #29 |
| 4 | Implement NgRx auth state (login, logout, session restore) | 2 | #29 |

### [FE] Salary Calculator UI
| # | Story | Points | Issue |
|---|---|---|---|
| 5 | Salary input form (basic salary + allowances) | 2 | #10 |
| 6 | Tax relief input field | 1 | #10 |
| 7 | Results breakdown panel (gross, EPF, APIT, take-home, employer cost) | 3 | #10 |
| 8 | Save calculation to profile (authenticated users) | 2 | #11 |

### [BE] Salary Profiles
| # | Story | Points | Issue |
|---|---|---|---|
| 9 | `salary-profiles` Edge Function (GET/POST/PUT/DELETE) | 2 | #11 |

### [BE/FE] Admin Tax Rule Management
| # | Story | Points | Issue |
|---|---|---|---|
| 10 | `admin-tax-rules` Edge Function (read + create slabs/years) | 2 | #22 |
| 11 | Admin panel UI — view current tax slabs | 1 | #22 |

**Total: 21 story points (split across 2 weeks)**

---

## Acceptance Criteria (Sprint Exit)
- [ ] User can open the app, enter salary, and see full breakdown
- [ ] Logged-in user can save a calculation to their profile
- [ ] Admin can view current tax slabs in admin panel
- [ ] Angular build passes with no lint errors
- [ ] Change detection: all components use OnPush

---

## Technical Notes
- NX library boundaries enforced from day one (never relax later)
- Auth state stored in NgRx store — never in component state
- Salary form uses Angular reactive forms with validators
- Admin routes guarded by `adminGuard`

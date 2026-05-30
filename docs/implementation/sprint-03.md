# Sprint 3 — Pegging Calculator & USD Conversion

**Milestone:** [Sprint 3 - Pegging & USD](https://github.com/kkwkosala/lankatax/milestone/3)
**Dates:** Jul 11 – Jul 24, 2026 (2 weeks)
**Epics:** EPIC 3 (Pegging Calculator), EPIC 4 (USD Conversion Module)
**Goal:** USD-pegged employees can toggle pegging, enter base/current rates, and see their pegging allowance calculated and taxed correctly.
**Depends on:** Sprint 1 (calculate-tax), Sprint 2 (calculator UI)

---

## Stories

### [BE] Pegging in Tax Engine
| # | Story | Points | Issue |
|---|---|---|---|
| 1 | Extend `calculate-tax` to accept pegging inputs | 2 | #13 |
| 2 | Pegging formula: `MAX(0, (currentRate - baseRate) × peggedUSD)` | 1 | #13 |
| 3 | Pegging unit tests (TC-11 to TC-14) | 1 | #13 |

### [BE] Exchange Rate
| # | Story | Points | Issue |
|---|---|---|---|
| 4 | `admin-exchange-rate` Edge Function (POST new rate, GET history) | 1 | #16 |
| 5 | Admin UI: enter today's USD/LKR rate | 1 | #16 |

### [FE] Pegging UI
| # | Story | Points | Issue |
|---|---|---|---|
| 6 | Pegging toggle in salary calculator | 1 | #13 |
| 7 | Pegging inputs: base rate, current rate, USD value | 2 | #13 |
| 8 | Display pegging allowance in results breakdown | 1 | #13 |
| 9 | Warning banner when pegging_allowance = 0 (rate hasn't risen) | 1 | #13 |

### [FE] USD Conversion
| # | Story | Points | Issue |
|---|---|---|---|
| 10 | USD equivalent display on results panel | 1 | #16 |
| 11 | Stale rate warning (if rate > 3 days old) | 1 | #16 |
| 12 | Feature flag: `ff.usd_conversion.enabled` gates USD display | 1 | #16 |

**Total: 13 story points**

---

## Acceptance Criteria (Sprint Exit)
- [ ] Pegging toggle shows/hides pegging input fields
- [ ] `(320-299) × 1000 = LKR 21,000` pegging allowance calculated correctly
- [ ] Pegging with rate fallen: allowance = 0 (not negative)
- [ ] USD equivalent shown when exchange rate is available
- [ ] Stale rate (>3 days) shows yellow warning
- [ ] Feature flag `ff.pegging.enabled = false` hides entire pegging section

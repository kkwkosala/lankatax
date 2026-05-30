# Sprint 6 — Audit & Compliance

**Milestone:** [Sprint 6 - Audit & Compliance](https://github.com/kkwkosala/lankatax/milestone/6)
**Dates:** Aug 22 – Sep 4, 2026 (2 weeks)
**Epics:** EPIC 10 (Audit & Compliance)
**Goal:** Admins have full visibility into system activity via an audit trail UI, with CSV export for compliance reporting.
**Depends on:** All prior sprints (audit_logs populated throughout)

---

## Stories

### [BE] Audit Log API
| # | Story | Points | Issue |
|---|---|---|---|
| 1 | `audit-logs` Edge Function: paginated list with filters | 2 | #38 |
| 2 | `audit-logs/export` Edge Function: CSV export | 2 | #38 |
| 3 | Audit helper: `logEvent(supabase, entity, action, actor, old, new)` | 1 | #38 |
| 4 | Wire audit helper into: calculate-tax, admin-tax-rules, admin-exchange-rate | 1 | #38 |

### [FE] Audit Admin UI
| # | Story | Points | Issue |
|---|---|---|---|
| 5 | Audit log table: entity type, action, actor, timestamp | 2 | #38 |
| 6 | Filter panel: date range, action, entity type | 1 | #38 |
| 7 | CSV export button | 1 | #38 |

**Total: 10 story points**

---

## Acceptance Criteria (Sprint Exit)
- [ ] Every tax slab change recorded in `audit_logs`
- [ ] Every salary calculation creates an audit entry
- [ ] Every admin login creates an `ADMIN_LOGIN` entry
- [ ] Admin can filter audit logs by date + action
- [ ] CSV export downloads with correct columns
- [ ] Non-admin users get 403 on all audit endpoints

---

## Technical Notes
- `audit_logs` is append-only — no UPDATE/DELETE in DB or Edge Functions
- CSV export limited to 10,000 rows per request
- `actor_id` anonymised (set to NULL) when a user deletes their account
- Audit entries must NOT include raw salary amounts (use `calculationId` reference only)

---

## v1.0.0 Release Checklist

Sprint 6 completion = **v1.0.0 production release**:
- [ ] All 6 sprints done
- [ ] All CI checks passing on main
- [ ] CHANGELOG.md generated (`/release v1.0.0`)
- [ ] Production Supabase project configured
- [ ] Frontend deployed to Vercel
- [ ] Smoke tests run on production

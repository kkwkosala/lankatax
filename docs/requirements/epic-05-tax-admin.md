# EPIC 5 — Tax Rule Administration

**Epic Label:** `epic:tax-admin`  
**Priority:** 🟠 High  
**Sprint:** 2  
**GitHub Milestone:** Sprint 2 — Breakdown & Admin

---

## Epic Goal
Provide a secure admin interface for managing APIT tax slabs, EPF/ETF rates, and other configurable tax rules — enabling rule updates when gazettes are published, with zero code deployments required.

---

## User Stories

### US-5.1 — Manage APIT Tax Slabs
**As an** HR admin  
**I want to** view and update the APIT tax slabs for any tax year  
**So that** the calculation engine stays accurate when the IRD publishes new rates  

#### Acceptance Criteria
- **AC1:** Admin can view all tax slabs for the current and past tax years
- **AC2:** Admin can add a new slab set with an effective date
- **AC3:** Admin can edit slab boundaries and rates for a future-dated entry
- **AC4:** Admin cannot edit a slab set that has already been used in calculations
- **AC5:** New slabs require a mandatory effective_date in the future or today
- **AC6:** Each slab set must have a complete, gap-free slab ladder before activation
- **AC7:** Admin can preview the impact on a sample salary before saving

#### Business Rules
- BR5.1.1: Tax slabs are versioned by `effective_date` — new entries don't overwrite old ones
- BR5.1.2: Historical slab sets are immutable once `effective_date` has passed
- BR5.1.3: A slab set must cover all income levels (last slab has no upper bound)
- BR5.1.4: All slab rates must be 0% ≤ rate ≤ 100%
- BR5.1.5: Every slab change is written to `audit_logs`

#### Edge Cases
- Gap in slab ladder (e.g., 100,001–141,667 skipped) → validation error before save
- Overlapping slabs → validation error
- Effective date in the past → warning shown (historical edit — admin must confirm)
- Admin saves slabs but forgets the top open-ended slab → validation catches it

#### Validation Rules
- lower_bound: numeric, ≥ 0
- upper_bound: numeric, > lower_bound OR NULL (for top slab)
- rate: numeric, 0 ≤ rate ≤ 100
- fixed_amount: numeric, ≥ 0
- effective_date: required, valid date
- Slab sequence: lower_bound of each slab = upper_bound + 1 of previous slab

---

### US-5.2 — Manage EPF/ETF Rates
**As an** HR admin  
**I want to** update the statutory EPF and ETF contribution rates  
**So that** calculations remain compliant if government mandates rate changes  

#### Acceptance Criteria
- **AC1:** Admin can view current EPF (employee/employer) and ETF rates
- **AC2:** Admin can add new rates with effective dates
- **AC3:** Rate changes are not applied retroactively to past calculations
- **AC4:** Rate history shows all past rates with their dates

#### Business Rules
- BR5.2.1: Rates stored in `tax_rules` table with type: `epf_employee_rate`, `epf_employer_rate`, `etf_employer_rate`
- BR5.2.2: Rate changes are versioned by effective_date (same as slabs)
- BR5.2.3: Rate as percentage: 8 means 8% (stored as decimal: 0.08 in DB)

#### Validation Rules
- rate: numeric, 0 ≤ rate ≤ 50 (as percentage)

---

### US-5.3 — Preview Tax Rule Changes
**As an** HR admin  
**I want to** see how a pending tax rule change affects a sample salary  
**So that** I can verify the new rules are correctly configured before activating them  

#### Acceptance Criteria
- **AC1:** Admin can enter a sample salary and see results under current vs new rules
- **AC2:** Preview shows: Old APIT, New APIT, Difference
- **AC3:** Preview does not save any calculation to history
- **AC4:** Preview uses the draft/pending rule set — not yet effective

---

### US-5.4 — Tax Year Management
**As an** HR admin  
**I want to** create and manage tax years  
**So that** the system correctly applies the right slab set per fiscal year  

#### Acceptance Criteria
- **AC1:** Admin can create a new tax year (e.g., 2025/2026)
- **AC2:** Tax year has: year label, start_date (Apr 1), end_date (Mar 31)
- **AC3:** Tax year can be marked as active/inactive
- **AC4:** Only one tax year can be "current" at any time

#### Business Rules
- BR5.4.1: Sri Lankan fiscal year runs April 1 – March 31
- BR5.4.2: System automatically determines "current" tax year from today's date

---

### US-5.5 — Admin Role Protection
**As a** security requirement  
**All** tax rule management endpoints must be protected by admin-only access  

#### Acceptance Criteria
- **AC1:** All admin endpoints return 403 if `user.role !== 'admin'`
- **AC2:** Admin role is set in Supabase user metadata — not user-controlled
- **AC3:** Admin actions are recorded in audit_logs with the admin's user ID

#### Business Rules
- BR5.5.1: `role = 'admin'` set in `auth.users.app_metadata` (server-side only)
- BR5.5.2: RLS policies on admin tables check `auth.jwt() ->> 'role' = 'admin'`

---

## API Requirements
```
GET  /functions/v1/get-tax-rules            → current active rules + slabs
POST /functions/v1/admin-tax-rules          → create/update rule (admin only)
GET  /functions/v1/admin-tax-rules/preview  → preview impact (admin only)
GET  /functions/v1/admin-tax-rules/history  → rule change history (admin only)
```

## Definition of Epic Done
- [ ] Tax slab CRUD admin UI
- [ ] EPF/ETF rate management
- [ ] Effective date versioning working
- [ ] Slab ladder validation (no gaps/overlaps)
- [ ] Preview calculation against draft rules
- [ ] Admin role protection on all endpoints
- [ ] Audit log entry for every admin change

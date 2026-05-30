# EPIC 10 — Audit & Compliance

**Epic Label:** `epic:audit`  
**Priority:** 🟠 High  
**Sprint:** 2  
**GitHub Milestone:** Sprint 2 — Breakdown & Admin

---

## Epic Goal
Maintain a complete, tamper-proof audit trail for all tax rule changes, admin actions, and user calculation activity — ensuring the platform can demonstrate compliance and support tax dispute resolution.

---

## User Stories

### US-10.1 — Audit Log for Tax Rule Changes
**As a** compliance officer / admin  
**I want to** see a full audit trail of every change made to tax slabs and rates  
**So that** I can verify when rules were changed and by whom  

#### Acceptance Criteria
- **AC1:** Every tax slab create/update triggers an audit log entry
- **AC2:** Audit log captures: entity_type, entity_id, action (CREATE/UPDATE), actor_id, old_values (JSON), new_values (JSON), timestamp
- **AC3:** Audit log is read-only — no UI allows editing or deleting audit entries
- **AC4:** Admin can filter audit log by: date range, entity type, actor
- **AC5:** Admin can export audit log to CSV for external compliance reporting

#### Business Rules
- BR10.1.1: Audit log is written in the same DB transaction as the data change
- BR10.1.2: `old_values` and `new_values` stored as JSONB snapshots
- BR10.1.3: Audit log records survive user account deletion (anonymised actor ID)
- BR10.1.4: Audit log is append-only — no UPDATE or DELETE allowed via RLS

#### DB Requirements
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'tax_slab' | 'tax_rule' | 'salary_calculation' | 'user' | 'exchange_rate'
  entity_id UUID,
  action TEXT NOT NULL, -- 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'CALCULATION'
  actor_id UUID, -- NULL if system action; anonymised after account deletion
  actor_role TEXT, -- 'user' | 'admin' | 'system'
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Append-only policy
CREATE POLICY "audit_logs_insert_only" ON audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "audit_logs_admin_read" ON audit_logs FOR SELECT USING (
  auth.jwt() ->> 'role' = 'admin'
);
-- No UPDATE, no DELETE policies
```

---

### US-10.2 — Calculation Audit Trail
**As a** user  
**I want to** see a record of every calculation I've performed with the exact inputs and outputs  
**So that** I can reference them for tax declaration purposes  

#### Acceptance Criteria
- **AC1:** Every saved calculation stores: all inputs, all outputs, tax slabs version used, calculation timestamp
- **AC2:** User can view full detail of any historical calculation
- **AC3:** Calculations cannot be edited after saving
- **AC4:** Calculation record includes the effective tax slab snapshot (not just a reference)

#### Business Rules
- BR10.2.1: `salary_calculations` stores a snapshot of the tax slabs used — not just a foreign key
- BR10.2.2: This protects historical accuracy even when slabs are updated later
- BR10.2.3: Calculation record is immutable — no UPDATE RLS policy on `salary_calculations`

---

### US-10.3 — Admin Audit Dashboard
**As an** admin  
**I want to** view a searchable audit dashboard  
**So that** I can investigate any suspicious activity or verify compliance  

#### Acceptance Criteria
- **AC1:** Table view of audit log entries with pagination (50 per page)
- **AC2:** Filter by: date range, entity type, action, actor
- **AC3:** Each row expandable to show full old_values / new_values JSON diff
- **AC4:** Export filtered results to CSV
- **AC5:** Summary statistics: changes this week, changes this month, most active admin

---

### US-10.4 — Security Audit Events
**As a** security requirement  
**Specific security events** must be audited automatically  

#### Acceptance Criteria
- **AC1:** Admin login events logged (entity_type: 'auth', action: 'ADMIN_LOGIN')
- **AC2:** Failed login attempts logged (action: 'LOGIN_FAILED')
- **AC3:** Account deletion logged before deletion occurs
- **AC4:** PDF/report downloads logged (action: 'REPORT_GENERATED')
- **AC5:** Exchange rate updates logged

#### Business Rules
- BR10.4.1: Security events written by Edge Functions using service role client (bypasses RLS)
- BR10.4.2: IP address captured from request headers for admin actions

---

## API Requirements
```
GET /functions/v1/audit-logs           → paginated audit log (admin only)
GET /functions/v1/audit-logs/export    → CSV export (admin only)
GET /functions/v1/audit-logs/stats     → summary stats (admin only)
```

## Definition of Epic Done
- [ ] audit_logs table with append-only RLS
- [ ] Audit entries created for all tax rule changes
- [ ] Audit entries created for all calculations
- [ ] Admin audit dashboard with filters and pagination
- [ ] CSV export
- [ ] Security events (login, deletion, report download) audited
- [ ] Calculation snapshot (tax slab version) stored per calculation

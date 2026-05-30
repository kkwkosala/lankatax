# EPIC 2 — Salary Breakdown Module

**Epic Label:** `epic:salary-breakdown`  
**Priority:** 🔴 Critical  
**Sprint:** 1–2  
**GitHub Milestone:** Sprint 1 — Tax Engine & Auth / Sprint 2 — Breakdown & Admin

---

## Epic Goal
Provide users with a rich, visual salary breakdown showing all components of their gross salary, all deductions, and the net result — presented clearly with charts and structured data.

---

## User Stories

### US-2.1 — Enter Multiple Salary Components
**As a** Sri Lankan employee  
**I want to** enter all components of my salary package (basic, allowances, transport, data)  
**So that** the system can compute my accurate gross salary and apply the correct tax  

#### Acceptance Criteria
- **AC1:** Form accepts: Basic Salary, Fixed Allowances, Transport Allowance, Data Allowance, Other Allowances
- **AC2:** All allowance fields are optional — default to 0
- **AC3:** Gross salary displayed live as user types (reactive calculation preview)
- **AC4:** Each field validates: numeric, ≥ 0, ≤ 50,000,000 LKR
- **AC5:** Allowances are aggregated: `gross = basic + fixed + transport + data + other + pegging`

#### Business Rules
- BR2.1.1: Transport allowance is taxable income in Sri Lanka (included in gross)
- BR2.1.2: Data allowance is taxable income (included in gross)
- BR2.1.3: All allowances are added before EPF and APIT calculation

#### Validation Rules
- Basic Salary: required, numeric, > 0
- Each allowance: optional, numeric, ≥ 0
- Sum of all components must be > 0

---

### US-2.2 — View Visual Salary Breakdown
**As a** Sri Lankan employee  
**I want to** see a visual chart breaking down where my salary goes  
**So that** I can immediately understand the proportion of tax, EPF, and take-home  

#### Acceptance Criteria
- **AC1:** Pie/donut chart shows: Take-Home, Employee EPF, APIT Tax as proportions of gross
- **AC2:** Bar chart or stacked bar shows: Gross Salary vs Employer Cost side by side
- **AC3:** All values displayed in LKR with thousand-separator formatting (e.g., 150,000)
- **AC4:** Chart is accessible (WCAG 2.1 AA) — data table alternative provided
- **AC5:** Chart updates immediately when inputs change

#### Business Rules
- BR2.2.1: Chart proportions always sum to gross salary
- BR2.2.2: Employer contributions shown separately — not mixed with employee deductions

---

### US-2.3 — View Detailed Breakdown Card
**As a** Sri Lankan employee  
**I want to** see a structured card with every salary line item  
**So that** I can verify each calculation step and understand the deduction sequence  

#### Acceptance Criteria
- **AC1:** Card shows all inputs (basic, allowances, pegging) and all calculated values
- **AC2:** Shows calculation sequence: Gross → Employee EPF → Taxable Income → APIT → Take-Home
- **AC3:** Shows employer section: Employer EPF, Employer ETF, Total Employer Cost
- **AC4:** Shows tax year and effective date of tax slabs used
- **AC5:** Disclaimer shown: "This is an estimate. Consult a tax professional for advice."
- **AC6:** USD equivalent shown if exchange rate is available

#### Business Rules
- BR2.3.1: Sequence must match the canonical calculation order in CLAUDE.md
- BR2.3.2: All monetary values rounded to 2 decimal places for display

---

### US-2.4 — Save Salary Profile
**As a** registered user  
**I want to** save my salary details as a named profile  
**So that** I can quickly recalculate when salary components change  

#### Acceptance Criteria
- **AC1:** Logged-in user can save a salary profile with a name (e.g., "Current Job 2025")
- **AC2:** Up to 10 profiles per user
- **AC3:** Loading a profile pre-fills all form fields
- **AC4:** User can update or delete a saved profile
- **AC5:** Anonymous users see a prompt to register to save profiles

#### Business Rules
- BR2.4.1: Profile stores inputs only — not calculated outputs
- BR2.4.2: Outputs are recalculated fresh on profile load (to pick up latest tax slabs)
- BR2.4.3: RLS: user can only access their own profiles

#### API Requirements
```
GET    /functions/v1/salary-profiles        → list user's profiles
POST   /functions/v1/salary-profiles        → create profile
PUT    /functions/v1/salary-profiles/:id    → update profile
DELETE /functions/v1/salary-profiles/:id    → delete profile
```

---

### US-2.5 — Share Calculation (Anonymous Link)
**As a** user  
**I want to** share a read-only link to my salary calculation  
**So that** I can discuss my salary structure with HR or an accountant  

#### Acceptance Criteria
- **AC1:** User can generate a shareable link from a completed calculation
- **AC2:** Link is valid for 7 days and is read-only
- **AC3:** Shared view shows full breakdown but no personal identity information
- **AC4:** Shared link does not require login to view

#### Business Rules
- BR2.5.1: Shared calculations store only anonymised data (no name, no email)
- BR2.5.2: Share tokens are cryptographically random (UUID)
- BR2.5.3: Expired links return 404

---

## Definition of Epic Done
- [ ] Salary input form with all components working
- [ ] Live calculation preview (reactive)
- [ ] Visual breakdown chart (accessible)
- [ ] Detailed breakdown card with disclaimer
- [ ] Profile save/load/delete working with RLS
- [ ] All component tests passing

# EPIC 6 — Reporting & Exports

**Epic Label:** `epic:reporting`  
**Priority:** 🟡 Medium  
**Sprint:** 4  
**GitHub Milestone:** Sprint 4 — Reporting

---

## Epic Goal
Allow users to generate, download, and share salary breakdown reports in PDF and Excel formats, and compare calculations across different tax years.

---

## User Stories

### US-6.1 — Download PDF Salary Report
**As a** user  
**I want to** download a professionally formatted PDF of my salary breakdown  
**So that** I can share it with HR, my accountant, or keep for my records  

#### Acceptance Criteria
- **AC1:** PDF button available after every completed calculation
- **AC2:** PDF includes: all inputs, all calculated values, tax slabs used, effective date, disclaimer
- **AC3:** PDF header includes: LankaTax branding, generation date, tax year
- **AC4:** PDF is generated within 5 seconds
- **AC5:** PDF filename format: `LankaTax_Salary_YYYY-MM-DD.pdf`
- **AC6:** PDF does not contain personal identity information by default (no name/email)

#### Business Rules
- BR6.1.1: PDF generation is done server-side in Edge Function (not client-side)
- BR6.1.2: PDF includes disclaimer: "This is an estimate for informational purposes only."
- BR6.1.3: Audit log entry created when PDF is generated

#### API Requirements
```
POST /functions/v1/generate-report
Auth: Required
Body: { calculationId, format: 'pdf' | 'excel', includeProfile: boolean }
Response: { downloadUrl, expiresAt }  (pre-signed URL, valid 10 mins)
```

---

### US-6.2 — Download Excel Salary Breakdown
**As a** finance professional  
**I want to** export the salary calculation to Excel  
**So that** I can incorporate it into my payroll models and reports  

#### Acceptance Criteria
- **AC1:** Excel export includes all salary components and calculations in a structured sheet
- **AC2:** Separate columns for: Item, Amount (LKR), Notes
- **AC3:** A second sheet contains the tax slab table used for the calculation
- **AC4:** Excel file generated within 10 seconds

#### Business Rules
- BR6.2.1: Excel uses standard `.xlsx` format
- BR6.2.2: Numeric values formatted as LKR currency in Excel

---

### US-6.3 — Historical Tax Year Comparison
**As a** user  
**I want to** compare how the same salary would be taxed in two different tax years  
**So that** I can understand the impact of tax law changes on my net income  

#### Acceptance Criteria
- **AC1:** User selects two tax years to compare (e.g., 2023/24 vs 2024/25)
- **AC2:** System calculates results using slabs from each selected tax year
- **AC3:** Side-by-side table shows: Gross, Taxable Income, APIT, EPF, ETF, Take-Home, Employer Cost
- **AC4:** Difference row shows absolute and percentage change
- **AC5:** User can export the comparison to Excel

#### Business Rules
- BR6.3.1: Both calculations use the same input salary — only tax rules differ
- BR6.3.2: Tax years available = all years with slab data in `tax_slabs` table
- BR6.3.3: Comparison is not saved to calculation history (it's an analysis tool)

#### Edge Cases
- Only one tax year available → show message "Comparison requires at least 2 tax years of data"
- Same tax year selected for both → validation error

---

### US-6.4 — Calculation History List
**As a** registered user  
**I want to** view a list of my past salary calculations  
**So that** I can track how my take-home has changed over time  

#### Acceptance Criteria
- **AC1:** List shows last 24 calculations with: date, gross salary, APIT, take-home
- **AC2:** User can click any history item to view full breakdown
- **AC3:** User can delete individual history items
- **AC4:** User can download any historical calculation as PDF
- **AC5:** History sorted by calculation date, newest first

#### Business Rules
- BR6.4.1: Maximum 100 calculations stored per user
- BR6.4.2: Calculations older than 2 years are automatically archived (not deleted)
- BR6.4.3: RLS: user sees only their own history

---

## Definition of Epic Done
- [ ] PDF generation Edge Function working
- [ ] Excel export working
- [ ] Tax year comparison view
- [ ] Calculation history list with pagination
- [ ] Download from history working

# Sprint 4 — Reporting & Exports

**Milestone:** [Sprint 4 - Reporting](https://github.com/kkwkosala/lankatax/milestone/4)
**Dates:** Jul 25 – Aug 7, 2026 (2 weeks)
**Epics:** EPIC 6 (Reporting & Exports)
**Goal:** Users can download a PDF salary breakdown report and view their calculation history with tax year comparison.
**Depends on:** Sprint 1 (calculations saved), Sprint 2 (salary profiles)

---

## Stories

### [BE] Report Generation
| # | Story | Points | Issue |
|---|---|---|---|
| 1 | `generate-report` Edge Function: PDF salary breakdown | 3 | #24 |
| 2 | Store generated PDFs in Supabase Storage (`generated-reports`) | 1 | #24 |
| 3 | Return pre-signed URL valid 10 minutes | 1 | #24 |

### [BE] Calculation History
| # | Story | Points | Issue |
|---|---|---|---|
| 4 | `save-calculation` Edge Function (persist result + snapshot) | 1 | #6 |
| 5 | Paginated calculation history query (last 24 months) | 1 | #25 |

### [FE] History & Comparison
| # | Story | Points | Issue |
|---|---|---|---|
| 6 | Calculation history table (date, gross, tax, take-home) | 2 | #25 |
| 7 | Tax year comparison: side-by-side current vs previous year | 2 | #25 |
| 8 | Download PDF button → triggers generate-report → open URL | 1 | #24 |
| 9 | Feature flag: `ff.pdf_export.enabled` gates download button | 1 | #24 |

**Total: 13 story points**

---

## Acceptance Criteria (Sprint Exit)
- [ ] PDF report downloads with correct salary figures
- [ ] Pre-signed URL expires after 10 minutes
- [ ] History table shows last 10 calculations paginated
- [ ] Tax year comparison shows diff correctly
- [ ] `ff.pdf_export.enabled = false` hides download button

---

## Technical Notes
- PDF generation server-side only (Edge Function) — no client-side PDF library
- Use `@supabase/storage-js` to upload to `generated-reports` bucket
- Bucket must have RLS: users can only access their own reports

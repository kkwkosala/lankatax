# requirement-agent

## Role
Business Analyst — captures, clarifies, and structures raw requirements before any brainstorming or design begins.

## When to Use
Run at the very start of any new feature request, stakeholder ask, tax law change, or bug report. Output feeds into `/brainstorm`.

## Steps to Follow

### 1. Capture the Raw Requirement
Record it verbatim from the stakeholder. Do not rephrase yet.

### 2. Classify the Requirement
- **Feature** — new capability being added
- **Enhancement** — improvement to existing functionality
- **Bug fix** — incorrect or broken behaviour
- **Tax Rule Change** — APIT/PAYE slab update, EPF/ETF rate change, new allowance rule
- **Tech debt** — internal improvement with no user-visible change
- **Spike** — research / proof of concept

### 3. Identify Scope
- `[DB]` — Supabase schema/migration only
- `[BE]` — Edge Function change only
- `[FE]` — Angular UI change only
- `[FULL]` — full-stack (DB + BE + FE)

### 4. Tax Domain Classification (if applicable)
If the requirement affects tax calculations, classify:
- **Tax Slab Change** — income brackets or rates changed
- **New Allowance Type** — new income type to include/exclude
- **EPF/ETF Rate Change** — statutory rate change
- **Pegging Rule Change** — formula or trigger change
- **Relief Threshold Change** — tax relief amount changed

### 5. Write Acceptance Criteria
```
Given [precondition]
When  [action]
Then  [observable outcome]
```
Minimum 2 ACs per requirement — happy path + at least one failure case.

### 6. Non-Functional Requirements
- **Performance** — e.g. "Tax calculation returns in < 500ms"
- **Security** — e.g. "Salary data isolated by authenticated user via RLS"
- **Accuracy** — e.g. "Tax result matches IRD published example to within LKR 1"
- **Accessibility** — e.g. "All calculator inputs meet WCAG 2.1 AA"

### 7. Out of Scope
Explicitly list exclusions to prevent scope creep.

---

## Output Format

```markdown
## Requirement: [Short Name]
**Date:** YYYY-MM-DD
**Requested by:** [stakeholder / team]
**Type:** Feature / Enhancement / Bug fix / Tax Rule Change / Tech debt / Spike
**Scope:** [DB] / [BE] / [FE] / [FULL]

### Raw Requirement
> [verbatim from stakeholder]

### Problem Statement
[1–3 sentences: what problem does this solve, and why does it matter?]

### Tax Domain Impact (if applicable)
- Affected calculation step: [e.g. taxable_income, apit_tax, pegging_allowance]
- DB tables affected: [e.g. tax_slabs, tax_rules]
- Effective date: YYYY-MM-DD

### Acceptance Criteria
- **AC1 (Happy path):** Given ... When ... Then ...
- **AC2 (Failure case):** Given ... When ... Then ...

### Non-Functional Requirements
- Performance: ...
- Security: ...
- Accuracy: ...

### Out of Scope
- ...

### Open Questions
- [ ] ...

### Dependencies
- Blocked by: [feature/issue] (if any)
```

## Next Steps
1. Run `/brainstorm` to explore implementation approaches
2. Run `/design` after approach is approved
3. Run `/create-pbis` to create GitHub Issues

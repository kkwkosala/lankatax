# impact-agent

## Role
Blast-Radius Analyst — assesses the full impact of a change before a PR is opened. Identifies all affected components, services, DB tables, and Edge Functions.

## When to Use
Run `/impact-analysis` before creating any PR, especially for:
- Tax engine changes
- DB schema changes
- Edge Function signature changes
- NgRx state shape changes
- New Angular routes

## Analysis Dimensions

### 1. Tax Domain Impact (highest priority)
- Does this change affect the tax calculation sequence?
- Which calculation step is modified? (gross/epf/taxable/apit/takehome/employer)
- Are existing historical calculations invalidated?
- Does this require a tax slab migration?
- Does this affect the pegging allowance formula?
- Should historical calculations be recomputed or preserved?

### 2. Database Impact
- Tables added/modified/removed?
- Indexes added/removed?
- RLS policies added/modified?
- Is the migration additive? (preferred) or destructive? (requires sign-off)
- Are existing rows affected by schema changes?
- Does seeded tax data need updating?

### 3. Edge Function Impact
- Which Edge Functions are modified?
- Are request/response type signatures changed? (breaking change)
- Are any Edge Functions called by other Edge Functions? (chain effect)
- Are any shared utilities modified?

### 4. Angular Impact
- Which NX libraries are affected?
- Are NgRx state shapes changed? (check all selectors and components consuming them)
- Are API service interfaces changed? (check all effects)
- Are shared UI components modified? (check all consumers)
- Are routes added/removed?

### 5. Cross-Cutting
- Does this affect audit logging?
- Does this affect any currently open PRs? (conflict risk)
- Does this affect any active sprint work?

## Output Format

```markdown
## Impact Analysis: [PR title / Branch name]
**Date:** YYYY-MM-DD
**Branch:** feature/[N]-[description]

### Tax Domain Impact
- Affected calculation steps: [none / list]
- Historical calculations affected: Yes / No
- Tax slab migration required: Yes / No
- Recommendation: [preserve / recompute / N/A]

### Risk Level: 🟢 Low / 🟡 Medium / 🔴 High / ⚫ Critical

### Database Changes
- Breaking: Yes / No
- Migration type: Additive / Destructive
- Tables affected: [list]
- RLS changes: [list or none]

### Edge Function Changes
- Modified functions: [list]
- Breaking API contract change: Yes / No

### Angular Changes
- NX libs affected: [list]
- NgRx state change: Yes / No
- Shared component change: Yes / No

### Merge Conflicts
- Open PRs at risk: [list issue numbers or none]

### Recommended Actions
1. ...
2. ...
```

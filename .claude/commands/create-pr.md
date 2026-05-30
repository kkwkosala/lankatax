# /create-pr #N

You are acting as the **Developer Agent** in PR creation mode. Open a structured pull request for Issue #N.

## When to Use
After `/generate-tests` (all passing) and `/impact-analysis` (low/medium risk cleared).

## Steps

1. Confirm all tests pass: `ng test --watch=false` + `deno test`
2. Confirm lint passes: `ng lint` + `deno lint`
3. Confirm build passes: `ng build --configuration=production`
4. Run `/impact-analysis` (include summary in PR)
5. Push branch to origin
6. Open PR against `main` using the template below

## PR Title Format
```
[TYPE] #N: Short description
```
Types: `feat`, `fix`, `tax-rule`, `db`, `chore`, `security`

Example: `feat #12: Add pegging allowance calculator`

## PR Body Template

```markdown
## Related Issue
Closes #N

## Summary
[2–3 sentences: what was built, why, and which approach was taken]

## Technical Changes

### Database *(if applicable)*
- Migration: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
- Tables: [list]
- RLS policies: [list]

### Edge Functions *(if applicable)*
- `supabase/functions/[name]/index.ts` — [what changed]
- Request/Response types: [changed / unchanged]

### Angular *(if applicable)*
- `libs/data-access-[name]/` — NgRx: [actions/effects/selectors added]
- `libs/ui-[name]/` — Components: [list]
- `libs/feature-[name]/` — Page: [name]

## Tax Domain Verification *(if applicable)*
- Calculation step affected: [step]
- Tax slabs loaded from DB: ✅
- Verified against IRD reference: ✅ / ⚠️ Pending
- Pegging formula: unchanged / [changed — describe]

## Test Evidence
- Edge Function tests: N tests passing ✅
- Angular reducer tests: N tests passing ✅
- Angular effects tests: N tests passing ✅
- Angular component tests: N tests passing ✅
- Coverage: FE N% / BE N%

## Impact Analysis
- Risk level: 🟢 Low / 🟡 Medium
- Breaking changes: None / [describe]
- DB migration type: Additive / N/A

## Screenshots *(optional)*
<!-- Paste calculator screenshot or API response -->

## Rollback Plan
- [ ] No rollback needed (no DB change, no new endpoints)
- [ ] Redeploy previous frontend build from Vercel/Netlify
- [ ] Re-run previous Edge Function deploy
- [ ] Revert tax slab via admin panel: `UPDATE tax_slabs SET ...`

## Checklist
- [ ] Tests passing (Angular + Edge Functions)
- [ ] Lint passing
- [ ] Production build passing
- [ ] No secrets committed
- [ ] JWT validation in all Edge Functions
- [ ] RLS policies on all new tables
- [ ] Tax slabs from DB (not hardcoded)
- [ ] Impact analysis completed
- [ ] CI checks green
```

## Next Steps
→ Assign reviewer → CI must be green → minimum 1 human approval → squash merge

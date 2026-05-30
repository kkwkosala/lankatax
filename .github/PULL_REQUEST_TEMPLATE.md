
## Related Issue
Closes #<!-- issue number -->

## Summary
<!-- 2–3 sentences: what was built, why, and which approach was taken -->

## Technical Changes

### Database *(if applicable)*
- Migration: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
- Tables affected:
- RLS policies added:

### Edge Functions *(if applicable)*
- `supabase/functions/[name]/index.ts` — [what changed]
- Request/Response contract: unchanged / [describe change]

### Angular *(if applicable)*
- `libs/data-access-[name]/` — NgRx: [actions/effects/selectors]
- `libs/ui-[name]/` — Components: [list]
- `libs/feature-[name]/` — Page: [name]

## Tax Domain Verification *(if applicable)*
- Calculation step affected: [step or none]
- Tax slabs loaded from DB: ✅ / N/A
- Verified against IRD reference: ✅ / ⚠️ Pending / N/A
- Pegging formula: unchanged / [changed — describe]
- Effective date for rule change: YYYY-MM-DD / N/A

## Test Evidence
- Edge Function tests: N tests passing ✅
- Angular reducer tests: N tests passing ✅
- Angular effects tests: N tests passing ✅
- Angular component tests: N tests passing ✅
- Coverage: FE N% / BE N%

## Impact Analysis
- Risk level: 🟢 Low / 🟡 Medium / 🔴 High
- Breaking API contract change: Yes / No
- DB migration type: Additive / None

## Screenshots *(optional)*
<!-- Calculator output or API response screenshot -->

## Rollback Plan
- [ ] No rollback needed (no DB change, no new endpoints)
- [ ] Redeploy previous frontend build from Vercel/Netlify
- [ ] Re-deploy previous Edge Function version
- [ ] Revert tax slab via admin panel

## Checklist
- [ ] Tests passing (Angular + Edge Functions)
- [ ] `ng lint` passing
- [ ] `ng build --configuration=production` passing
- [ ] No secrets or API keys committed
- [ ] JWT validation in all new/modified Edge Functions
- [ ] RLS policies on all new tables
- [ ] Tax slabs loaded from DB (not hardcoded)
- [ ] `/impact-analysis` completed
- [ ] CI checks green
- [ ] `OnPush` change detection on all new components

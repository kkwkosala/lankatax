# /implement #N

You are acting as the **Developer Agent**. Implement the feature for GitHub Issue #N following the approved design document.

## When to Use
After design approval and PBI creation. Branch must exist (`feature/N-description`).

## Steps

1. Read GitHub Issue #N and linked design document
2. Confirm branch `feature/N-[description]` exists (create if not)
3. Implement in this order:
   a. `[DB]` — Supabase migration SQL
   b. `[BE]` — Edge Function TypeScript
   c. `[FE]` — Angular NX (NgRx slice + components)
4. Follow all patterns in `.claude/agents/developer-agent.md`
5. Run lint checks
6. Verify tax calculation accuracy (if applicable)

## Implementation Order

### Step 1 — DB Migration
```
supabase/migrations/YYYYMMDDHHMMSS_[description].sql
```
- Additive only (no DROP COLUMN without sign-off)
- Include RLS policies
- Include indexes

### Step 2 — Shared Types
```
supabase/functions/_shared/types.ts
```
- Define TypeScript request/response interfaces

### Step 3 — Edge Function
```
supabase/functions/[function-name]/index.ts
```
Follow pattern:
1. CORS preflight handler
2. JWT validation
3. Request body parsing + validation
4. Business logic (load slabs from DB → calculate → return)
5. Error handling with typed responses

### Step 4 — Angular NgRx (data-access lib)
```
libs/data-access-[name]/src/lib/
  +state/
    [name].actions.ts
    [name].reducer.ts
    [name].effects.ts
    [name].selectors.ts
  [name]-api.service.ts
  index.ts  (public API barrel)
```

### Step 5 — Angular UI Components (ui lib)
```
libs/ui-[name]/src/lib/[component]/
  [component].component.ts
  [component].component.html
  [component].component.scss
  [component].component.spec.ts
```

### Step 6 — Angular Feature Page (feature lib)
```
libs/feature-[name]/src/lib/
  [name]-page/
    [name]-page.component.ts
    [name]-page.component.html
  [name].routes.ts
```

## Checklist Before PR
- [ ] All TypeScript types explicitly defined (no `any`)
- [ ] JWT validated in Edge Function
- [ ] Tax slabs loaded from DB (not hardcoded)
- [ ] `OnPush` change detection on all components
- [ ] Async pipe used (no manual subscribe)
- [ ] Unit tests written (see `/generate-tests`)
- [ ] Lint passing: `ng lint` / `deno lint`
- [ ] Build passing: `ng build`
- [ ] `/impact-analysis` completed

## Next Steps
→ `/generate-tests` → `/impact-analysis` → `/create-pr #N`

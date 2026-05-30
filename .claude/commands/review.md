# /review

You are acting as the **Reviewer Agent**. Perform a comprehensive code review of the current PR.

## When to Use
On every PR — triggered automatically by CI or run manually.

## Review Scope

Pull the diff and review against all dimensions:

### 1. Tax Domain Correctness (highest priority)
- Is the calculation sequence correct? (gross → epf → taxable → apit → takehome)
- Are tax slabs loaded from DB? (never hardcoded)
- Is the pegging formula correct? `(current_rate - base_rate) × pegged_usd_value`
- Are boundary conditions handled? (zero salary, maximum slab, no pegging)
- Does the EPF/ETF calculation use DB rates?

### 2. Architecture
- NX library boundaries respected?
- No business/calculation logic in Angular components?
- Edge Functions follow standard pattern (CORS → JWT → parse → logic → response)?
- DB migrations are additive?

### 3. Security
- JWT validated in every Edge Function?
- RLS policies present on all new tables?
- No PII in logs?
- No secrets committed?
- Input validated before processing?
- Admin endpoints check `role = 'admin'`?

### 4. Angular Quality
- `OnPush` change detection on all components?
- `inject()` used (not constructor injection)?
- No `any` types?
- Async pipe used (no manual subscribe)?
- Reactive forms with validators?
- Aria labels on inputs?

### 5. NgRx
- Actions use `createAction` with typed props?
- Reducers are pure (no side effects)?
- Side effects only in Effects?
- Selectors use `createSelector`?

### 6. Tests
- Unit tests for all new code?
- Tax boundary cases covered?
- CI green?

## Output Format

```markdown
## Code Review: PR #[N] — [title]
**Reviewer:** AI Review Agent
**Date:** YYYY-MM-DD
**Decision:** ✅ Approved / ❌ Changes Required / 💬 Comments Only

---

### ❌ Critical (must fix before merge)
- `[file.ts:line]` — Issue. **Fix:** suggestion

### ⚠️ Important (should fix)
- `[file.ts:line]` — Issue. **Suggestion:** ...

### 💬 Minor (optional)
- `[file.ts:line]` — ...

---

### Tax Domain ✅/❌
- Calculation sequence: correct / [issue]
- Slabs from DB: ✅/❌
- Pegging formula: ✅/❌

### Security ✅/❌
- JWT validation: ✅/❌
- RLS policies: ✅/❌
- No secrets: ✅/❌

### Test Coverage ✅/❌
- FE: N% (requirement: 80%)
- BE: N% (requirement: 85%)
```

## Next Steps
→ Author addresses critical issues → Re-run CI → Human reviewer approves → Squash merge

# /design

You are acting as the **Architect Agent**. Produce a complete technical design for the approved approach before any implementation begins.

## When to Use
After brainstorm approval. Output must be approved before `/implement`.

## Steps

1. Read the approved brainstorm document
2. Define Edge Function API contracts
3. Define DB schema changes (tables, columns, indexes, RLS)
4. Write migration SQL
5. Define Angular NX structure (libs, components, services)
6. Define NgRx state shape, actions, effects, selectors
7. Define TypeScript request/response types
8. List all error cases

## Output Format

```markdown
## Design: [Feature Name]
**Brainstorm ref:** docs/brainstorm/[name].md
**Date:** YYYY-MM-DD

---

## Edge Function API Contracts

### POST /functions/v1/[function-name]
**Auth:** Required (Bearer JWT)
**Request:**
```typescript
interface [Name]Request {
  field: type;
}
```
**Response (200):**
```typescript
interface [Name]Response {
  field: type;
}
```
**Error responses:**
- 400: Validation error `{ error: string }`
- 401: Unauthorized
- 500: Internal error

---

## Database Schema

### New Table: [table_name]
```sql
CREATE TABLE [table_name] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  -- fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_[table]_user_id ON [table_name](user_id);

ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "[table]_select_own" ON [table_name]
  FOR SELECT USING (auth.uid() = user_id);
```

**Migration file:** `supabase/migrations/YYYYMMDDHHMMSS_[description].sql`

---

## Tax Engine Logic (if applicable)

**Calculation step affected:** [e.g. taxable_income]
**Formula:**
```
[formula]
```
**DB query for rates/slabs:**
```sql
SELECT lower_bound, upper_bound, rate, fixed_amount
FROM tax_slabs
WHERE tax_rule_id = $1 AND effective_date <= NOW()
ORDER BY lower_bound;
```

---

## Angular NX Structure

**Library assignments:**
- `libs/feature-[name]/` — Smart container: [ComponentName]PageComponent
- `libs/ui-[name]/` — Dumb components: [ComponentA], [ComponentB]
- `libs/data-access-[name]/` — NgRx + API service

**NgRx State Shape:**
```typescript
interface [Feature]State {
  data: [Type] | null;
  loading: boolean;
  error: string | null;
}
```

**Actions:**
```typescript
[featureName]       // trigger
[featureName]Success  // success
[featureName]Failure  // failure
```

**Effects:** `[featureName]$` — calls API service, dispatches success/failure

**Selectors:** `select[Feature]`, `select[Feature]Loading`, `select[Feature]Error`

---

## Error Cases
| Code | Constant | Message |
|---|---|---|
| 400 | `VALIDATION_ERROR` | 'Invalid request' |
| 401 | `UNAUTHORIZED` | 'Authentication required' |
| 404 | `NOT_FOUND` | '[Resource] not found' |

---

## Design Checklist
- [ ] API contract complete
- [ ] DB schema + RLS defined
- [ ] Migration SQL written
- [ ] NX lib assignments defined
- [ ] NgRx state/actions/effects/selectors defined
- [ ] TypeScript types defined
- [ ] Tax calculation logic verified
- [ ] Error cases named
```

## Next Steps
→ On approval: `/create-pbis` then branch → `/implement`

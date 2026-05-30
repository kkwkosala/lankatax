# /generate-tests

You are acting as the **QA Agent**. Generate comprehensive tests for all new code before a PR is opened.

## When to Use
After `/implement`. All tests must pass before `/create-pr`.

## What to Generate

### 1. Edge Function Tests
File: `supabase/functions/[name]/__tests__/[name].test.ts`

Cover:
- Happy path with valid inputs
- Invalid/missing JWT → 401
- Malformed request body → 400
- Tax calculation accuracy (verify against reference values)
- Boundary conditions (salary at slab thresholds)
- Pegging enabled/disabled scenarios

### 2. Angular NgRx Tests

**Reducer:** `libs/data-access-[name]/src/lib/+state/[name].reducer.spec.ts`
- Initial state
- Each action → expected state transition

**Effects:** `libs/data-access-[name]/src/lib/+state/[name].effects.spec.ts`
- Success path → correct success action dispatched
- Failure path → correct failure action dispatched

**Selectors:** `libs/data-access-[name]/src/lib/+state/[name].selectors.spec.ts`
- Each selector returns expected slice

### 3. Angular Component Tests
File: `libs/ui-[name]/src/lib/[component]/[component].component.spec.ts`

Cover:
- Renders correctly with inputs
- Emits correct output events
- Displays loading state
- Displays error state
- Accessibility: required aria attributes present

### 4. Tax Calculation Reference Tests
For any tax engine change, validate against IRD published examples:

```typescript
describe('Tax Calculation — IRD Reference Validation', () => {
  const cases = [
    { monthly: 100_000, expectedApit: 0, description: 'Below threshold' },
    { monthly: 250_000, expectedApit: <IRD_VALUE>, description: 'Slab 1' },
    { monthly: 500_000, expectedApit: <IRD_VALUE>, description: 'Slab 2' },
    // Add all published IRD examples
  ];

  cases.forEach(({ monthly, expectedApit, description }) => {
    it(`should calculate correct APIT for ${description}`, async () => {
      const result = await calculateTax({ basicSalary: monthly });
      expect(result.apitTax).toBeCloseTo(expectedApit, 0);
    });
  });
});
```

## Coverage Requirements
- Angular reducers + effects + selectors: ≥ 90%
- Angular components: ≥ 80%
- Edge Functions: ≥ 85%
- Tax calculation logic: 100% slab boundary coverage

## Running Tests
```bash
# Angular
ng test --watch=false --code-coverage

# Deno Edge Functions
deno test supabase/functions/[name]/__tests__/
```

## Next Steps
→ All tests passing → `/impact-analysis` → `/create-pr #N`

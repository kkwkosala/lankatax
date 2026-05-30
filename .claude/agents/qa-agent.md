# qa-agent

## Role
QA Lead — generates comprehensive test suites for Angular components, NgRx store, and Supabase Edge Functions. Validates coverage before any PR is opened.

## Responsibilities
- Generate Angular unit tests (Jest/Karma + Angular Testing Library)
- Generate NgRx store tests (reducer, effects, selectors)
- Generate Edge Function tests (Deno test + fetch mocking)
- Generate E2E test scenarios (Cypress/Playwright)
- Validate tax calculation accuracy against IRD published examples
- Review test coverage reports

## Angular Test Patterns

### Component Tests
```typescript
describe('TaxBreakdownComponent', () => {
  let component: TaxBreakdownComponent;
  let fixture: ComponentFixture<TaxBreakdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaxBreakdownComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(TaxBreakdownComponent);
    component = fixture.componentInstance;
  });

  it('should display gross salary correctly', () => {
    component.result = mockTaxResult;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="gross-salary"]').textContent)
      .toContain('150,000');
  });
});
```

### NgRx Reducer Tests
```typescript
describe('calculatorReducer', () => {
  it('should set loading true on calculateTax', () => {
    const state = calculatorReducer(initialState, calculateTax({ request: mockRequest }));
    expect(state.loading).toBe(true);
  });

  it('should store result on calculateTaxSuccess', () => {
    const state = calculatorReducer(initialState, calculateTaxSuccess({ result: mockResult }));
    expect(state.result).toEqual(mockResult);
    expect(state.loading).toBe(false);
  });
});
```

### NgRx Effects Tests
```typescript
describe('CalculatorEffects', () => {
  it('should dispatch calculateTaxSuccess on API success', () => {
    actions$ = hot('-a', { a: calculateTax({ request: mockRequest }) });
    const expected = cold('-b', { b: calculateTaxSuccess({ result: mockResult }) });
    expect(effects.calculateTax$).toBeObservable(expected);
  });
});
```

## Edge Function Test Patterns

```typescript
// Deno test
Deno.test('calculate-tax: returns correct APIT for salary 150000', async () => {
  const response = await handler(mockRequest({ basicSalary: 150000 }));
  const body = await response.json();
  assertEquals(body.apitTax, 0); // Below threshold
});

Deno.test('calculate-tax: returns correct APIT for salary 2000000', async () => {
  const response = await handler(mockRequest({ basicSalary: 2000000 }));
  const body = await response.json();
  assertEquals(response.status, 200);
  // Verify against IRD published tax table
});
```

## Tax Calculation Test Cases (Critical)

Every tax calculation must be validated against these reference scenarios:

| Scenario | Basic Salary | Expected APIT | Expected EPF (Employee) | Expected Take-Home |
|---|---|---|---|---|
| Below threshold | LKR 100,000 | 0 | 8,000 | 92,000 |
| Slab 1 entry | LKR 150,000 | Per current slab | Per rate | Calculated |
| High earner | LKR 500,000 | Per current slab | 40,000 | Calculated |
| With pegging | LKR 200,000 + pegging | Per current slab | Per rate | Calculated |

These reference values must be verified against IRD published APIT tables.

## Coverage Requirements
- Angular components: minimum 80% line coverage
- NgRx (reducers + effects + selectors): minimum 90% line coverage
- Edge Functions: minimum 85% line coverage
- Tax calculation logic: 100% coverage of all slab boundaries

## Output
- Test files co-located with source (`.spec.ts` for Angular, `_test.ts` for Deno)
- Coverage report summary
- Tax accuracy validation report

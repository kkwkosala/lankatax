# 01 — Tax Engine Specification

## Engine Purpose

The `calculate-tax` Edge Function is the core engine. It:
1. Loads the latest tax rules and slabs from the database (never hardcoded)
2. Accepts a salary input payload
3. Executes the canonical calculation sequence
4. Returns a complete, auditable result with a snapshot of the rules used

---

## Inputs

### `TaxCalculationRequest`

```typescript
interface TaxCalculationRequest {
  // ─── Core Salary ─────────────────────────────────────────────────
  basicSalary: number;            // Required. Base monthly salary in LKR
  fixedAllowances?: number;       // Optional. Fixed monthly allowances in LKR (default: 0)
  transportAllowance?: number;    // Optional. Monthly transport allowance in LKR (default: 0)
  dataAllowance?: number;         // Optional. Monthly data/internet allowance in LKR (default: 0)
  otherAllowances?: number;       // Optional. All other monthly allowances in LKR (default: 0)

  // ─── Tax Relief ──────────────────────────────────────────────────
  taxReliefAnnual?: number;       // Optional. Annual tax relief amount in LKR (default: 0)
  //   Monthly relief = taxReliefAnnual / 12 — deducted from taxable income

  // ─── Pegging ─────────────────────────────────────────────────────
  pegging?: {
    enabled: boolean;
    baseRate?: number;            // Contract LKR/USD rate (e.g. 299.00)
    currentRate?: number;         // Today's LKR/USD rate (e.g. 320.00)
    peggedUsdValue?: number;      // USD salary component being pegged (e.g. 1000)
  };

  // ─── Override ────────────────────────────────────────────────────
  exchangeRate?: number;          // Optional. Override system exchange rate for USD conversion
  taxYear?: string;               // Optional. e.g. '2024/2025'. Defaults to current tax year
}
```

### Input Validation Rules

| Field | Rule |
|---|---|
| `basicSalary` | Required; must be ≥ 0 |
| All allowances | Optional; must be ≥ 0 |
| `taxReliefAnnual` | Optional; must be ≥ 0; capped at annual gross salary |
| `pegging.baseRate` | Required if `pegging.enabled = true`; must be > 0 |
| `pegging.currentRate` | Required if `pegging.enabled = true`; must be > 0 |
| `pegging.peggedUsdValue` | Required if `pegging.enabled = true`; must be > 0 |
| `exchangeRate` | Optional; must be > 0 if provided |

---

## Outputs

### `TaxCalculationResult`

```typescript
interface TaxCalculationResult {
  // ─── Inputs Echo ──────────────────────────────────────────────────
  inputs: TaxCalculationRequest;

  // ─── Step 1: Pegging ──────────────────────────────────────────────
  peggingAllowance: number;       // LKR — additional taxable income from pegging

  // ─── Step 2: Gross Salary ─────────────────────────────────────────
  grossSalary: number;            // LKR — total monthly salary before deductions

  // ─── Step 3: Employee EPF ─────────────────────────────────────────
  employeeEpf: number;            // LKR — employee EPF deduction (8% of gross)
  epfEmployeeRate: number;        // e.g. 0.08 — rate used (from tax_rules)

  // ─── Step 4: Taxable Income ───────────────────────────────────────
  taxableIncome: number;          // LKR — gross - employee EPF - monthly relief

  // ─── Step 5: APIT Tax ─────────────────────────────────────────────
  apitTax: number;                // LKR — monthly APIT calculated via slabs
  taxSlabsUsed: TaxSlabSnapshot[]; // Slab set used (for audit/display)
  taxYearLabel: string;           // e.g. '2024/2025'

  // ─── Step 6: Take-Home Salary ─────────────────────────────────────
  takeHomeSalary: number;         // LKR — gross - employee EPF - APIT

  // ─── Step 7: Employer Costs ───────────────────────────────────────
  employerEpf: number;            // LKR — employer EPF (12% of gross)
  employerEtf: number;            // LKR — employer ETF (3% of gross)
  employerCost: number;           // LKR — gross + employer EPF + employer ETF
  epfEmployerRate: number;        // e.g. 0.12
  etfEmployerRate: number;        // e.g. 0.03

  // ─── Step 8: USD Conversion ───────────────────────────────────────
  usdEquivalent: number | null;   // USD — gross / exchange rate (null if no rate)
  exchangeRateUsed: number | null;

  // ─── Metadata ─────────────────────────────────────────────────────
  calculationId?: string;         // UUID — set if calculation saved to DB
  calculatedAt: string;           // ISO 8601 timestamp
  disclaimer: string;             // Standard IRD disclaimer text
}
```

---

## Configuration Loading (from Database)

```typescript
// Pseudocode — executed at start of every calculate-tax call

// 1. Resolve tax year
const taxYear = await db.query(`
  SELECT * FROM tax_years
  WHERE ($1::text IS NULL AND is_current = true)
     OR label = $1
  LIMIT 1
`, [request.taxYear]);

// 2. Load effective rates (latest on or before today)
const [epfEmpRate, epfErRate, etfErRate] = await db.query(`
  SELECT DISTINCT ON (rule_type) rule_type, rate_value
  FROM tax_rules
  WHERE effective_date <= NOW()
    AND rule_type IN ('epf_employee_rate', 'epf_employer_rate', 'etf_employer_rate')
  ORDER BY rule_type, effective_date DESC
`);

// 3. Load active tax slabs for this tax year
const slabs = await db.query(`
  SELECT DISTINCT ON (slab_order) *
  FROM tax_slabs
  WHERE tax_year_id = $1
    AND effective_date <= NOW()
  ORDER BY slab_order, effective_date DESC
`, [taxYear.id]);

// 4. Load exchange rate (latest)
const exchangeRate = await db.query(`
  SELECT rate FROM exchange_rates
  WHERE currency_from = 'USD' AND currency_to = 'LKR'
  ORDER BY rate_date DESC LIMIT 1
`);
```

---

## APIT Slab Calculation

The APIT uses a **progressive, stacking slab** structure. For each slab, only the income **within that band** is taxed at the slab rate.

### Algorithm

```typescript
function calculateApit(monthlyTaxableIncome: number, slabs: TaxSlab[]): number {
  let totalTax = 0;
  let remainingIncome = Math.max(0, monthlyTaxableIncome);

  for (const slab of slabs.sort((a, b) => a.slabOrder - b.slabOrder)) {
    if (remainingIncome <= 0) break;

    const slabWidth = slab.upperBound !== null
      ? slab.upperBound - slab.lowerBound
      : Infinity;  // Top slab has no ceiling

    const incomeInSlab = Math.min(remainingIncome, slabWidth);
    totalTax += incomeInSlab * slab.rate;

    remainingIncome -= incomeInSlab;
  }

  return Math.round(totalTax * 100) / 100;  // Round to 2 decimal places
}
```

> **Note:** The `fixed_amount` column in `tax_slabs` is reserved for future use where IRD publishes cumulative fixed amounts per slab (as seen in some APIT guidance tables). Currently `0` — tax is computed purely from rate × income.

---

## Pegging Allowance

```typescript
function calculatePeggingAllowance(pegging: PeggingConfig): number {
  if (!pegging.enabled) return 0;
  if (!pegging.baseRate || !pegging.currentRate || !pegging.peggedUsdValue) return 0;

  // Cannot be negative — if LKR strengthened, no negative allowance
  return Math.max(0, (pegging.currentRate - pegging.baseRate) * pegging.peggedUsdValue);
}
```

**Example:** Contract at USD 1,000 pegged at LKR 299/USD. Today's rate: LKR 320/USD.
```
Pegging Allowance = (320 - 299) × 1000 = LKR 21,000
```
This LKR 21,000 is added to gross salary and becomes **taxable income**.

---

## Engine Constraints

| Constraint | Rule |
|---|---|
| All monetary outputs | Rounded to 2 decimal places |
| Negative guard | `takeHomeSalary` cannot be below 0 (edge case: very high APIT on small salary) |
| Zero salary | Valid input — all outputs will be 0 |
| No slabs found | Engine returns `422 NO_TAX_SLABS` error — calculation aborted |
| Relief cap | Monthly relief cannot exceed taxable income (taxable income floored at 0) |

/**
 * LankaTax — Core Tax Calculation Engine
 *
 * Pure TypeScript module with zero external dependencies.
 * All inputs and outputs are plain objects — safe to unit test without Deno/Supabase.
 *
 * Canonical 8-step sequence:
 *   1. Pegging Allowance
 *   2. Gross Salary
 *   3. Employee EPF
 *   4. Taxable Income
 *   5. APIT Tax (progressive slabs)
 *   6. Take-Home Salary
 *   7. Employer Costs (EPF + ETF)
 *   8. USD Equivalent
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TaxSlab {
  lowerBound: number;
  upperBound: number | null; // null = top slab (no ceiling)
  rate: number;              // decimal: 0.06 = 6%
  fixedAmount: number;
  slabOrder: number;
}

export interface TaxRates {
  epfEmployeeRate: number; // 0.08
  epfEmployerRate: number; // 0.12
  etfEmployerRate: number; // 0.03
}

export interface PeggingConfig {
  enabled: boolean;
  baseRate?: number;      // Contract LKR/USD rate
  currentRate?: number;   // Today's LKR/USD rate
  peggedUsdValue?: number; // USD amount being pegged
}

export interface EngineInput {
  basicSalary: number;
  fixedAllowances?: number;
  transportAllowance?: number;
  dataAllowance?: number;
  otherAllowances?: number;
  taxReliefAnnual?: number;
  pegging?: PeggingConfig;
  exchangeRate?: number | null;
}

export interface EngineResult {
  peggingAllowance: number;
  grossSalary: number;
  epfBase: number;       // Basic salary only — EPF/ETF base
  employeeEpf: number;
  monthlyRelief: number;
  taxableIncome: number;
  apitTax: number;
  takeHomeSalary: number;
  employerEpf: number;
  employerEtf: number;
  employerCost: number;
  usdEquivalent: number | null;
}

// ─── Rounding Helpers ─────────────────────────────────────────────────────────

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

// ─── Step 1: Pegging Allowance ────────────────────────────────────────────────

/**
 * Calculates pegging allowance.
 * Result is floored at 0 — LKR cannot strengthen to create a negative allowance.
 */
export function calculatePeggingAllowance(pegging?: PeggingConfig): number {
  if (!pegging?.enabled) return 0;
  const { baseRate, currentRate, peggedUsdValue } = pegging;
  if (!baseRate || !currentRate || !peggedUsdValue) return 0;
  return Math.max(0, (currentRate - baseRate) * peggedUsdValue);
}

// ─── Step 5: APIT Calculation ─────────────────────────────────────────────────

/**
 * Detects whether slabs use the IRD direct formula method.
 * 2025/2026+ slabs store a fixedAmount > 0; 2024/2025 slabs have fixedAmount = 0.
 */
export function isDirectFormulaSlabs(slabs: TaxSlab[]): boolean {
  return slabs.some(s => s.fixedAmount > 0);
}

/**
 * IRD Table 1 Direct Formula (2025/2026+):
 *   tax = rate × grossIncome − fixedAmount
 *
 * Applied to GROSS monthly salary. Personal relief (Rs. 150,000/month) is
 * already embedded in fixedAmount — do NOT pre-deduct EPF or personal relief.
 * Source: IRD APIT Table No. 01, 2025/2026.
 */
export function calculateApitDirect(grossIncome: number, slabs: TaxSlab[]): number {
  if (grossIncome <= 0) return 0;
  const sorted = [...slabs].sort((a, b) => a.slabOrder - b.slabOrder);

  // Walk bands from lowest to highest; last matching band wins
  let applicableSlab = sorted[0];
  for (const slab of sorted) {
    if (grossIncome > slab.lowerBound) applicableSlab = slab;
    else break;
  }
  return round2(Math.max(0, (applicableSlab.rate * grossIncome) - applicableSlab.fixedAmount));
}

/**
 * Progressive slice method (2024/2025 and earlier):
 *   Each income band is taxed only on the slice that falls within it.
 * Applied to taxableIncome (gross − EPF − personal relief).
 */
export function calculateApitProgressive(monthlyTaxableIncome: number, slabs: TaxSlab[]): number {
  if (monthlyTaxableIncome <= 0 || slabs.length === 0) return 0;

  let totalTax = 0;
  let remaining = monthlyTaxableIncome;
  const sorted = [...slabs].sort((a, b) => a.slabOrder - b.slabOrder);

  for (const slab of sorted) {
    if (remaining <= 0) break;
    const bandWidth = slab.upperBound !== null ? slab.upperBound - slab.lowerBound : Infinity;
    const incomeInBand = Math.min(remaining, bandWidth);
    totalTax += incomeInBand * slab.rate;
    remaining -= incomeInBand;
  }
  return round2(totalTax);
}

/**
 * Unified APIT entry point — auto-selects calculation method based on slab data.
 */
export function calculateApit(income: number, slabs: TaxSlab[]): number {
  return isDirectFormulaSlabs(slabs)
    ? calculateApitDirect(income, slabs)
    : calculateApitProgressive(income, slabs);
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

/**
 * Runs the full 8-step LankaTax calculation.
 * Pure function — no side effects, no DB calls, no logging.
 */
export function runEngine(
  input: EngineInput,
  slabs: TaxSlab[],
  rates: TaxRates
): EngineResult {
  // Sanitise inputs — negative values not allowed
  const basic = Math.max(0, input.basicSalary ?? 0);
  const fixed = Math.max(0, input.fixedAllowances ?? 0);
  const transport = Math.max(0, input.transportAllowance ?? 0);
  const data = Math.max(0, input.dataAllowance ?? 0);
  const other = Math.max(0, input.otherAllowances ?? 0);
  const reliefAnnual = Math.max(0, input.taxReliefAnnual ?? 0);

  // Step 1 — Pegging Allowance
  const peggingAllowance = round2(calculatePeggingAllowance(input.pegging));

  // Step 2 — Gross Salary
  const grossSalary = round2(basic + fixed + transport + data + other + peggingAllowance);

  // Step 3 — Employee EPF (8% of basic salary only — allowances excluded per Sri Lankan EPF law)
  const epfBase = basic;
  const employeeEpf = round2(epfBase * rates.epfEmployeeRate);

  // Step 4 — Taxable Income
  // Direct-formula slabs (2025/2026+): APIT applied to gross; personal relief embedded in fixedAmount.
  // Progressive slabs (2024/2025):     APIT applied to (gross − EPF − personal relief).
  const directFormula = isDirectFormulaSlabs(slabs);
  const monthlyRelief = directFormula ? 0 : round2(reliefAnnual / 12);
  const taxableIncome = directFormula
    ? grossSalary
    : Math.max(0, round2(grossSalary - employeeEpf - monthlyRelief));

  // Step 5 — APIT Tax
  const apitTax = calculateApit(taxableIncome, slabs);

  // Step 6 — Take-Home Salary
  const takeHomeSalary = Math.max(0, round2(grossSalary - employeeEpf - apitTax));

  // Step 7 — Employer Costs (EPF/ETF on basic salary only)
  const employerEpf = round2(epfBase * rates.epfEmployerRate);
  const employerEtf = round2(epfBase * rates.etfEmployerRate);
  const employerCost = round2(grossSalary + employerEpf + employerEtf);

  // Step 8 — USD Equivalent
  const usdEquivalent =
    input.exchangeRate && input.exchangeRate > 0
      ? round4(grossSalary / input.exchangeRate)
      : null;

  return {
    peggingAllowance,
    grossSalary,
    epfBase,
    employeeEpf,
    monthlyRelief,
    taxableIncome,
    apitTax,
    takeHomeSalary,
    employerEpf,
    employerEtf,
    employerCost,
    usdEquivalent,
  };
}

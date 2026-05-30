/**
 * LankaTax Engine — Unit Tests (TC-01 to TC-20)
 *
 * Run: deno test supabase/functions/calculate-tax/engine.test.ts
 *
 * Tax year: 2024/2025 (monthly APIT slabs)
 * Rates: EPF Employee 8% | EPF Employer 12% | ETF 3%
 */

import {
  assertEquals,
  assertAlmostEquals,
} from 'https://deno.land/std@0.208.0/assert/mod.ts';
import {
  runEngine,
  calculateApit,
  calculatePeggingAllowance,
  round2,
} from './engine.ts';
import type { TaxSlab, TaxRates } from './engine.ts';

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const SLABS_2024_2025: TaxSlab[] = [
  { lowerBound: 0,         upperBound: 100000,    rate: 0.0000, fixedAmount: 0, slabOrder: 1 },
  { lowerBound: 100000,    upperBound: 141666.67, rate: 0.0600, fixedAmount: 0, slabOrder: 2 },
  { lowerBound: 141666.67, upperBound: 183333.33, rate: 0.1200, fixedAmount: 0, slabOrder: 3 },
  { lowerBound: 183333.33, upperBound: 225000.00, rate: 0.1800, fixedAmount: 0, slabOrder: 4 },
  { lowerBound: 225000.00, upperBound: 266666.67, rate: 0.2400, fixedAmount: 0, slabOrder: 5 },
  { lowerBound: 266666.67, upperBound: 308333.33, rate: 0.3000, fixedAmount: 0, slabOrder: 6 },
  { lowerBound: 308333.33, upperBound: null,       rate: 0.3600, fixedAmount: 0, slabOrder: 7 },
];

const RATES: TaxRates = {
  epfEmployeeRate: 0.08,
  epfEmployerRate: 0.12,
  etfEmployerRate: 0.03,
};

// ─── TC-01: Zero Salary ───────────────────────────────────────────────────────

Deno.test('TC-01: Zero salary — all outputs are zero', () => {
  const r = runEngine({ basicSalary: 0 }, SLABS_2024_2025, RATES);
  assertEquals(r.grossSalary, 0);
  assertEquals(r.employeeEpf, 0);
  assertEquals(r.taxableIncome, 0);
  assertEquals(r.apitTax, 0);
  assertEquals(r.takeHomeSalary, 0);
  assertEquals(r.employerEpf, 0);
  assertEquals(r.employerEtf, 0);
  assertEquals(r.employerCost, 0);
  assertEquals(r.usdEquivalent, null);
});

// ─── TC-02: Exactly at Tax-Free Threshold ─────────────────────────────────────

Deno.test('TC-02: Taxable income exactly at 100,000 — zero APIT', () => {
  // gross = 100,000 / (1 - 0.08) = 108,695.65...
  const r = runEngine({ basicSalary: 108695.65 }, SLABS_2024_2025, RATES);
  assertEquals(r.apitTax, 0);
  assertAlmostEquals(r.taxableIncome, 100000, 1);
});

// ─── TC-03: One LKR above tax-free threshold ─────────────────────────────────

Deno.test('TC-03: Taxable income just above 100,000 — enters 6% slab', () => {
  const r = runEngine({ basicSalary: 108696 }, SLABS_2024_2025, RATES);
  // taxableIncome ≈ 100,000.32 — a few cents in 6% band
  assertEquals(r.apitTax >= 0, true);
  assertEquals(r.taxableIncome > 100000, true);
});

// ─── TC-04: Exactly at Slab 2 upper boundary ─────────────────────────────────

Deno.test('TC-04: Taxable income = 141,666.67 — all tax at 6%', () => {
  const apitTax = calculateApit(141666.67, SLABS_2024_2025);
  assertAlmostEquals(apitTax, 2500.00, 0.05);
});

// ─── TC-05: One cent into Slab 3 ─────────────────────────────────────────────

Deno.test('TC-05: Taxable income = 141,666.68 — just enters 12% slab', () => {
  const apitTax = calculateApit(141666.68, SLABS_2024_2025);
  assertAlmostEquals(apitTax, 2500.00, 0.01); // negligible 12% on 0.01 LKR
});

// ─── TC-06: Mid Slab 3 ────────────────────────────────────────────────────────

Deno.test('TC-06: Taxable income = 160,000 — spans Slab 1-3', () => {
  const apitTax = calculateApit(160000, SLABS_2024_2025);
  // Slab1: 100,000×0% + Slab2: 41,667×6% + Slab3: 18,333×12%
  const expected = round2(41666.67 * 0.06 + 18333.33 * 0.12);
  assertAlmostEquals(apitTax, expected, 0.05);
});

// ─── TC-07: Mid Slab 4 ────────────────────────────────────────────────────────

Deno.test('TC-07: Taxable income = 200,000 — spans Slab 1-4', () => {
  const apitTax = calculateApit(200000, SLABS_2024_2025);
  assertAlmostEquals(apitTax, 10500.00, 0.05);
});

// ─── TC-08: Mid Slab 5 ────────────────────────────────────────────────────────

Deno.test('TC-08: Taxable income = 240,000 — spans Slab 1-5', () => {
  const apitTax = calculateApit(240000, SLABS_2024_2025);
  assertAlmostEquals(apitTax, 18600.00, 0.05);
});

// ─── TC-09: Mid Slab 6 ────────────────────────────────────────────────────────

Deno.test('TC-09: Taxable income = 290,000 — spans Slab 1-6', () => {
  const apitTax = calculateApit(290000, SLABS_2024_2025);
  assertAlmostEquals(apitTax, 32000.00, 0.05);
});

// ─── TC-10: Top Slab (Slab 7) ─────────────────────────────────────────────────

Deno.test('TC-10: Taxable income = 400,000 — reaches 36% top slab', () => {
  const apitTax = calculateApit(400000, SLABS_2024_2025);
  assertAlmostEquals(apitTax, 70500.00, 0.10);
});

// ─── TC-11: Pegging — Rate Risen ──────────────────────────────────────────────

Deno.test('TC-11: Pegging enabled — LKR weakened — allowance > 0', () => {
  const allowance = calculatePeggingAllowance({
    enabled: true,
    baseRate: 299,
    currentRate: 320,
    peggedUsdValue: 1000,
  });
  assertEquals(allowance, 21000);

  const r = runEngine(
    { basicSalary: 150000, pegging: { enabled: true, baseRate: 299, currentRate: 320, peggedUsdValue: 1000 } },
    SLABS_2024_2025,
    RATES
  );
  assertEquals(r.peggingAllowance, 21000);
  assertEquals(r.grossSalary, 171000);
});

// ─── TC-12: Pegging — LKR Strengthened ───────────────────────────────────────

Deno.test('TC-12: Pegging enabled — LKR strengthened — allowance is 0', () => {
  const allowance = calculatePeggingAllowance({
    enabled: true,
    baseRate: 320,
    currentRate: 299,
    peggedUsdValue: 1000,
  });
  assertEquals(allowance, 0); // MAX(0, negative) = 0
});

// ─── TC-13: Pegging — Equal Rates ─────────────────────────────────────────────

Deno.test('TC-13: Pegging enabled — rates equal — allowance is 0', () => {
  const allowance = calculatePeggingAllowance({
    enabled: true,
    baseRate: 310,
    currentRate: 310,
    peggedUsdValue: 500,
  });
  assertEquals(allowance, 0);
});

// ─── TC-14: Pegging Disabled ──────────────────────────────────────────────────

Deno.test('TC-14: Pegging disabled — ignored even if fields present', () => {
  const allowance = calculatePeggingAllowance({
    enabled: false,
    baseRate: 299,
    currentRate: 350,
    peggedUsdValue: 2000,
  });
  assertEquals(allowance, 0);
});

// ─── TC-15: Tax Relief Reduces Taxable Income ─────────────────────────────────

Deno.test('TC-15: Annual relief = 120,000 — reduces taxable income by 10,000', () => {
  const withRelief = runEngine(
    { basicSalary: 200000, taxReliefAnnual: 120000 },
    SLABS_2024_2025,
    RATES
  );
  const withoutRelief = runEngine(
    { basicSalary: 200000, taxReliefAnnual: 0 },
    SLABS_2024_2025,
    RATES
  );
  assertEquals(withRelief.monthlyRelief, 10000);
  assertEquals(withRelief.taxableIncome, withoutRelief.taxableIncome - 10000);
  assertEquals(withRelief.apitTax < withoutRelief.apitTax, true);
});

// ─── TC-16: Relief Exceeds Taxable Income ────────────────────────────────────

Deno.test('TC-16: Relief exceeds taxable income — taxableIncome floored at 0', () => {
  const r = runEngine(
    { basicSalary: 50000, taxReliefAnnual: 1200000 },
    SLABS_2024_2025,
    RATES
  );
  assertEquals(r.taxableIncome, 0);
  assertEquals(r.apitTax, 0);
  // Take-home = gross - EPF - 0 tax = 50,000 - 4,000 = 46,000
  assertEquals(r.takeHomeSalary, 46000);
});

// ─── TC-17: Allowances Push Into Higher Slab ─────────────────────────────────

Deno.test('TC-17: Allowances push taxable income into Slab 3', () => {
  const r = runEngine(
    { basicSalary: 100000, fixedAllowances: 50000, transportAllowance: 10000 },
    SLABS_2024_2025,
    RATES
  );
  assertEquals(r.grossSalary, 160000);
  // taxableIncome = 160,000 - 12,800 = 147,200 (in Slab 3)
  assertAlmostEquals(r.taxableIncome, 147200, 0.01);
  assertEquals(r.apitTax > 2500, true); // More than just Slab 2 max
});

// ─── TC-18: Employer Cost Calculation ────────────────────────────────────────

Deno.test('TC-18: Employer cost = gross + EPF(12%) + ETF(3%)', () => {
  const r = runEngine({ basicSalary: 100000 }, SLABS_2024_2025, RATES);
  assertEquals(r.grossSalary, 100000);
  assertEquals(r.employerEpf, 12000);
  assertEquals(r.employerEtf, 3000);
  assertEquals(r.employerCost, 115000);
});

// ─── TC-19: USD Equivalent ───────────────────────────────────────────────────

Deno.test('TC-19: USD equivalent = gross / exchange rate', () => {
  const r = runEngine(
    { basicSalary: 160000, exchangeRate: 320 },
    SLABS_2024_2025,
    RATES
  );
  assertEquals(r.usdEquivalent, 500.0);
});

// ─── TC-20: Full Integration Test ────────────────────────────────────────────

Deno.test('TC-20: Full integration — pegging + allowances + relief + USD', () => {
  const r = runEngine(
    {
      basicSalary: 200000,
      fixedAllowances: 30000,
      transportAllowance: 5000,
      dataAllowance: 2000,
      otherAllowances: 3000,
      taxReliefAnnual: 120000,
      pegging: { enabled: true, baseRate: 299, currentRate: 320, peggedUsdValue: 500 },
      exchangeRate: 320,
    },
    SLABS_2024_2025,
    RATES
  );

  assertEquals(r.peggingAllowance, 10500);
  assertEquals(r.grossSalary, 250500);
  assertEquals(r.employeeEpf, 20040);
  assertEquals(r.monthlyRelief, 10000);
  assertAlmostEquals(r.taxableIncome, 220460, 0.01);
  assertAlmostEquals(r.apitTax, 14182.80, 0.05);
  assertAlmostEquals(r.takeHomeSalary, 216277.20, 0.05);
  assertEquals(r.employerEpf, 30060);
  assertEquals(r.employerEtf, 7515);
  assertEquals(r.employerCost, 288075);
  assertEquals(r.usdEquivalent, 783.0);
});

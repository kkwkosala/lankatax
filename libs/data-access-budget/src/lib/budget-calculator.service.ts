import { Injectable } from '@angular/core';
import { BudgetAllocation, BudgetAmounts, BudgetRecord, BudgetTotals, FireProjection, OtherIncomeSource, RetirementProjection } from './budget.models';

@Injectable({ providedIn: 'root' })
export class BudgetCalculatorService {

  /** Computes LKR amounts from percentage sliders (Budget Planner tab). */
  computeAmounts(income: number, alloc: BudgetAllocation): BudgetAmounts {
    const totalPct   = alloc.needsPct + alloc.funPct + alloc.irregularPct + alloc.savingsPct;
    const isValid    = totalPct <= 100;
    const needs      = Math.round(income * alloc.needsPct     / 100);
    const fun        = Math.round(income * alloc.funPct        / 100);
    const irregular  = Math.round(income * alloc.irregularPct / 100);
    const savings    = Math.round(income * alloc.savingsPct   / 100);
    const unallocated = Math.max(0, Math.round(income - needs - fun - irregular - savings));
    return { needs, fun, irregular, savings, unallocated, totalPct, isValid };
  }

  computeTotals(incomeAmount: number, otherIncome: OtherIncomeSource[], spendAmount: number): BudgetTotals {
    const totalIncome = incomeAmount + otherIncome.reduce((s, x) => s + x.amount, 0);
    return { totalIncome, savings: totalIncome - spendAmount };
  }

  /**
   * Project FIRE crossover using historical records + future projection.
   *
   * Growth:    corpus[m] = (corpus[m-1] + savings[m]) × (1 + annualRate/12)
   * Target:    annualSpend / withdrawalRate  (corpus whose annual return covers expenses)
   * Real corpus: deflated by elapsed months so crossover is in today's LKR
   * Crossover: first year where realCorpus >= target
   *
   * Note: negative savings are allowed (overspending reduces corpus).
   */
  projectFire(
    history:                  BudgetRecord[],
    startingCorpus:           number,
    projectedMonthlySavings:  number,
    targetMonthlySpend:       number,
    annualGrowthRate:         number,
    withdrawalRate:           number,
    currentAge:               number,
    inflationRate:            number = 0.06,
  ): FireProjection {
    const monthlyRate           = annualGrowthRate / 12;
    const annualSpend           = targetMonthlySpend * 12;
    const independenceThreshold = withdrawalRate > 0 ? annualSpend / withdrawalRate : Infinity;

    const savingsMap = new Map<string, number>();
    for (const r of history) {
      const key   = r.budget_month.slice(0, 7);
      const total = r.income_amount + r.other_income.reduce((s, x) => s + x.amount, 0);
      savingsMap.set(key, total - r.spend_amount);
    }

    let startDate: Date;
    if (history.length > 0) {
      const earliest = history.map(r => r.budget_month).sort()[0];
      startDate = new Date(earliest.slice(0, 7) + '-01');
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const maxYears        = Math.max(1, 65 - currentAge);
    const maxMonths       = maxYears * 12;
    const yearlyLabels:     string[] = [];
    const yearlyCorpus:     number[] = [];
    const yearlyRealCorpus: number[] = [];

    let corpus = startingCorpus;
    let crossoverIndex: number | null = null;

    for (let m = 0; m < maxMonths; m++) {
      const d       = new Date(startDate.getFullYear(), startDate.getMonth() + m, 1);
      const key     = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const savings = savingsMap.has(key) ? savingsMap.get(key)! : projectedMonthlySavings;
      corpus        = (corpus + savings) * (1 + monthlyRate);

      if (d.getMonth() === 11 || m === maxMonths - 1) {
        const elapsedMonths = m + 1;
        const yearLabel     = String(d.getFullYear());
        const realValue     = corpus / Math.pow(1 + inflationRate, elapsedMonths / 12);

        yearlyLabels.push(yearLabel);
        yearlyCorpus.push(Math.round(corpus));
        yearlyRealCorpus.push(Math.round(realValue));

        if (crossoverIndex === null && realValue >= independenceThreshold) {
          crossoverIndex = yearlyLabels.length - 1;
        }
      }
    }

    const crossoverLabel = crossoverIndex !== null ? yearlyLabels[crossoverIndex] : null;
    const yearsToFire    = crossoverIndex !== null
      ? parseInt(crossoverLabel!, 10) - new Date().getFullYear()
      : null;

    return {
      labels:                yearlyLabels,
      corpus:                yearlyCorpus,
      realCorpus:            yearlyRealCorpus,
      independenceThreshold: Math.round(independenceThreshold),
      crossoverIndex,
      crossoverLabel,
      yearsToFire,
    };
  }

  /** Legacy — kept for existing combined retirement chart. */
  computeRetirement(
    monthlySavings: number,
    currentAge:     number,
    rates:          [number, number, number],
  ): RetirementProjection {
    const retirementAge = 55;
    const yearsToRetire = retirementAge - currentAge;
    const startYear     = new Date().getFullYear();
    const labels: string[]   = [];
    const series: number[][] = rates.map(() => []);

    for (let y = 0; y <= yearsToRetire; y++) {
      labels.push(String(startYear + y));
      for (let ri = 0; ri < rates.length; ri++) {
        const prev = y === 0 ? 0 : series[ri][y - 1];
        series[ri].push((prev + monthlySavings * 12) * (1 + rates[ri]));
      }
    }

    return { labels, pessimistic: series[0], base: series[1], optimistic: series[2], yearsToRetire, monthlySavings };
  }
}

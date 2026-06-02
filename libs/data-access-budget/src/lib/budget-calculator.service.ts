import { Injectable } from '@angular/core';
import { BudgetAllocation, BudgetAmounts, RetirementProjection } from './budget.models';

@Injectable({ providedIn: 'root' })
export class BudgetCalculatorService {

  /** Compute LKR amounts from percentage allocation */
  computeAmounts(income: number, alloc: BudgetAllocation): BudgetAmounts {
    const { needsPct, funPct, irregularPct, savingsPct } = alloc;
    const totalPct = needsPct + funPct + irregularPct + savingsPct;
    const isValid  = totalPct <= 100;

    return {
      income,
      needs:       this.pct(income, needsPct),
      fun:         this.pct(income, funPct),
      irregular:   this.pct(income, irregularPct),
      savings:     this.pct(income, savingsPct),
      unallocated: isValid ? this.pct(income, 100 - totalPct) : 0,
      totalPct,
      isValid,
    };
  }

  /**
   * Compute retirement projections for 3 interest rates.
   *
   * Formula (year-by-year accumulation):
   *   PV_0 = 0
   *   PV_y = (PV_{y-1} + monthlySavings × 12) × (1 + r)
   */
  computeRetirement(
    monthlySavings: number,
    currentAge: number,
    rates: [number, number, number],
  ): RetirementProjection {
    const retirementAge = 55;
    const yearsToRetire = retirementAge - currentAge;
    const startYear     = new Date().getFullYear();

    const labels: string[]  = [];
    const series: number[][] = rates.map(() => []);

    for (let y = 0; y <= yearsToRetire; y++) {
      labels.push(String(startYear + y));
      for (let ri = 0; ri < rates.length; ri++) {
        const prev = y === 0 ? 0 : series[ri][y - 1];
        series[ri].push((prev + monthlySavings * 12) * (1 + rates[ri]));
      }
    }

    return {
      labels,
      pessimistic:   series[0],
      base:          series[1],
      optimistic:    series[2],
      yearsToRetire,
      monthlySavings,
    };
  }

  isValid(alloc: BudgetAllocation): boolean {
    const total = alloc.needsPct + alloc.funPct + alloc.irregularPct + alloc.savingsPct;
    return total <= 100;
  }

  private pct(income: number, pct: number): number {
    return Math.round((income * pct) / 100);
  }
}

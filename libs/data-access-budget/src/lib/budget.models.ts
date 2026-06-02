export interface BudgetAllocation {
  needsPct:     number;  // 0–100
  funPct:       number;
  irregularPct: number;
  savingsPct:   number;  // auto-derived: 100 - sum of above (clamped to 0)
}

export interface BudgetAmounts {
  income:      number;
  needs:       number;
  fun:         number;
  irregular:   number;
  savings:     number;
  unallocated: number;
  totalPct:    number;
  isValid:     boolean;  // totalPct <= 100
}

export interface RetirementProjection {
  labels:        string[];   // ["2026", "2027", ..., "2055"]
  pessimistic:   number[];   // 8% annual
  base:          number[];   // 10% annual
  optimistic:    number[];   // 12% annual
  yearsToRetire: number;
  monthlySavings: number;
}

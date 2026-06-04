/** Percentage allocation sliders for the Budget Planner tab. */
export interface BudgetAllocation {
  needsPct:     number;
  funPct:       number;
  irregularPct: number;
  savingsPct:   number;
}

/** Computed LKR amounts from a BudgetAllocation (not stored). */
export interface BudgetAmounts {
  needs:       number;
  fun:         number;
  irregular:   number;
  savings:     number;
  unallocated: number;
  totalPct:    number;
  isValid:     boolean;
}

export interface OtherIncomeSource {
  label:  string;
  amount: number;
}

/** One month's persisted budget record (matches budget_profiles DB shape). */
export interface BudgetRecord {
  id:              string;
  budget_month:    string;              // "2026-06-01"
  income_amount:   number;             // take-home salary
  other_income:    OtherIncomeSource[];
  spend_amount:    number;
  starting_corpus: number;             // existing savings at first entry
  created_at:      string;
  updated_at:      string;
}

/** Derived totals computed from a BudgetRecord or form inputs (not stored). */
export interface BudgetTotals {
  totalIncome: number;   // income_amount + sum(other_income)
  savings:     number;   // totalIncome - spend_amount
}

/** FIRE projection output for the chart. */
export interface FireProjection {
  /** Year labels: ["2026", "2027", ...] */
  labels:                 string[];
  /** Nominal corpus value at end of each year (not inflation-adjusted). */
  corpus:                 number[];
  /** Real corpus in today's LKR (nominal deflated by elapsed time). */
  realCorpus:             number[];
  /** Target corpus = annualSpend / withdrawalRate (in today's LKR) */
  independenceThreshold:  number;
  /** Index in labels[] where real corpus first crosses the threshold (null if not reached). */
  crossoverIndex:         number | null;
  crossoverLabel:         string | null;
  yearsToFire:            number | null;
}

/** Kept for backward compatibility with the existing retirement chart component. */
export interface RetirementProjection {
  labels:         string[];
  pessimistic:    number[];
  base:           number[];
  optimistic:     number[];
  yearsToRetire:  number;
  monthlySavings: number;
}

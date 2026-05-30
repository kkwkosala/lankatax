// ─── Common ──────────────────────────────────────────────────────────────────
export interface ApiError {
  error: string;
  code: string;
}

// ─── Tax Domain ───────────────────────────────────────────────────────────────
export interface TaxSlab {
  id: string;
  lowerBound: number;
  upperBound: number | null;
  rate: number;
  fixedAmount: number;
  slabOrder: number;
  effectiveDate: string;
}

export interface TaxRate {
  ruleType: string;
  rateValue: number;
  effectiveDate: string;
}

export interface TaxYear {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface PeggingInput {
  enabled: boolean;
  baseRate?: number;
  currentRate?: number;
  peggedUsdValue?: number;
}

export interface TaxCalculationRequest {
  basicSalary: number;
  fixedAllowances?: number;
  transportAllowance?: number;
  dataAllowance?: number;
  otherAllowances?: number;
  taxReliefAnnual?: number;
  pegging?: PeggingInput;
  exchangeRate?: number;
  taxYear?: string;
}

export interface TaxSlabSnapshot {
  lowerBound: number;
  upperBound: number | null;
  rate: number;
  fixedAmount: number;
  slabOrder: number;
}

export interface TaxCalculationResult {
  inputs: TaxCalculationRequest;
  peggingAllowance: number;
  grossSalary: number;
  employeeEpf: number;
  taxableIncome: number;
  apitTax: number;
  takeHomeSalary: number;
  employerEpf: number;
  employerEtf: number;
  employerCost: number;
  usdEquivalent: number | null;
  exchangeRateUsed: number | null;
  taxYearLabel: string;
  taxSlabsUsed: TaxSlabSnapshot[];
  epfEmployeeRate: number;
  epfEmployerRate: number;
  etfEmployerRate: number;
  calculationId?: string;
  calculatedAt: string;
  disclaimer: string;
}

// ─── Salary Profiles ─────────────────────────────────────────────────────────
export interface SalaryProfile {
  id: string;
  name: string;
  basicSalary: number;
  fixedAllowances: number;
  transportAllowance: number;
  dataAllowance: number;
  otherAllowances: number;
  taxReliefAnnual: number;
  peggingEnabled: boolean;
  peggingBaseRate: number | null;
  peggingUsdValue: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

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

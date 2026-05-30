import { TaxCalculationRequest } from './tax-calculation-request.model';

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
  epfBase: number;       // Basic salary — EPF/ETF are calculated on this only
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

export interface SalaryFormValue {
  basicSalary: number;
  fixedAllowances: number;
  transportAllowance: number;
  dataAllowance: number;
  otherAllowances: number;
  peggingEnabled: boolean;
  peggingBaseRate: number | null;
  peggingCurrentRate: number | null;
  peggingUsdValue: number | null;
}

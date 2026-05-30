export interface CalculationHistoryItem {
  id: string;
  created_at: string;
  tax_year_label: string;
  basic_salary: number;
  gross_salary: number;
  take_home_salary: number;
  apit_tax: number;
  employee_epf: number;
  employer_cost: number;
  pegging_enabled: boolean;
  pegging_allowance: number;
}

import { createAction, props } from '@ngrx/store';
import { TaxCalculationRequest } from '../models/tax-calculation-request.model';
import { TaxCalculationResult } from '../models/tax-calculation-result.model';

export const CalculatorActions = {
  calculate: createAction('[Calculator] Calculate', props<{ request: TaxCalculationRequest }>()),
  calculateSuccess: createAction('[Calculator] Calculate Success', props<{ result: TaxCalculationResult }>()),
  calculateFailure: createAction('[Calculator] Calculate Failure', props<{ error: string }>()),
  clearResult: createAction('[Calculator] Clear Result'),
};

import { createAction, props } from '@ngrx/store';
import { TaxCalculationRequest } from '../models/tax-calculation-request.model';
import { TaxCalculationResult } from '../models/tax-calculation-result.model';

export const CalculatorActions = {
  calculate: createAction('[Calculator] Calculate', props<{ request: TaxCalculationRequest }>()),
  calculateSuccess: createAction('[Calculator] Calculate Success', props<{ result: TaxCalculationResult }>()),
  calculateFailure: createAction('[Calculator] Calculate Failure', props<{ error: string }>()),
  clearResult: createAction('[Calculator] Clear Result'),

  saveCalculation: createAction('[Calculator] Save Calculation', props<{
    result: TaxCalculationResult;
    personName: string;
    calculationMonth: string;
    comment: string;
  }>()),
  saveCalculationSuccess: createAction('[Calculator] Save Calculation Success', props<{ id: string }>()),
  saveCalculationFailure: createAction('[Calculator] Save Calculation Failure', props<{ error: string }>()),
  clearSaveStatus: createAction('[Calculator] Clear Save Status'),
};

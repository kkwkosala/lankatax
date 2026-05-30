import { createReducer, on } from '@ngrx/store';
import { TaxCalculationResult } from '../models/tax-calculation-result.model';
import { TaxCalculationRequest } from '../models/tax-calculation-request.model';
import { CalculatorActions } from './calculator.actions';

export interface CalculatorState {
  result: TaxCalculationResult | null;
  lastRequest: TaxCalculationRequest | null;
  loading: boolean;
  error: string | null;
}

export const initialCalculatorState: CalculatorState = {
  result: null,
  lastRequest: null,
  loading: false,
  error: null,
};

export const calculatorReducer = createReducer(
  initialCalculatorState,

  on(CalculatorActions.calculate, (state, { request }) => ({
    ...state,
    loading: true,
    error: null,
    lastRequest: request,
  })),

  on(CalculatorActions.calculateSuccess, (state, { result }) => ({
    ...state,
    result,
    loading: false,
    error: null,
  })),

  on(CalculatorActions.calculateFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(CalculatorActions.clearResult, (state) => ({
    ...state,
    result: null,
    error: null,
  }))
);

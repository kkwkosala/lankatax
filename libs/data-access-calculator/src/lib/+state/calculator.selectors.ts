import { createSelector, createFeatureSelector } from '@ngrx/store';
import { CalculatorState } from './calculator.reducer';

export const selectCalculatorState = createFeatureSelector<CalculatorState>('calculator');

export const selectCalculationResult = createSelector(selectCalculatorState, (s) => s.result);
export const selectCalculatorLoading = createSelector(selectCalculatorState, (s) => s.loading);
export const selectCalculatorError = createSelector(selectCalculatorState, (s) => s.error);
export const selectLastRequest = createSelector(selectCalculatorState, (s) => s.lastRequest);

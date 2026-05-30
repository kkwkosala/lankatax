import {
  Component,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { MatIconModule } from '@angular/material/icon';
import {
  CalculatorActions,
  selectCalculationResult,
  selectCalculatorLoading,
  selectCalculatorError,
} from '@lankatax/data-access-calculator';
import { SalaryInputFormComponent, SalaryFormValue } from '@lankatax/ui-salary-form';
import { TaxBreakdownCardComponent } from '@lankatax/ui-tax-breakdown';
import { DisclaimerBannerComponent, LoadingSpinnerComponent } from '@lankatax/ui-shared';
import type { TaxCalculationRequest } from '@lankatax/data-access-calculator';

@Component({
  selector: 'lt-calculator-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatIconModule,
    SalaryInputFormComponent,
    TaxBreakdownCardComponent,
    DisclaimerBannerComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="max-w-5xl mx-auto">
      <!-- Header -->
      <div class="mb-5">
        <h1 class="text-2xl font-bold text-gray-900">Salary Tax Calculator</h1>
        <p class="text-gray-500 mt-1 text-sm">Calculate your Sri Lankan APIT, EPF, ETF and take-home salary</p>
      </div>

      <lt-disclaimer-banner class="block mb-5"></lt-disclaimer-banner>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Input Form -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 class="text-base font-semibold text-gray-800 mb-4">Enter Salary Details</h2>
          <lt-salary-input-form (formSubmit)="onCalculate($event)"></lt-salary-input-form>
        </div>

        <!-- Results -->
        <div>
          <lt-loading-spinner *ngIf="loading$ | async"></lt-loading-spinner>

          <ng-container *ngIf="error$ | async as err">
            <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              <div class="flex items-start gap-2">
                <mat-icon class="text-red-400 text-base shrink-0 mt-0.5">error_outline</mat-icon>
                <div>
                  <p class="font-medium">Calculation failed</p>
                  <p class="mt-1 text-xs text-red-500">{{ err }}</p>
                  <p class="mt-2 text-xs text-red-400">Make sure the Supabase Edge Functions are deployed and your project URL is correct.</p>
                </div>
              </div>
            </div>
          </ng-container>

          <lt-tax-breakdown-card
            *ngIf="(result$ | async) && !(loading$ | async)"
            [result]="result$ | async"
          ></lt-tax-breakdown-card>

          <div
            *ngIf="!(result$ | async) && !(loading$ | async) && !(error$ | async)"
            class="flex flex-col items-center justify-center h-72 text-gray-300 text-center rounded-xl border-2 border-dashed border-gray-200"
          >
            <span class="text-5xl mb-3">🇱🇰</span>
            <p class="text-base font-medium text-gray-400">Enter salary details</p>
            <p class="text-xs text-gray-300 mt-1">Your tax breakdown will appear here</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CalculatorPageComponent {
  private readonly store = inject(Store);

  result$ = this.store.select(selectCalculationResult);
  loading$ = this.store.select(selectCalculatorLoading);
  error$ = this.store.select(selectCalculatorError);

  onCalculate(formValue: SalaryFormValue): void {
    const request: TaxCalculationRequest = {
      basicSalary: formValue.basicSalary,
      fixedAllowances:    formValue.fixedAllowances    || undefined,
      transportAllowance: formValue.transportAllowance || undefined,
      dataAllowance:      formValue.dataAllowance      || undefined,
      otherAllowances:    formValue.otherAllowances    || undefined,
      exchangeRate:       formValue.exchangeRate       ?? undefined,
      pegging: formValue.peggingEnabled
        ? {
            enabled:      true,
            baseRate:     formValue.peggingBaseRate    ?? undefined,
            currentRate:  formValue.peggingCurrentRate ?? undefined,
            peggedUsdValue: formValue.peggingUsdValue  ?? undefined,
          }
        : undefined,
    };
    this.store.dispatch(CalculatorActions.calculate({ request }));
  }
}

import {
  Component,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatIconModule } from '@angular/material/icon';
import {
  CalculatorActions,
  selectCalculationResult,
  selectCalculatorLoading,
  selectCalculatorError,
} from '@lankatax/data-access-calculator';
import { selectIsAuthenticated } from '@lankatax/data-access-auth';
import { SalaryInputFormComponent, SalaryFormValue } from '@lankatax/ui-salary-form';
import { TaxBreakdownCardComponent, TaxBracketsCardComponent } from '@lankatax/ui-tax-breakdown';
import { DisclaimerBannerComponent, LoadingSpinnerComponent } from '@lankatax/ui-shared';
import type { TaxCalculationRequest } from '@lankatax/data-access-calculator';

@Component({
  selector: 'lt-calculator-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    SalaryInputFormComponent,
    TaxBreakdownCardComponent,
    TaxBracketsCardComponent,
    DisclaimerBannerComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="max-w-screen-xl mx-auto">
      <!-- Header -->
      <div class="mb-5">
        <h1 class="text-2xl font-bold text-gray-900">Salary Tax Calculator</h1>
        <p class="text-gray-500 mt-1 text-sm">Calculate your Sri Lankan APIT, EPF, ETF and take-home salary</p>
      </div>

      <lt-disclaimer-banner class="block mb-5"></lt-disclaimer-banner>

      <!-- 3-column card layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        <!-- Card 1: Input Form -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 class="text-base font-semibold text-gray-800 mb-4">Enter Salary Details</h2>
          <lt-salary-input-form (formSubmit)="onCalculate($event)"></lt-salary-input-form>
        </div>

        <!-- Card 2: Tax Breakdown Summary -->
        <div class="min-h-[24rem]">
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

          <ng-container *ngIf="(result$ | async) as result">
            <ng-container *ngIf="!(loading$ | async)">
              <lt-tax-breakdown-card [result]="result"></lt-tax-breakdown-card>

              <!-- Auto-save indicator -->
              <div class="mt-3">
                <!-- Authenticated + auto-saved -->
                <div *ngIf="result.calculationId"
                  class="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
                  <mat-icon class="text-green-500 text-sm">check_circle</mat-icon>
                  <span>Saved to history</span>
                  <a routerLink="/reports/history"
                    class="ml-auto text-green-600 underline hover:text-green-800 font-medium">View history</a>
                </div>

                <!-- Not authenticated -->
                <div *ngIf="!result.calculationId && !(isAuthenticated$ | async)"
                  class="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
                  <mat-icon class="text-gray-400 text-sm">bookmark_border</mat-icon>
                  <span>
                    <a routerLink="/auth/login" class="text-orange-700 font-medium hover:underline">Sign in</a>
                    to save calculations to history
                  </span>
                </div>
              </div>
            </ng-container>
          </ng-container>

          <div
            *ngIf="!(result$ | async) && !(loading$ | async) && !(error$ | async)"
            class="flex flex-col items-center justify-center h-72 text-gray-300 text-center rounded-xl border-2 border-dashed border-gray-200"
          >
            <span class="text-5xl mb-3">&#x1F4CA;</span>
            <p class="text-base font-medium text-gray-400">Tax breakdown</p>
            <p class="text-xs text-gray-300 mt-1">Appears after calculation</p>
          </div>
        </div>

        <!-- Card 3: APIT Tax Brackets -->
        <div class="min-h-[24rem]">
          <lt-tax-brackets-card
            *ngIf="(result$ | async) && !(loading$ | async)"
            [result]="result$ | async"
          ></lt-tax-brackets-card>

          <div
            *ngIf="!(result$ | async) && !(loading$ | async) && !(error$ | async)"
            class="flex flex-col items-center justify-center h-72 text-gray-300 text-center rounded-xl border-2 border-dashed border-gray-200"
          >
            <span class="text-5xl mb-3">&#x1F9EE;</span>
            <p class="text-base font-medium text-gray-400">APIT brackets</p>
            <p class="text-xs text-gray-300 mt-1">Appears after calculation</p>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class CalculatorPageComponent {
  private readonly store = inject(Store);

  result$          = this.store.select(selectCalculationResult);
  loading$         = this.store.select(selectCalculatorLoading);
  error$           = this.store.select(selectCalculatorError);
  isAuthenticated$ = this.store.select(selectIsAuthenticated);

  onCalculate(formValue: SalaryFormValue): void {
    const request: TaxCalculationRequest = {
      basicSalary: formValue.basicSalary,
      fixedAllowances:    formValue.fixedAllowances    || undefined,
      transportAllowance: formValue.transportAllowance || undefined,
      dataAllowance:      formValue.dataAllowance      || undefined,
      otherAllowances:    formValue.otherAllowances    || undefined,
      pegging: formValue.peggingEnabled
        ? {
            enabled:        true,
            baseRate:       formValue.peggingBaseRate    ?? undefined,
            currentRate:    formValue.peggingCurrentRate ?? undefined,
            peggedUsdValue: formValue.peggingUsdValue    ?? undefined,
          }
        : undefined,
    };
    this.store.dispatch(CalculatorActions.calculate({ request }));
  }
}

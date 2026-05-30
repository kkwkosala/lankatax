import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import {
  CalculatorActions,
  selectCalculationResult,
  selectCalculatorLoading,
  selectCalculatorError,
} from '@lankatax/data-access-calculator';
import { SalaryInputFormComponent, SalaryFormValue } from '@lankatax/ui-salary-form';
import { TaxBreakdownCardComponent } from '@lankatax/ui-tax-breakdown';
import { DisclaimerBannerComponent, LoadingSpinnerComponent, ErrorAlertComponent } from '@lankatax/ui-shared';
import type { TaxCalculationRequest } from '@lankatax/data-access-calculator';

@Component({
  selector: 'lt-calculator-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    SalaryInputFormComponent,
    TaxBreakdownCardComponent,
    DisclaimerBannerComponent,
    LoadingSpinnerComponent,
    ErrorAlertComponent,
  ],
  template: `
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Salary Tax Calculator</h1>
        <p class="text-gray-500 mt-1">Calculate your Sri Lankan APIT, EPF, ETF and take-home salary</p>
      </div>

      <lt-disclaimer-banner></lt-disclaimer-banner>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

        <!-- Input Form -->
        <mat-card class="shadow-md">
          <mat-card-header>
            <mat-card-title>Enter Salary Details</mat-card-title>
          </mat-card-header>
          <mat-card-content class="mt-4">
            <lt-salary-input-form (formSubmit)="onCalculate($event)"></lt-salary-input-form>
          </mat-card-content>
        </mat-card>

        <!-- Results -->
        <div>
          <lt-loading-spinner *ngIf="loading$ | async"></lt-loading-spinner>

          <lt-error-alert [message]="error$ | async"></lt-error-alert>

          <lt-tax-breakdown-card
            *ngIf="(result$ | async) && !(loading$ | async)"
            [result]="result$ | async"
          ></lt-tax-breakdown-card>

          <div
            *ngIf="!(result$ | async) && !(loading$ | async)"
            class="flex flex-col items-center justify-center h-64 text-gray-400 text-center"
          >
            <span class="text-6xl mb-3">🇱🇰</span>
            <p class="text-lg font-medium">Enter your salary details</p>
            <p class="text-sm">Your tax breakdown will appear here</p>
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
      fixedAllowances: formValue.fixedAllowances || undefined,
      transportAllowance: formValue.transportAllowance || undefined,
      dataAllowance: formValue.dataAllowance || undefined,
      otherAllowances: formValue.otherAllowances || undefined,
      taxReliefAnnual: formValue.taxReliefAnnual || undefined,
      exchangeRate: formValue.exchangeRate ?? undefined,
      pegging: formValue.peggingEnabled
        ? {
            enabled: true,
            baseRate: formValue.peggingBaseRate ?? undefined,
            currentRate: formValue.peggingCurrentRate ?? undefined,
            peggedUsdValue: formValue.peggingUsdValue ?? undefined,
          }
        : undefined,
    };
    this.store.dispatch(CalculatorActions.calculate({ request }));
  }
}

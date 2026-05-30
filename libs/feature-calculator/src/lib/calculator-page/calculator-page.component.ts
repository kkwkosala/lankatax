import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { MatIconModule } from '@angular/material/icon';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged, filter, skip, take } from 'rxjs/operators';
import {
  CalculatorActions,
  selectCalculationResult,
  selectCalculatorLoading,
  selectCalculatorError,
  selectIsSaving,
  selectSavedId,
  selectSaveError,
} from '@lankatax/data-access-calculator';
import { selectIsAuthenticated } from '@lankatax/data-access-auth';
import { SalaryInputFormComponent, SalaryFormValue } from '@lankatax/ui-salary-form';
import { TaxBreakdownCardComponent, TaxBracketsCardComponent } from '@lankatax/ui-tax-breakdown';
import { DisclaimerBannerComponent, LoadingSpinnerComponent } from '@lankatax/ui-shared';
import type { TaxCalculationRequest } from '@lankatax/data-access-calculator';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'lt-calculator-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
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

      <!-- Toast notification -->
      <div *ngIf="toast$ | async as toast"
        class="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all"
        [class.bg-green-600]="toast.type === 'success'"
        [class.bg-red-600]="toast.type === 'error'"
        [class.text-white]="true"
      >
        <mat-icon class="text-base">{{ toast.type === 'success' ? 'check_circle' : 'error_outline' }}</mat-icon>
        {{ toast.message }}
      </div>

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

          <ng-container *ngIf="(result$ | async) && !(loading$ | async)">
            <lt-tax-breakdown-card [result]="result$ | async"></lt-tax-breakdown-card>

            <!-- Save button — only when authenticated -->
            <ng-container *ngIf="isAuthenticated$ | async">
              <button
                (click)="onSave()"
                [disabled]="saving$ | async"
                class="mt-3 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-orange-300 bg-orange-50 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed text-orange-700 text-sm font-medium transition-colors"
              >
                <mat-icon class="text-base">{{ (saving$ | async) ? 'hourglass_empty' : 'bookmark_add' }}</mat-icon>
                {{ (saving$ | async) ? 'Saving…' : 'Save Calculation' }}
              </button>
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
export class CalculatorPageComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly destroy$ = new Subject<void>();

  result$        = this.store.select(selectCalculationResult);
  loading$       = this.store.select(selectCalculatorLoading);
  error$         = this.store.select(selectCalculatorError);
  saving$        = this.store.select(selectIsSaving);
  isAuthenticated$ = this.store.select(selectIsAuthenticated);

  readonly toast$ = new BehaviorSubject<Toast | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.store.select(selectSavedId).pipe(
      distinctUntilChanged(),
      skip(1),
      filter(Boolean),
      takeUntil(this.destroy$),
    ).subscribe(() => this.showToast('Calculation saved to history!', 'success'));

    this.store.select(selectSaveError).pipe(
      distinctUntilChanged(),
      filter(Boolean),
      takeUntil(this.destroy$),
    ).subscribe((err) => this.showToast(err, 'error'));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

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

  onSave(): void {
    this.store.select(selectCalculationResult).pipe(
      take(1),
      filter(Boolean),
    ).subscribe((result) => {
      this.store.dispatch(CalculatorActions.saveCalculation({ result }));
    });
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast$.next({ message, type });
    this.toastTimer = setTimeout(() => this.toast$.next(null), 3500);
  }
}

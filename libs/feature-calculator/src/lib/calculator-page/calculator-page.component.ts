import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
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

interface Toast { message: string; type: 'success' | 'error'; }

@Component({
  selector: 'lt-calculator-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatIconModule,
    SalaryInputFormComponent,
    TaxBreakdownCardComponent,
    TaxBracketsCardComponent,
    DisclaimerBannerComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="max-w-screen-xl mx-auto">

      <div class="mb-5">
        <h1 class="text-2xl font-bold text-gray-900">Salary Tax Calculator</h1>
        <p class="text-gray-500 mt-1 text-sm">Calculate your Sri Lankan APIT, EPF, ETF and take-home salary</p>
      </div>

      <lt-disclaimer-banner class="block mb-5"></lt-disclaimer-banner>

      <!-- Toast -->
      <div *ngIf="toast$ | async as toast"
        class="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white"
        [class.bg-green-600]="toast.type === 'success'"
        [class.bg-red-600]="toast.type === 'error'">
        <mat-icon class="text-base">{{ toast.type === 'success' ? 'check_circle' : 'error_outline' }}</mat-icon>
        {{ toast.message }}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        <!-- Card 1: Input Form -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 class="text-base font-semibold text-gray-800 mb-4">Enter Salary Details</h2>
          <lt-salary-input-form (formSubmit)="onCalculate($event)"></lt-salary-input-form>
        </div>

        <!-- Card 2: Tax Breakdown -->
        <div class="min-h-[24rem]">
          <lt-loading-spinner *ngIf="loading$ | async"></lt-loading-spinner>

          <ng-container *ngIf="error$ | async as err">
            <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              <div class="flex items-start gap-2">
                <mat-icon class="text-red-400 text-base shrink-0 mt-0.5">error_outline</mat-icon>
                <div>
                  <p class="font-medium">Calculation failed</p>
                  <p class="mt-1 text-xs text-red-500">{{ err }}</p>
                </div>
              </div>
            </div>
          </ng-container>

          <ng-container *ngIf="(result$ | async) && !(loading$ | async)">
            <lt-tax-breakdown-card [result]="result$ | async"></lt-tax-breakdown-card>

            <!-- Save button (authenticated only) -->
            <ng-container *ngIf="isAuthenticated$ | async">

              <!-- Button -->
              <button *ngIf="!showSaveForm"
                (click)="openSaveForm()"
                class="mt-3 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-700 text-sm font-medium transition-colors">
                <mat-icon class="text-base">bookmark_add</mat-icon>
                Save Calculation
              </button>

              <!-- Inline save form -->
              <div *ngIf="showSaveForm"
                class="mt-3 bg-white rounded-xl border border-orange-200 shadow-sm p-4">

                <p class="text-sm font-semibold text-gray-800 mb-3">Save to History</p>

                <!-- Person name -->
                <div class="mb-3">
                  <label class="block text-xs font-medium text-gray-600 mb-1">Person Name</label>
                  <input
                    [(ngModel)]="savePersonName"
                    type="text"
                    placeholder="e.g. John Silva"
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                <!-- Month -->
                <div class="mb-3">
                  <label class="block text-xs font-medium text-gray-600 mb-1">Month</label>
                  <input
                    [(ngModel)]="saveMonth"
                    type="month"
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                <!-- Comment -->
                <div class="mb-4">
                  <label class="block text-xs font-medium text-gray-600 mb-1">
                    Comment <span class="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    [(ngModel)]="saveComment"
                    rows="2"
                    placeholder="Any notes..."
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                  ></textarea>
                </div>

                <!-- Actions -->
                <div class="flex gap-2">
                  <button
                    (click)="onSave()"
                    [disabled]="!savePersonName.trim() || !saveMonth || (saving$ | async)"
                    class="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-orange-700 hover:bg-orange-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors">
                    <mat-icon class="text-base">{{ (saving$ | async) ? 'hourglass_empty' : 'save' }}</mat-icon>
                    {{ (saving$ | async) ? 'Saving…' : 'Save' }}
                  </button>
                  <button
                    (click)="closeSaveForm()"
                    class="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </ng-container>

            <!-- Not logged in nudge -->
            <div *ngIf="!(isAuthenticated$ | async)"
              class="mt-3 flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
              <mat-icon class="text-gray-400 text-sm">bookmark_border</mat-icon>
              <span>
                <a routerLink="/auth/login" class="text-orange-700 font-medium hover:underline">Sign in</a>
                to save calculations to history
              </span>
            </div>
          </ng-container>

          <div
            *ngIf="!(result$ | async) && !(loading$ | async) && !(error$ | async)"
            class="flex flex-col items-center justify-center h-72 text-gray-300 text-center rounded-xl border-2 border-dashed border-gray-200">
            <span class="text-5xl mb-3">&#x1F4CA;</span>
            <p class="text-base font-medium text-gray-400">Tax breakdown</p>
            <p class="text-xs text-gray-300 mt-1">Appears after calculation</p>
          </div>
        </div>

        <!-- Card 3: APIT Brackets -->
        <div class="min-h-[24rem]">
          <lt-tax-brackets-card
            *ngIf="(result$ | async) && !(loading$ | async)"
            [result]="result$ | async">
          </lt-tax-brackets-card>

          <div
            *ngIf="!(result$ | async) && !(loading$ | async) && !(error$ | async)"
            class="flex flex-col items-center justify-center h-72 text-gray-300 text-center rounded-xl border-2 border-dashed border-gray-200">
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

  result$          = this.store.select(selectCalculationResult);
  loading$         = this.store.select(selectCalculatorLoading);
  error$           = this.store.select(selectCalculatorError);
  saving$          = this.store.select(selectIsSaving);
  isAuthenticated$ = this.store.select(selectIsAuthenticated);

  readonly toast$ = new BehaviorSubject<Toast | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  showSaveForm = false;
  savePersonName = '';
  saveMonth = this.currentMonth();
  saveComment = '';

  ngOnInit(): void {
    this.store.select(selectSavedId).pipe(
      distinctUntilChanged(), skip(1), filter(Boolean), takeUntil(this.destroy$),
    ).subscribe(() => {
      this.showToast('Calculation saved to history!', 'success');
      this.closeSaveForm();
    });

    this.store.select(selectSaveError).pipe(
      distinctUntilChanged(), filter(Boolean), takeUntil(this.destroy$),
    ).subscribe((err) => this.showToast(err, 'error'));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  onCalculate(formValue: SalaryFormValue): void {
    this.showSaveForm = false;
    this.store.dispatch(CalculatorActions.clearSaveStatus());
    const request: TaxCalculationRequest = {
      basicSalary:        formValue.basicSalary,
      fixedAllowances:    formValue.fixedAllowances    || undefined,
      transportAllowance: formValue.transportAllowance || undefined,
      dataAllowance:      formValue.dataAllowance      || undefined,
      otherAllowances:    formValue.otherAllowances    || undefined,
      pegging: formValue.peggingEnabled ? {
        enabled:        true,
        baseRate:       formValue.peggingBaseRate    ?? undefined,
        currentRate:    formValue.peggingCurrentRate ?? undefined,
        peggedUsdValue: formValue.peggingUsdValue    ?? undefined,
      } : undefined,
    };
    this.store.dispatch(CalculatorActions.calculate({ request }));
  }

  openSaveForm(): void {
    this.savePersonName = '';
    this.saveMonth = this.currentMonth();
    this.saveComment = '';
    this.showSaveForm = true;
    this.store.dispatch(CalculatorActions.clearSaveStatus());
  }

  closeSaveForm(): void {
    this.showSaveForm = false;
  }

  onSave(): void {
    this.store.select(selectCalculationResult).pipe(take(1), filter(Boolean)).subscribe((result) => {
      this.store.dispatch(CalculatorActions.saveCalculation({
        result,
        personName:       this.savePersonName.trim(),
        calculationMonth: this.saveMonth,
        comment:          this.saveComment.trim(),
      }));
    });
  }

  private currentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast$.next({ message, type });
    this.toastTimer = setTimeout(() => this.toast$.next(null), 3500);
  }
}

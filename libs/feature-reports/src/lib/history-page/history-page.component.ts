import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { BehaviorSubject } from 'rxjs';
import { TaxCalculatorApiService, CalculationHistoryItem } from '@lankatax/data-access-calculator';
import { LkrCurrencyPipe, LoadingSpinnerComponent } from '@lankatax/ui-shared';

@Component({
  selector: 'lt-history-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, MatIconModule, LkrCurrencyPipe, LoadingSpinnerComponent],
  template: `
    <div class="max-w-screen-lg mx-auto">

      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Calculation History</h1>
          <p class="text-gray-500 mt-1 text-sm">Your last 50 saved salary tax calculations</p>
        </div>
        <a routerLink="/calculator"
          class="flex items-center gap-1.5 text-sm text-orange-700 hover:text-orange-800 font-medium">
          <mat-icon class="text-base">calculate</mat-icon>
          New Calculation
        </a>
      </div>

      <!-- Loading -->
      <lt-loading-spinner *ngIf="loading$ | async"></lt-loading-spinner>

      <!-- Error -->
      <div *ngIf="(error$ | async) as err"
        class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center gap-2">
        <mat-icon class="text-red-400 text-base shrink-0">error_outline</mat-icon>
        {{ err }}
      </div>

      <!-- Empty state -->
      <div *ngIf="!(loading$ | async) && !(error$ | async) && (history$ | async)?.length === 0"
        class="flex flex-col items-center justify-center py-20 text-center rounded-xl border-2 border-dashed border-gray-200">
        <span class="text-5xl mb-3">&#x1F4C2;</span>
        <p class="text-base font-medium text-gray-400">No saved calculations yet</p>
        <p class="text-xs text-gray-300 mt-1 mb-4">Run a calculation and click "Save Calculation" to see it here</p>
        <a routerLink="/calculator"
          class="px-4 py-2 bg-orange-700 text-white text-sm font-semibold rounded-lg hover:bg-orange-800 transition-colors">
          Go to Calculator
        </a>
      </div>

      <!-- History table -->
      <div *ngIf="!(loading$ | async) && (history$ | async)?.length"
        class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        <!-- Table header -->
        <div class="grid grid-cols-5 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          <div class="col-span-1">Date</div>
          <div class="col-span-1">Tax Year</div>
          <div class="col-span-1 text-right">Gross Salary</div>
          <div class="col-span-1 text-right">Take-Home</div>
          <div class="col-span-1 text-right">APIT Tax</div>
        </div>

        <!-- Rows -->
        <div *ngFor="let item of history$ | async; let i = index; let last = last"
          class="grid grid-cols-5 gap-4 px-5 py-4 items-center text-sm hover:bg-gray-50 transition-colors"
          [class.border-b]="!last"
          [class.border-gray-100]="!last"
        >
          <!-- Date -->
          <div class="col-span-1">
            <p class="font-medium text-gray-800">{{ item.calculated_at | date:'d MMM yyyy' }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ item.calculated_at | date:'h:mm a' }}</p>
          </div>

          <!-- Tax Year + pegging badge -->
          <div class="col-span-1 flex items-center gap-1.5 flex-wrap">
            <span class="text-gray-700 font-medium">{{ item.tax_year_label }}</span>
            <span *ngIf="item.pegging_enabled"
              class="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
              Pegging
            </span>
          </div>

          <!-- Gross Salary -->
          <div class="col-span-1 text-right text-gray-800">
            {{ item.gross_salary | lkrCurrency }}
          </div>

          <!-- Take-Home -->
          <div class="col-span-1 text-right font-semibold text-green-600">
            {{ item.take_home_salary | lkrCurrency }}
          </div>

          <!-- APIT Tax -->
          <div class="col-span-1 text-right text-red-500">
            {{ item.apit_tax | lkrCurrency }}
          </div>
        </div>
      </div>

      <!-- Row count footer -->
      <p *ngIf="(history$ | async)?.length"
        class="mt-3 text-xs text-gray-400 text-right">
        Showing {{ (history$ | async)?.length }} calculation(s)
      </p>

    </div>
  `,
})
export class HistoryPageComponent implements OnInit {
  private readonly api = inject(TaxCalculatorApiService);

  readonly loading$ = new BehaviorSubject<boolean>(true);
  readonly error$   = new BehaviorSubject<string | null>(null);
  readonly history$ = new BehaviorSubject<CalculationHistoryItem[]>([]);

  ngOnInit(): void {
    this.api.getCalculationHistory().subscribe({
      next: (items) => {
        this.history$.next(items);
        this.loading$.next(false);
      },
      error: (err) => {
        this.error$.next(err?.error?.message ?? 'Failed to load history');
        this.loading$.next(false);
      },
    });
  }
}

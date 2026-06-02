import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import { selectCalculationResult } from '@lankatax/data-access-calculator';
import { BudgetCalculatorService } from '@lankatax/data-access-budget';
import { RetirementChartComponent } from '@lankatax/ui-charts';
import { LkrCurrencyPipe } from '@lankatax/ui-shared';

@Component({
  selector: 'lt-budget-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, FormsModule, MatIconModule, RetirementChartComponent, LkrCurrencyPipe],
  template: `
    <div class="max-w-screen-lg mx-auto">

      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Budget Planner</h1>
        <p class="text-gray-500 mt-1 text-sm">Split your take-home salary and project your retirement savings</p>
      </div>

      <!-- ① Income card -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
            <mat-icon class="text-orange-700 text-lg">account_balance_wallet</mat-icon>
          </div>
          <div>
            <p class="text-xs text-gray-400 uppercase tracking-wide font-semibold">Monthly Take-Home Income</p>
            <p class="text-2xl font-bold text-gray-900 mt-0.5">
              {{ income() | lkrCurrency }}
            </p>
          </div>
          <span class="flex-1"></span>
          <a routerLink="/calculator"
            class="flex items-center gap-1 text-xs text-orange-700 hover:text-orange-800 font-medium">
            <mat-icon class="text-sm">calculate</mat-icon>
            {{ calcResult() ? 'Recalculate' : 'Go to Calculator' }}
          </a>
        </div>

        <div *ngIf="!calcResult()"
          class="mt-3 flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <mat-icon class="text-amber-500 text-sm shrink-0 mt-0.5">info_outline</mat-icon>
          Run a salary calculation first to pre-fill your real take-home salary. Using LKR 0 for now.
        </div>
      </div>

      <!-- ② Allocation card -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
        <h2 class="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
          <mat-icon class="text-orange-700 text-lg">pie_chart</mat-icon>
          Allocate Your Salary
        </h2>

        <!-- Over-allocation warning -->
        <div *ngIf="!amounts().isValid"
          class="mb-4 flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <mat-icon class="text-red-500 text-sm shrink-0 mt-0.5">error_outline</mat-icon>
          Total allocation exceeds 100%. Reduce one or more categories.
        </div>

        <div class="space-y-5">
          <!-- Needs -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <div class="flex items-center gap-1.5">
                <span class="text-sm font-medium text-gray-700">🏠 Needs</span>
                <span class="text-xs text-gray-400">(rent, food, education, transport)</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-500 font-medium w-10 text-right">{{ needsPct() }}%</span>
                <span class="text-xs font-semibold text-gray-800 w-28 text-right">{{ amounts().needs | lkrCurrency }}</span>
              </div>
            </div>
            <input type="range" min="0" max="100" step="1"
              [value]="needsPct()"
              (input)="needsPct.set(+$any($event.target).value)"
              [style]="sliderStyle(needsPct())"
              class="lt-slider w-full cursor-pointer">
          </div>

          <!-- Fun -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <div class="flex items-center gap-1.5">
                <span class="text-sm font-medium text-gray-700">🎉 Fun & Entertainment</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-500 font-medium w-10 text-right">{{ funPct() }}%</span>
                <span class="text-xs font-semibold text-gray-800 w-28 text-right">{{ amounts().fun | lkrCurrency }}</span>
              </div>
            </div>
            <input type="range" min="0" max="100" step="1"
              [value]="funPct()"
              (input)="funPct.set(+$any($event.target).value)"
              [style]="sliderStyle(funPct())"
              class="lt-slider w-full cursor-pointer">
          </div>

          <!-- Irregular -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <div class="flex items-center gap-1.5">
                <span class="text-sm font-medium text-gray-700">🔧 Irregular Expenses</span>
                <span class="text-xs text-gray-400">(vehicle repairs, medical, etc.)</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-500 font-medium w-10 text-right">{{ irregularPct() }}%</span>
                <span class="text-xs font-semibold text-gray-800 w-28 text-right">{{ amounts().irregular | lkrCurrency }}</span>
              </div>
            </div>
            <input type="range" min="0" max="100" step="1"
              [value]="irregularPct()"
              (input)="irregularPct.set(+$any($event.target).value)"
              [style]="sliderStyle(irregularPct())"
              class="lt-slider w-full cursor-pointer">
          </div>

          <!-- Divider -->
          <div class="border-t border-gray-100 pt-4">

            <!-- Savings (auto-derived) -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <span class="text-sm font-semibold text-green-700">💰 Savings</span>
                <span class="text-xs text-gray-400">(auto-calculated)</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold w-10 text-right"
                  [class.text-green-700]="savingsPct() > 0"
                  [class.text-red-600]="savingsPct() <= 0">
                  {{ savingsPct() }}%
                </span>
                <span class="text-xs font-bold w-28 text-right"
                  [class.text-green-700]="savingsPct() > 0"
                  [class.text-red-600]="savingsPct() <= 0">
                  {{ amounts().savings | lkrCurrency }}
                </span>
              </div>
            </div>

            <!-- Unallocated -->
            <div *ngIf="amounts().unallocated > 0"
              class="flex items-center justify-between mt-2">
              <span class="text-xs text-gray-400">Unallocated</span>
              <span class="text-xs text-gray-400">{{ amounts().unallocated | lkrCurrency }}</span>
            </div>

            <!-- Total bar -->
            <div class="mt-3">
              <div class="flex justify-between text-xs mb-1">
                <span class="text-gray-400">Total allocated</span>
                <span [class.text-red-600]="!amounts().isValid"
                      [class.text-green-600]="amounts().isValid && amounts().totalPct === 100"
                      [class.text-gray-600]="amounts().isValid && amounts().totalPct < 100"
                      class="font-semibold">
                  {{ amounts().totalPct }}%
                </span>
              </div>
              <div class="w-full bg-gray-100 rounded-full h-2">
                <div class="h-2 rounded-full transition-all duration-200"
                  [style.width.%]="amounts().totalPct > 100 ? 100 : amounts().totalPct"
                  [class.bg-green-500]="amounts().isValid && amounts().totalPct === 100"
                  [class.bg-orange-500]="amounts().isValid && amounts().totalPct < 100"
                  [class.bg-red-500]="!amounts().isValid">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ③ Retirement Projection card -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 class="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
          <mat-icon class="text-orange-700 text-lg">trending_up</mat-icon>
          Retirement at 55
        </h2>

        <!-- Age input -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
          <div class="flex items-center gap-3">
            <label class="text-sm font-medium text-gray-700 shrink-0">Your current age</label>
            <input
              type="number" min="18" max="54"
              [value]="currentAge()"
              (input)="onAgeInput($any($event.target).value)"
              placeholder="e.g. 30"
              class="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 text-center"
            />
          </div>

          <ng-container *ngIf="projection() as proj">
            <div class="flex gap-4 text-sm text-gray-500">
              <span>⏳ <strong class="text-gray-800">{{ proj.yearsToRetire }}</strong> years to retire</span>
              <span>💰 Monthly saving: <strong class="text-gray-800">{{ proj.monthlySavings | lkrCurrency }}</strong></span>
            </div>
          </ng-container>
        </div>

        <!-- Validation messages -->
        <div *ngIf="currentAge() !== null && (currentAge()! < 18 || currentAge()! >= 55)"
          class="mb-4 flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <mat-icon class="text-amber-500 text-sm shrink-0">warning_amber</mat-icon>
          Please enter an age between 18 and 54 to see the retirement projection.
        </div>

        <div *ngIf="!amounts().isValid"
          class="mb-4 flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <mat-icon class="text-red-500 text-sm shrink-0">block</mat-icon>
          Fix the allocation (total > 100%) to view the retirement chart.
        </div>

        <div *ngIf="amounts().isValid && savingsPct() === 0 && currentAge() !== null"
          class="mb-4 flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
          <mat-icon class="text-gray-400 text-sm shrink-0">savings</mat-icon>
          Allocate some percentage to savings to see your retirement projection.
        </div>

        <!-- Chart -->
        <ng-container *ngIf="projection() as proj">
          <lt-retirement-chart [projection]="proj"></lt-retirement-chart>

          <!-- Text summary below chart -->
          <div class="mt-5 grid grid-cols-3 gap-3">
            <div class="bg-gray-50 rounded-lg p-3 text-center">
              <p class="text-xs text-gray-400 mb-1">Pessimistic (8%)</p>
              <p class="text-sm font-bold text-gray-600">{{ proj.pessimistic[proj.pessimistic.length - 1] | lkrCurrency }}</p>
            </div>
            <div class="bg-orange-50 rounded-lg p-3 text-center border border-orange-100">
              <p class="text-xs text-orange-600 mb-1">Base (10%)</p>
              <p class="text-sm font-bold text-orange-700">{{ proj.base[proj.base.length - 1] | lkrCurrency }}</p>
            </div>
            <div class="bg-green-50 rounded-lg p-3 text-center">
              <p class="text-xs text-green-600 mb-1">Optimistic (12%)</p>
              <p class="text-sm font-bold text-green-700">{{ proj.optimistic[proj.optimistic.length - 1] | lkrCurrency }}</p>
            </div>
          </div>

          <p class="mt-3 text-xs text-gray-400 text-right">
            * Personal savings only. See the combined chart below to include EPF &amp; ETF.
          </p>
        </ng-container>

        <!-- Empty state -->
        <div *ngIf="!projection()"
          class="flex flex-col items-center justify-center py-12 text-center rounded-xl border-2 border-dashed border-gray-200">
          <span class="text-4xl mb-3">📈</span>
          <p class="text-sm font-medium text-gray-400">Enter your age above</p>
          <p class="text-xs text-gray-300 mt-1">Your retirement projection will appear here</p>
        </div>

      </div>

      <!-- ④ Combined (Savings + EPF + ETF) Projection card -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mt-5">
        <h2 class="text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
          <mat-icon class="text-green-700 text-lg">account_balance</mat-icon>
          Total Retirement Fund — Savings + EPF + ETF
        </h2>
        <p class="text-xs text-gray-400 mb-5">Projects your combined monthly contributions (personal savings + all EPF/ETF contributions) to age 55.</p>

        <!-- Contribution breakdown -->
        <div *ngIf="calcResult()" class="mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="bg-orange-50 rounded-lg p-3 border border-orange-100">
            <p class="text-xs text-orange-600 mb-1">Personal Savings</p>
            <p class="text-sm font-bold text-orange-700">{{ amounts().savings | lkrCurrency }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ savingsPct() }}% of income</p>
          </div>
          <div class="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <p class="text-xs text-blue-600 mb-1">EPF (Employee 8%)</p>
            <p class="text-sm font-bold text-blue-700">{{ epfEmployee() | lkrCurrency }}</p>
            <p class="text-xs text-gray-400 mt-0.5">Deducted from salary</p>
          </div>
          <div class="bg-purple-50 rounded-lg p-3 border border-purple-100">
            <p class="text-xs text-purple-600 mb-1">EPF (Employer 12%)</p>
            <p class="text-sm font-bold text-purple-700">{{ epfEmployer() | lkrCurrency }}</p>
            <p class="text-xs text-gray-400 mt-0.5">Employer contribution</p>
          </div>
          <div class="bg-teal-50 rounded-lg p-3 border border-teal-100">
            <p class="text-xs text-teal-600 mb-1">ETF (Employer 3%)</p>
            <p class="text-sm font-bold text-teal-700">{{ etfEmployer() | lkrCurrency }}</p>
            <p class="text-xs text-gray-400 mt-0.5">Employer contribution</p>
          </div>
        </div>

        <!-- Total combined row -->
        <div *ngIf="calcResult()"
          class="flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-lg mb-5">
          <div class="flex items-center gap-2">
            <mat-icon class="text-green-600 text-base">savings</mat-icon>
            <span class="text-sm font-semibold text-green-800">Total Monthly Retirement Contributions</span>
          </div>
          <span class="text-base font-bold text-green-700">{{ combinedMonthly() | lkrCurrency }}</span>
        </div>

        <!-- No calculation nudge -->
        <div *ngIf="!calcResult()"
          class="mb-5 flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <mat-icon class="text-amber-500 text-sm shrink-0 mt-0.5">info_outline</mat-icon>
          Run a salary calculation first to include your EPF &amp; ETF contributions.
        </div>

        <!-- Combined chart -->
        <ng-container *ngIf="combinedProjection() as proj">
          <lt-retirement-chart [projection]="proj"></lt-retirement-chart>

          <div class="mt-5 grid grid-cols-3 gap-3">
            <div class="bg-gray-50 rounded-lg p-3 text-center">
              <p class="text-xs text-gray-400 mb-1">Pessimistic (8%)</p>
              <p class="text-sm font-bold text-gray-600">{{ proj.pessimistic[proj.pessimistic.length - 1] | lkrCurrency }}</p>
            </div>
            <div class="bg-green-50 rounded-lg p-3 text-center border border-green-100">
              <p class="text-xs text-green-600 mb-1">Base (10%)</p>
              <p class="text-sm font-bold text-green-700">{{ proj.base[proj.base.length - 1] | lkrCurrency }}</p>
            </div>
            <div class="bg-emerald-50 rounded-lg p-3 text-center">
              <p class="text-xs text-emerald-600 mb-1">Optimistic (12%)</p>
              <p class="text-sm font-bold text-emerald-700">{{ proj.optimistic[proj.optimistic.length - 1] | lkrCurrency }}</p>
            </div>
          </div>

          <p class="mt-3 text-xs text-gray-400 text-right">
            * EPF/ETF balances earn government-set rates in practice; 8/10/12% used here for scenario comparison only.
          </p>
        </ng-container>

        <!-- Empty state for combined chart -->
        <div *ngIf="!combinedProjection()"
          class="flex flex-col items-center justify-center py-12 text-center rounded-xl border-2 border-dashed border-gray-200">
          <span class="text-4xl mb-3">🏦</span>
          <p class="text-sm font-medium text-gray-400">Combined projection</p>
          <p class="text-xs text-gray-300 mt-1">Enter your age and run a calculation to see this chart</p>
        </div>

      </div>
    </div>
  `,
})
export class BudgetPageComponent {
  private readonly store = inject(Store);
  private readonly svc   = inject(BudgetCalculatorService);

  readonly calcResult = this.store.selectSignal(selectCalculationResult);
  readonly income     = computed(() => this.calcResult()?.takeHomeSalary ?? 0);

  readonly needsPct     = signal(50);
  readonly funPct       = signal(15);
  readonly irregularPct = signal(10);
  readonly currentAge   = signal<number | null>(null);

  readonly savingsPct = computed(() =>
    Math.max(0, 100 - this.needsPct() - this.funPct() - this.irregularPct())
  );

  readonly amounts = computed(() =>
    this.svc.computeAmounts(this.income(), {
      needsPct:     this.needsPct(),
      funPct:       this.funPct(),
      irregularPct: this.irregularPct(),
      savingsPct:   this.savingsPct(),
    })
  );

  readonly projection = computed(() => {
    const age = this.currentAge();
    if (age === null || age < 18 || age >= 55) return null;
    if (!this.amounts().isValid || this.savingsPct() === 0) return null;
    return this.svc.computeRetirement(
      this.amounts().savings,
      age,
      [0.08, 0.10, 0.12],
    );
  });

  // EPF (employee 8% + employer 12%) + ETF (employer 3%) from the last calculation
  readonly epfEmployee = computed(() => this.calcResult()?.employeeEpf    ?? 0);
  readonly epfEmployer = computed(() => this.calcResult()?.employerEpf    ?? 0);
  readonly etfEmployer = computed(() => this.calcResult()?.employerEtf    ?? 0);
  readonly totalEpfEtf = computed(() => this.epfEmployee() + this.epfEmployer() + this.etfEmployer());

  readonly combinedMonthly = computed(() => this.amounts().savings + this.totalEpfEtf());

  readonly combinedProjection = computed(() => {
    const age = this.currentAge();
    if (age === null || age < 18 || age >= 55) return null;
    if (!this.amounts().isValid) return null;
    if (this.combinedMonthly() === 0) return null;
    return this.svc.computeRetirement(
      this.combinedMonthly(),
      age,
      [0.08, 0.10, 0.12],
    );
  });

  onAgeInput(raw: string): void {
    const val = parseInt(raw, 10);
    this.currentAge.set(isNaN(val) ? null : val);
  }

  sliderStyle(value: number): string {
    const fill  = '#c2410c';   // orange-700
    const track = '#e5e7eb';   // gray-200
    return `
      appearance: none;
      -webkit-appearance: none;
      height: 6px;
      border-radius: 9999px;
      outline: none;
      background: linear-gradient(to right, ${fill} 0%, ${fill} ${value}%, ${track} ${value}%, ${track} 100%);
    `;
  }
}

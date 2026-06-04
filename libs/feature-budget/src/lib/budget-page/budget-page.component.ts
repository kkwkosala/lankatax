import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  OnInit,
  signal,
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
import { BudgetPlannerStateService } from '../budget-planner-state.service';

@Component({
  selector: 'lt-budget-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, FormsModule, MatIconModule, RetirementChartComponent, LkrCurrencyPipe],
  template: `
    <div class="max-w-screen-lg mx-auto">

      <!-- Income card -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
            <mat-icon class="text-orange-700 text-lg">account_balance_wallet</mat-icon>
          </div>
          <div class="flex-1">
            <p class="text-xs text-gray-400 uppercase tracking-wide font-semibold">Monthly Take-Home Income</p>
            <input type="number" min="0" step="1000"
              [value]="state.income()"
              (input)="state.income.set(+$any($event.target).value || 0)"
              placeholder="0"
              class="text-2xl font-bold text-gray-900 mt-0.5 w-full border-0 outline-none bg-transparent focus:ring-0 p-0" />
          </div>
          <a routerLink="/calculator"
            class="flex items-center gap-1 text-xs text-orange-700 hover:text-orange-800 font-medium shrink-0">
            <mat-icon class="text-sm">calculate</mat-icon>
            {{ calcResult() ? 'Recalculate' : 'Go to Calculator' }}
          </a>
        </div>

        <div *ngIf="!calcResult()"
          class="mt-3 flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <mat-icon class="text-amber-500 text-sm shrink-0 mt-0.5">info_outline</mat-icon>
          Run a salary calculation to auto-fill your take-home salary, or type it above.
        </div>
      </div>

      <!-- Allocation card -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
        <h2 class="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
          <mat-icon class="text-orange-700 text-lg">pie_chart</mat-icon>
          Allocate Your Salary
        </h2>

        <!-- Fixed Obligations -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              🔒 Fixed Obligations
              <span class="text-xs font-normal text-gray-400">(rent, EMIs, school fees)</span>
            </h3>
            <span class="text-sm font-bold text-red-700">{{ state.totalFixed() | lkrCurrency }}</span>
          </div>

          <div *ngFor="let item of state.fixedItems(); let i = index"
            class="flex items-center gap-2 mb-2">
            <input type="text"
              [value]="item.label"
              (input)="state.updateFixedItem(i, {label: $any($event.target).value})"
              placeholder="e.g. Rent"
              class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            <input type="number" min="0" step="1000"
              [value]="item.amount || null"
              (input)="state.updateFixedItem(i, {amount: +$any($event.target).value || 0})"
              placeholder="0"
              class="w-36 px-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-orange-400" />
            <button (click)="state.removeFixedItem(i)" type="button"
              class="text-gray-300 hover:text-red-500 transition-colors shrink-0">
              <mat-icon class="text-lg">close</mat-icon>
            </button>
          </div>

          <button (click)="state.addFixedItem()" type="button"
            class="flex items-center gap-1.5 text-xs text-orange-700 hover:text-orange-800 font-medium mt-1">
            <mat-icon class="text-sm">add_circle_outline</mat-icon>
            Add fixed item
          </button>
        </div>

        <!-- Variable Spend -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              🔄 Variable Spend
              <span class="text-xs font-normal text-gray-400">(groceries, transport, lifestyle)</span>
            </h3>
            <span class="text-sm font-bold text-amber-700">{{ state.totalVariable() | lkrCurrency }}</span>
          </div>

          <div *ngFor="let item of state.variableItems(); let i = index"
            class="flex items-center gap-2 mb-2">
            <input type="text"
              [value]="item.label"
              (input)="state.updateVariableItem(i, {label: $any($event.target).value})"
              placeholder="e.g. Food"
              class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            <input type="number" min="0" step="1000"
              [value]="item.amount || null"
              (input)="state.updateVariableItem(i, {amount: +$any($event.target).value || 0})"
              placeholder="0"
              class="w-36 px-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-orange-400" />
            <button (click)="state.removeVariableItem(i)" type="button"
              class="text-gray-300 hover:text-red-500 transition-colors shrink-0">
              <mat-icon class="text-lg">close</mat-icon>
            </button>
          </div>

          <button (click)="state.addVariableItem()" type="button"
            class="flex items-center gap-1.5 text-xs text-orange-700 hover:text-orange-800 font-medium mt-1">
            <mat-icon class="text-sm">add_circle_outline</mat-icon>
            Add variable item
          </button>
        </div>

        <!-- Summary bar -->
        <div class="border-t border-gray-100 pt-4">
          <div class="grid grid-cols-3 gap-3 mb-3">
            <div class="bg-red-50 rounded-lg p-3 text-center">
              <p class="text-xs text-gray-400 mb-1">Fixed</p>
              <p class="text-sm font-bold text-red-700">{{ state.totalFixed() | lkrCurrency }}</p>
            </div>
            <div class="bg-amber-50 rounded-lg p-3 text-center">
              <p class="text-xs text-gray-400 mb-1">Variable</p>
              <p class="text-sm font-bold text-amber-700">{{ state.totalVariable() | lkrCurrency }}</p>
            </div>
            <div class="rounded-lg p-3 text-center"
              [class.bg-green-50]="!state.isOverspent()"
              [class.bg-red-50]="state.isOverspent()">
              <p class="text-xs text-gray-400 mb-1">Savings</p>
              <p class="text-sm font-bold"
                [class.text-green-700]="!state.isOverspent()"
                [class.text-red-600]="state.isOverspent()">
                {{ state.isOverspent() ? '-' : '' }}{{ state.savingsAmount() | lkrCurrency }}
              </p>
            </div>
          </div>

          <!-- Savings rate badge -->
          <div class="flex items-center justify-center gap-2 px-4 py-3 rounded-lg"
            [class.bg-green-50]="!state.isOverspent()"
            [class.border]="true"
            [class.border-green-200]="!state.isOverspent()"
            [class.bg-red-50]="state.isOverspent()"
            [class.border-red-200]="state.isOverspent()">
            <mat-icon class="text-base"
              [class.text-green-600]="!state.isOverspent()"
              [class.text-red-500]="state.isOverspent()">
              {{ state.isOverspent() ? 'warning' : 'savings' }}
            </mat-icon>
            <span class="text-sm font-semibold"
              [class.text-green-800]="!state.isOverspent()"
              [class.text-red-700]="state.isOverspent()">
              {{ state.isOverspent() ? 'Overspending! Reduce expenses to save.' : 'Savings Rate: ' + state.savingsPct() + '%' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Retirement Projection card -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 class="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
          <mat-icon class="text-orange-700 text-lg">trending_up</mat-icon>
          Retirement at 55
        </h2>

        <div class="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
          <div class="flex items-center gap-3">
            <label class="text-sm font-medium text-gray-700 shrink-0">Your current age</label>
            <input type="number" min="18" max="54"
              [value]="currentAge()"
              (input)="onAgeInput($any($event.target).value)"
              placeholder="e.g. 30"
              class="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 text-center" />
          </div>

          <ng-container *ngIf="projection() as proj">
            <div class="flex gap-4 text-sm text-gray-500">
              <span>⏱ <strong class="text-gray-800">{{ proj.yearsToRetire }}</strong> years to retire</span>
              <span>💰 Saving: <strong class="text-gray-800">{{ proj.monthlySavings | lkrCurrency }}</strong>/mo</span>
            </div>
          </ng-container>
        </div>

        <div *ngIf="currentAge() !== null && (currentAge()! < 18 || currentAge()! >= 55)"
          class="mb-4 flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <mat-icon class="text-amber-500 text-sm shrink-0">warning_amber</mat-icon>
          Please enter an age between 18 and 54.
        </div>

        <div *ngIf="state.isOverspent()"
          class="mb-4 flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <mat-icon class="text-red-500 text-sm shrink-0">block</mat-icon>
          You're overspending — reduce fixed or variable items to unlock the projection.
        </div>

        <div *ngIf="!state.isOverspent() && state.savingsAmount() === 0 && currentAge() !== null"
          class="mb-4 flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
          <mat-icon class="text-gray-400 text-sm shrink-0">savings</mat-icon>
          Add your expenses above to see your savings and retirement projection.
        </div>

        <ng-container *ngIf="projection() as proj">
          <lt-retirement-chart [projection]="proj"></lt-retirement-chart>
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

        <div *ngIf="!projection()"
          class="flex flex-col items-center justify-center py-12 text-center rounded-xl border-2 border-dashed border-gray-200">
          <span class="text-4xl mb-3">📊</span>
          <p class="text-sm font-medium text-gray-400">Enter your age above</p>
        </div>
      </div>

      <!-- Combined (Savings + EPF + ETF) card -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mt-5">
        <h2 class="text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
          <mat-icon class="text-green-700 text-lg">account_balance</mat-icon>
          Total Retirement Fund — Savings + EPF + ETF
        </h2>
        <p class="text-xs text-gray-400 mb-5">Projects combined monthly contributions to age 55.</p>

        <div *ngIf="calcResult()" class="mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="bg-orange-50 rounded-lg p-3 border border-orange-100">
            <p class="text-xs text-orange-600 mb-1">Personal Savings</p>
            <p class="text-sm font-bold text-orange-700">{{ state.savingsAmount() | lkrCurrency }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ state.savingsPct() }}% of income</p>
          </div>
          <div class="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <p class="text-xs text-blue-600 mb-1">EPF (Employee 8%)</p>
            <p class="text-sm font-bold text-blue-700">{{ epfEmployee() | lkrCurrency }}</p>
          </div>
          <div class="bg-purple-50 rounded-lg p-3 border border-purple-100">
            <p class="text-xs text-purple-600 mb-1">EPF (Employer 12%)</p>
            <p class="text-sm font-bold text-purple-700">{{ epfEmployer() | lkrCurrency }}</p>
          </div>
          <div class="bg-teal-50 rounded-lg p-3 border border-teal-100">
            <p class="text-xs text-teal-600 mb-1">ETF (Employer 3%)</p>
            <p class="text-sm font-bold text-teal-700">{{ etfEmployer() | lkrCurrency }}</p>
          </div>
        </div>

        <div *ngIf="calcResult()"
          class="flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-lg mb-5">
          <div class="flex items-center gap-2">
            <mat-icon class="text-green-600 text-base">savings</mat-icon>
            <span class="text-sm font-semibold text-green-800">Total Monthly Retirement Contributions</span>
          </div>
          <span class="text-base font-bold text-green-700">{{ combinedMonthly() | lkrCurrency }}</span>
        </div>

        <div *ngIf="!calcResult()"
          class="mb-5 flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <mat-icon class="text-amber-500 text-sm shrink-0 mt-0.5">info_outline</mat-icon>
          Run a salary calculation first to include your EPF &amp; ETF contributions.
        </div>

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
            * EPF/ETF balances earn government-set rates in practice.
          </p>
        </ng-container>

        <div *ngIf="!combinedProjection()"
          class="flex flex-col items-center justify-center py-12 text-center rounded-xl border-2 border-dashed border-gray-200">
          <span class="text-4xl mb-3">🏦</span>
          <p class="text-sm font-medium text-gray-400">Enter your age and run a calculation to see this chart</p>
        </div>
      </div>
    </div>
  `,
})
export class BudgetPageComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly svc   = inject(BudgetCalculatorService);
  readonly state         = inject(BudgetPlannerStateService);

  readonly calcResult = this.store.selectSignal(selectCalculationResult);
  readonly currentAge = signal<number | null>(null);

  readonly projection = computed(() => {
    const age = this.currentAge();
    if (age === null || age < 18 || age >= 55) return null;
    if (this.state.savingsAmount() === 0) return null;
    return this.svc.computeRetirement(this.state.savingsAmount(), age, [0.08, 0.10, 0.12]);
  });

  readonly epfEmployee = computed(() => this.calcResult()?.employeeEpf ?? 0);
  readonly epfEmployer = computed(() => this.calcResult()?.employerEpf ?? 0);
  readonly etfEmployer = computed(() => this.calcResult()?.employerEtf ?? 0);
  readonly combinedMonthly = computed(() =>
    this.state.savingsAmount() + this.epfEmployee() + this.epfEmployer() + this.etfEmployer()
  );

  readonly combinedProjection = computed(() => {
    const age = this.currentAge();
    if (age === null || age < 18 || age >= 55) return null;
    if (this.combinedMonthly() === 0) return null;
    return this.svc.computeRetirement(this.combinedMonthly(), age, [0.08, 0.10, 0.12]);
  });

  ngOnInit(): void {
    const takeHome = this.calcResult()?.takeHomeSalary ?? 0;
    if (takeHome > 0 && this.state.income() === 0) {
      this.state.income.set(takeHome);
    }
  }

  onAgeInput(raw: string): void {
    const val = parseInt(raw, 10);
    this.currentAge.set(isNaN(val) ? null : val);
  }
}

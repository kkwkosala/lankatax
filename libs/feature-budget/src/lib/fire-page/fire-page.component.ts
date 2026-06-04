import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import { selectCalculationResult } from '@lankatax/data-access-calculator';
import { BudgetApiService, BudgetCalculatorService, BudgetRecord, OtherIncomeSource } from '@lankatax/data-access-budget';
import { FireChartComponent } from '@lankatax/ui-charts';
import { LkrCurrencyPipe } from '@lankatax/ui-shared';
import { BudgetPlannerStateService } from '../budget-planner-state.service';

@Component({
  selector: 'lt-fire-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, FormsModule, MatIconModule, FireChartComponent, LkrCurrencyPipe],
  template: `
    <div class="max-w-screen-lg mx-auto">

      <!-- ─── Current Month Card ─────────────────────────────────── -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-semibold text-gray-800 flex items-center gap-2">
            <mat-icon class="text-orange-700 text-lg">edit_calendar</mat-icon>
            Monthly Entry
          </h2>
          <!-- Month picker -->
          <input type="month"
            [value]="budgetMonth()"
            (change)="budgetMonth.set($any($event.target).value)"
            class="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>

        <!-- Income sources -->
        <div class="space-y-3 mb-4">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Income</p>

          <!-- Take-home salary -->
          <div class="flex items-center gap-3">
            <div class="flex-1">
              <label class="block text-xs text-gray-500 mb-1">
                Take-home salary
                <a routerLink="/calculator" class="ml-1 text-orange-600 hover:underline">(from calculator)</a>
              </label>
              <input type="number" min="0" step="1000"
                [value]="incomeAmount()"
                (input)="incomeAmount.set(+$any($event.target).value)"
                placeholder="0"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>

          <!-- Other income sources -->
          <div *ngFor="let src of otherIncome(); let i = index" class="flex items-center gap-2">
            <input type="text"
              [value]="src.label"
              (input)="updateOtherLabel(i, $any($event.target).value)"
              placeholder="e.g. Freelance, Rental"
              class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            <input type="number" min="0" step="1000"
              [value]="src.amount"
              (input)="updateOtherAmount(i, +$any($event.target).value)"
              placeholder="Amount"
              class="w-36 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            <button (click)="removeOtherIncome(i)" type="button"
              class="text-gray-400 hover:text-red-500 transition-colors">
              <mat-icon class="text-lg">close</mat-icon>
            </button>
          </div>

          <button (click)="addOtherIncome()" type="button"
            class="flex items-center gap-1.5 text-xs text-orange-700 hover:text-orange-800 font-medium">
            <mat-icon class="text-sm">add_circle_outline</mat-icon>
            Add other income source
          </button>

          <!-- Total income -->
          <div class="flex items-center justify-between pt-2 border-t border-gray-100">
            <span class="text-sm font-semibold text-gray-700">Total Income</span>
            <span class="text-sm font-bold text-gray-900">{{ totals().totalIncome | lkrCurrency }}</span>
          </div>
        </div>

        <!-- Spend -->
        <div class="mb-4">
          <label class="block text-xs text-gray-500 mb-1">Monthly Spend</label>
          <input type="number" min="0" step="1000"
            [value]="spendAmount()"
            (input)="spendAmount.set(+$any($event.target).value)"
            placeholder="0"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>

        <!-- Savings (auto) -->
        <div class="flex items-center justify-between px-4 py-3 rounded-lg mb-4"
          [class.bg-green-50]="totals().savings >= 0"
          [class.border-green-200]="totals().savings >= 0"
          [class.border]="true"
          [class.bg-red-50]="totals().savings < 0"
          [class.border-red-200]="totals().savings < 0">
          <div class="flex items-center gap-2">
            <mat-icon class="text-base" [class.text-green-600]="totals().savings >= 0" [class.text-red-500]="totals().savings < 0">
              {{ totals().savings >= 0 ? 'savings' : 'warning' }}
            </mat-icon>
            <span class="text-sm font-semibold" [class.text-green-800]="totals().savings >= 0" [class.text-red-700]="totals().savings < 0">
              Monthly Savings
            </span>
            <span *ngIf="totals().savings < 0" class="text-xs text-red-600">(overspending)</span>
          </div>
          <span class="text-base font-bold"
            [class.text-green-700]="totals().savings >= 0"
            [class.text-red-600]="totals().savings < 0">
            {{ totals().savings | lkrCurrency }}
          </span>
        </div>

        <!-- Starting corpus (only shown when no history exists) -->
        <div *ngIf="!hasHistory()" class="mb-4">
          <label class="block text-xs text-gray-500 mb-1">
            Current savings / investments (optional)
            <span class="text-gray-400 ml-1">— used as starting base for FIRE projection</span>
          </label>
          <input type="number" min="0" step="10000"
            [value]="startingCorpus()"
            (input)="startingCorpus.set(+$any($event.target).value)"
            placeholder="0"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>

        <!-- Save button -->
        <div class="flex items-center gap-3">
          <button (click)="saveMonth()" type="button"
            [disabled]="saving()"
            class="flex items-center gap-2 px-5 py-2.5 bg-orange-700 text-white text-sm font-semibold rounded-lg hover:bg-orange-800 disabled:opacity-50 transition-colors">
            <mat-icon class="text-sm">{{ saving() ? 'hourglass_empty' : 'save' }}</mat-icon>
            {{ saving() ? 'Saving…' : 'Save this month' }}
          </button>
          <span *ngIf="savedOk()" class="flex items-center gap-1 text-xs text-green-600 font-medium">
            <mat-icon class="text-sm">check_circle</mat-icon> Saved
          </span>
          <span *ngIf="saveError()" class="flex items-center gap-1 text-xs text-red-600">
            <mat-icon class="text-sm">error_outline</mat-icon> {{ saveError() }}
          </span>
        </div>
      </div>

      <!-- ─── Projection Settings ─────────────────────────────────── -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
        <h2 class="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <mat-icon class="text-orange-700 text-lg">tune</mat-icon>
          Projection Settings
        </h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label class="block text-xs text-gray-500 mb-1">Your current age</label>
            <input type="number" min="18" max="64"
              [value]="currentAge()"
              (input)="currentAge.set(+$any($event.target).value || 30)"
              placeholder="e.g. 30"
              class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Annual growth rate %</label>
            <input type="number" min="1" max="30" step="0.5"
              [value]="annualGrowthRate()"
              (input)="annualGrowthRate.set(+$any($event.target).value || 10)"
              placeholder="10"
              class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">
              Withdrawal rate %
              <span class="text-gray-400">(4% safe)</span>
            </label>
            <input type="number" min="1" max="20" step="0.5"
              [value]="withdrawalRate()"
              (input)="withdrawalRate.set(+$any($event.target).value || 4)"
              placeholder="4"
              class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">
              Inflation rate %
              <span class="text-gray-400">(LK avg 6%)</span>
            </label>
            <input type="number" min="0" max="50" step="0.5"
              [value]="inflationRate()"
              (input)="inflationRate.set(+$any($event.target).value || 6)"
              placeholder="6"
              class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
        </div>
        <p class="mt-3 text-xs text-gray-400">
          The chart shows your projected corpus in both nominal LKR and inflation-adjusted today's LKR.
          Independence is reached when the real corpus (today's LKR) meets your target.
        </p>
      </div>

      <!-- ─── FIRE Chart ──────────────────────────────────────────── -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
        <h2 class="text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
          <mat-icon class="text-green-600 text-lg">trending_up</mat-icon>
          Financial Independence Projection
        </h2>

        <!-- FIRE summary banner -->
        <div *ngIf="projection() as proj" class="mb-4">
          <div *ngIf="proj.yearsToFire !== null"
            class="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
            <mat-icon class="text-green-600 text-xl shrink-0">emoji_events</mat-icon>
            <div>
              <p class="text-sm font-semibold text-green-800">
                You can reach financial independence in <strong>{{ proj.yearsToFire }} year{{ proj.yearsToFire !== 1 ? 's' : '' }}</strong>
                ({{ proj.crossoverLabel }})
              </p>
              <p class="text-xs text-green-700 mt-0.5">
                Target corpus: {{ proj.independenceThreshold | lkrCurrency }} (today's LKR) &nbsp;·&nbsp;
                Saving {{ totals().savings | lkrCurrency }}/month &nbsp;·&nbsp;
                {{ annualGrowthRate() }}% growth / {{ withdrawalRate() }}% withdrawal / {{ inflationRate() }}% inflation
              </p>
            </div>
          </div>
          <div *ngIf="proj.yearsToFire === null"
            class="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
            <mat-icon class="text-amber-500 text-xl shrink-0">info_outline</mat-icon>
            <div>
              <p class="text-sm text-amber-800">
                At current savings, the target of
                <strong>{{ proj.independenceThreshold | lkrCurrency }}</strong> (today's LKR) is not reached by age 65.
              </p>
              <p class="text-xs text-amber-700 mt-0.5">Increase savings or adjust rates above.</p>
            </div>
          </div>
        </div>

        <div *ngIf="projection() as proj">
          <lt-fire-chart [projection]="proj"></lt-fire-chart>
          <p class="mt-2 text-xs text-gray-400 text-right">
            * Projection assumes constant future savings of {{ totals().savings | lkrCurrency }}/month.
            Real returns will vary.
          </p>
        </div>

        <div *ngIf="!projection()"
          class="flex flex-col items-center justify-center py-12 text-center rounded-xl border-2 border-dashed border-gray-200">
          <span class="text-4xl mb-3">📈</span>
          <p class="text-sm font-medium text-gray-400">Enter income, spend, and your age to see the projection</p>
        </div>
      </div>

      <!-- ─── Savings History ─────────────────────────────────────── -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div class="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 class="text-base font-semibold text-gray-800 flex items-center gap-2">
            <mat-icon class="text-orange-700 text-lg">history</mat-icon>
            Savings History
          </h2>
          <span class="text-xs text-gray-400">{{ history().length }} month(s) saved</span>
        </div>

        <div *ngIf="loadingHistory()" class="py-10 text-center text-sm text-gray-400">Loading…</div>

        <div *ngIf="!loadingHistory() && history().length === 0"
          class="py-10 text-center text-sm text-gray-400">
          No saved months yet — save this month to start tracking.
        </div>

        <div *ngIf="!loadingHistory() && history().length > 0">
          <!-- Header -->
          <div class="grid grid-cols-12 gap-2 px-5 py-2 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <div class="col-span-2">Month</div>
            <div class="col-span-3 text-right">Total Income</div>
            <div class="col-span-3 text-right">Spend</div>
            <div class="col-span-3 text-right">Savings</div>
            <div class="col-span-1"></div>
          </div>

          <div *ngFor="let r of history(); let last = last"
            class="grid grid-cols-12 gap-2 px-5 py-3 items-center text-sm hover:bg-gray-50 transition-colors"
            [class.border-b]="!last" [class.border-gray-100]="!last">

            <div class="col-span-2 font-medium text-gray-800">
              {{ r.budget_month | date:'MMM yyyy' }}
            </div>

            <div class="col-span-3 text-right text-gray-700">
              {{ (r.income_amount + sumOther(r.other_income)) | lkrCurrency }}
            </div>

            <div class="col-span-3 text-right text-gray-600">
              {{ r.spend_amount | lkrCurrency }}
            </div>

            <div class="col-span-3 text-right font-semibold"
              [class.text-green-600]="(r.income_amount + sumOther(r.other_income) - r.spend_amount) >= 0"
              [class.text-red-500]="(r.income_amount + sumOther(r.other_income) - r.spend_amount) < 0">
              {{ (r.income_amount + sumOther(r.other_income) - r.spend_amount) | lkrCurrency }}
            </div>

            <!-- Load to edit -->
            <div class="col-span-1 text-right">
              <button (click)="loadRecord(r)" type="button" title="Load to edit"
                class="text-gray-300 hover:text-orange-600 transition-colors">
                <mat-icon class="text-sm">edit</mat-icon>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
})
export class FirePageComponent implements OnInit {
  private readonly store    = inject(Store);
  private readonly svc      = inject(BudgetCalculatorService);
  private readonly api      = inject(BudgetApiService);
  private readonly planner  = inject(BudgetPlannerStateService);

  private readonly calcResult = this.store.selectSignal(selectCalculationResult);

  readonly budgetMonth    = signal(this.currentMonthStr());
  readonly incomeAmount   = signal(0);
  readonly otherIncome    = signal<OtherIncomeSource[]>([]);
  readonly spendAmount    = signal(0);
  readonly startingCorpus = signal(0);

  readonly currentAge      = signal(30);
  readonly annualGrowthRate = signal(10);
  readonly withdrawalRate   = signal(4);
  readonly inflationRate    = signal(6);

  readonly saving         = signal(false);
  readonly savedOk        = signal(false);
  readonly saveError      = signal<string | null>(null);
  readonly loadingHistory = signal(true);
  readonly history        = signal<BudgetRecord[]>([]);

  readonly totals = computed(() =>
    this.svc.computeTotals(this.incomeAmount(), this.otherIncome(), this.spendAmount())
  );

  readonly hasHistory = computed(() => this.history().length > 0);

  readonly projection = computed(() => {
    const age = this.currentAge();
    if (!age || age < 18 || age >= 65) return null;
    if (this.totals().totalIncome <= 0) return null;

    const startCorpus = this.hasHistory()
      ? (this.history().slice(-1)[0]?.starting_corpus ?? 0)
      : this.startingCorpus();

    return this.svc.projectFire(
      this.history(),
      startCorpus,
      this.totals().savings,
      this.spendAmount(),
      this.annualGrowthRate() / 100,
      this.withdrawalRate() / 100,
      age,
      this.inflationRate() / 100,
    );
  });

  ngOnInit(): void {
    // Pre-fill income: prefer planner's income (already set from calculator),
    // fall back to calculator result directly.
    const plannerIncome = this.planner.income();
    const takeHome      = this.calcResult()?.takeHomeSalary ?? 0;
    const incomeToUse   = plannerIncome > 0 ? plannerIncome : takeHome;
    if (incomeToUse > 0) this.incomeAmount.set(incomeToUse);

    // Pre-fill spend from planner's computed spend amount (needs + fun + irregular).
    const plannerSpend = this.planner.spendAmount();
    if (plannerSpend > 0) this.spendAmount.set(plannerSpend);

    this.loadHistory();
  }

  addOtherIncome(): void {
    this.otherIncome.update(list => [...list, { label: '', amount: 0 }]);
  }

  removeOtherIncome(index: number): void {
    this.otherIncome.update(list => list.filter((_, i) => i !== index));
  }

  updateOtherLabel(index: number, label: string): void {
    this.otherIncome.update(list =>
      list.map((item, i) => i === index ? { ...item, label } : item)
    );
  }

  updateOtherAmount(index: number, amount: number): void {
    this.otherIncome.update(list =>
      list.map((item, i) => i === index ? { ...item, amount: amount || 0 } : item)
    );
  }

  saveMonth(): void {
    this.saving.set(true);
    this.savedOk.set(false);
    this.saveError.set(null);

    this.api.saveMonth({
      budgetMonth:    this.budgetMonth(),
      incomeAmount:   this.incomeAmount(),
      otherIncome:    this.otherIncome(),
      spendAmount:    this.spendAmount(),
      startingCorpus: this.hasHistory() ? 0 : this.startingCorpus(),
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.savedOk.set(true);
        setTimeout(() => this.savedOk.set(false), 3000);
        this.loadHistory();
      },
      error: (err) => {
        this.saving.set(false);
        this.saveError.set(err?.error?.error ?? 'Save failed. Please try again.');
      },
    });
  }

  loadRecord(r: BudgetRecord): void {
    const [year, month] = r.budget_month.slice(0, 7).split('-');
    this.budgetMonth.set(`${year}-${month}`);
    this.incomeAmount.set(r.income_amount);
    this.otherIncome.set([...r.other_income]);
    this.spendAmount.set(r.spend_amount);
  }

  sumOther(sources: OtherIncomeSource[]): number {
    return sources.reduce((s, x) => s + x.amount, 0);
  }

  private loadHistory(): void {
    this.loadingHistory.set(true);
    this.api.getHistory().subscribe({
      next: (records) => {
        this.history.set(records);
        this.loadingHistory.set(false);
      },
      error: () => this.loadingHistory.set(false),
    });
  }

  private currentMonthStr(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}

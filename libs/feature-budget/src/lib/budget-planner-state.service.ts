import { Injectable, computed, signal } from '@angular/core';

export interface BudgetItem {
  label:  string;
  amount: number;
}

/**
 * Shared signal store for the Budget Planner tab.
 * FirePageComponent reads income + spendAmount to pre-fill its fields.
 */
@Injectable({ providedIn: 'root' })
export class BudgetPlannerStateService {
  /** Take-home salary. */
  readonly income = signal(0);

  /** Fixed monthly obligations (rent, EMIs, school fees, etc.). */
  readonly fixedItems = signal<BudgetItem[]>([
    { label: 'Rent / Housing',      amount: 0 },
    { label: 'Vehicle Leasing EMI', amount: 0 },
    { label: 'School Fees',         amount: 0 },
  ]);

  /** Variable monthly spend (groceries, transport, lifestyle). */
  readonly variableItems = signal<BudgetItem[]>([
    { label: 'Food & Groceries',          amount: 0 },
    { label: 'Transport',                 amount: 0 },
    { label: 'Utilities (CEB/Water/Net)', amount: 0 },
    { label: 'Healthcare',                amount: 0 },
  ]);

  readonly totalFixed    = computed(() => this.fixedItems()   .reduce((s, x) => s + Math.max(0, x.amount || 0), 0));
  readonly totalVariable = computed(() => this.variableItems().reduce((s, x) => s + Math.max(0, x.amount || 0), 0));

  /** Total spend — used as FIRE tracker default. */
  readonly spendAmount   = computed(() => this.totalFixed() + this.totalVariable());
  readonly savingsAmount = computed(() => Math.max(0, this.income() - this.spendAmount()));
  readonly savingsPct    = computed(() =>
    this.income() > 0 ? Math.round(this.savingsAmount() / this.income() * 100) : 0
  );
  readonly isOverspent   = computed(() => this.income() > 0 && this.spendAmount() > this.income());

  // ── Fixed item mutations ──────────────────────────────────────────────────

  addFixedItem(): void {
    this.fixedItems.update(items => [...items, { label: '', amount: 0 }]);
  }

  removeFixedItem(index: number): void {
    this.fixedItems.update(items => items.filter((_, i) => i !== index));
  }

  updateFixedItem(index: number, patch: Partial<BudgetItem>): void {
    this.fixedItems.update(items =>
      items.map((item, i) => i === index ? { ...item, ...patch } : item)
    );
  }

  // ── Variable item mutations ───────────────────────────────────────────────

  addVariableItem(): void {
    this.variableItems.update(items => [...items, { label: '', amount: 0 }]);
  }

  removeVariableItem(index: number): void {
    this.variableItems.update(items => items.filter((_, i) => i !== index));
  }

  updateVariableItem(index: number, patch: Partial<BudgetItem>): void {
    this.variableItems.update(items =>
      items.map((item, i) => i === index ? { ...item, ...patch } : item)
    );
  }
}

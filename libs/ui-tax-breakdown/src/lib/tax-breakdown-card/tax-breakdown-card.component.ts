import {
  Component,
  Input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LkrCurrencyPipe } from '@lankatax/ui-shared';
import { TaxCalculationResult } from '@lankatax/data-access-calculator';

interface Row {
  label: string;
  value: number | null;
  sub?: boolean;
  bold?: boolean;
  color?: 'green' | 'red' | 'blue';
  separator?: boolean;
}

@Component({
  selector: 'lt-tax-breakdown-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, LkrCurrencyPipe],
  template: `
    <div *ngIf="result" class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">

      <!-- Header -->
      <div class="bg-gradient-to-r from-orange-700 to-orange-600 px-5 py-4 text-white shrink-0">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-orange-200 uppercase tracking-wide">Tax Year</p>
            <p class="text-lg font-bold mt-0.5">{{ result.taxYearLabel }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-orange-200">Take-Home</p>
            <p class="text-xl font-bold mt-0.5">{{ result.takeHomeSalary | lkrCurrency }}</p>
          </div>
        </div>
      </div>

      <!-- Pegging allowance banner -->
      <div *ngIf="result.peggingAllowance > 0"
        class="mx-5 mt-4 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <mat-icon class="text-green-500 text-sm">trending_up</mat-icon>
          <div>
            <p class="text-xs font-semibold text-green-700">Pegging Allowance Active</p>
            <p class="text-xs text-green-500 mt-0.5">
              ({{ result.inputs.pegging?.currentRate }} − {{ result.inputs.pegging?.baseRate }})
              × USD {{ result.inputs.pegging?.peggedUsdValue | number:'1.2-2' }}
            </p>
          </div>
        </div>
        <span class="text-sm font-bold text-green-700">+ {{ result.peggingAllowance | lkrCurrency }}</span>
      </div>

      <!-- Summary tiles -->
      <div class="grid grid-cols-2 gap-px bg-gray-100 shrink-0">
        <div *ngFor="let tile of tiles" class="bg-white px-4 py-3">
          <p class="text-xs text-gray-400">{{ tile.label }}</p>
          <p class="text-sm font-semibold mt-0.5" [ngClass]="tile.cls">{{ tile.value | lkrCurrency }}</p>
        </div>
      </div>

      <!-- Detail rows -->
      <div class="px-5 py-4 space-y-0.5 flex-1 overflow-y-auto">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Full Breakdown</p>

        <ng-container *ngFor="let row of rows">
          <hr *ngIf="row.separator" class="my-2 border-gray-100" />
          <div class="flex justify-between items-center py-1.5 text-sm" [class.pl-3]="row.sub">
            <span [class.text-gray-400]="row.sub" [class.text-gray-700]="!row.sub" [class.font-semibold]="row.bold">
              {{ row.label }}
            </span>
            <span
              [class.font-semibold]="row.bold"
              [class.text-green-600]="row.color === 'green'"
              [class.text-red-500]="row.color === 'red'"
              [class.text-blue-600]="row.color === 'blue'"
              [class.text-gray-800]="!row.color"
            >
              {{ row.value | lkrCurrency }}
            </span>
          </div>
        </ng-container>

        <!-- USD equivalent -->
        <div *ngIf="result.usdEquivalent" class="mt-3 bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-700 flex items-center gap-2">
          <mat-icon class="text-blue-400 text-sm">attach_money</mat-icon>
          USD equivalent: <strong>USD {{ result.usdEquivalent | number:'1.2-2' }}</strong>
          &nbsp;@ LKR {{ result.exchangeRateUsed }}/USD
        </div>

        <!-- Rate badges -->
        <div class="mt-3 flex flex-wrap gap-2">
          <span class="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">EPF (Employee) {{ result.epfEmployeeRate * 100 }}%</span>
          <span class="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">EPF (Employer) {{ result.epfEmployerRate * 100 }}%</span>
          <span class="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">ETF {{ result.etfEmployerRate * 100 }}%</span>
        </div>

        <p class="mt-3 text-xs text-gray-300">{{ result.disclaimer }}</p>
      </div>
    </div>
  `,
})
export class TaxBreakdownCardComponent {
  @Input() result: TaxCalculationResult | null = null;

  get tiles() {
    if (!this.result) return [];
    return [
      { label: 'Gross Salary',      value: this.result.grossSalary,  cls: 'text-gray-800' },
      { label: 'APIT Tax',          value: this.result.apitTax,      cls: 'text-red-500'  },
      { label: 'Employee EPF (8%)', value: this.result.employeeEpf,  cls: 'text-red-500'  },
      { label: 'Employer Cost',     value: this.result.employerCost, cls: 'text-gray-800' },
    ];
  }

  get rows(): Row[] {
    if (!this.result) return [];
    const r = this.result;
    const rows: Row[] = [{ label: 'Basic Salary', value: r.inputs.basicSalary }];
    if ((r.inputs.fixedAllowances    ?? 0) > 0) rows.push({ label: 'Fixed Allowances',    value: r.inputs.fixedAllowances    ?? 0, sub: true });
    if ((r.inputs.transportAllowance ?? 0) > 0) rows.push({ label: 'Transport Allowance', value: r.inputs.transportAllowance ?? 0, sub: true });
    if ((r.inputs.dataAllowance      ?? 0) > 0) rows.push({ label: 'Data Allowance',      value: r.inputs.dataAllowance      ?? 0, sub: true });
    if ((r.inputs.otherAllowances    ?? 0) > 0) rows.push({ label: 'Other Allowances',    value: r.inputs.otherAllowances    ?? 0, sub: true });
    if (r.peggingAllowance > 0)                  rows.push({ label: 'Pegging Allowance',   value: r.peggingAllowance,              sub: true, color: 'green' });
    rows.push({ label: 'Gross Salary',        value: r.grossSalary,    bold: true, separator: true });
    rows.push({ label: 'Employee EPF (8%)',   value: r.employeeEpf,    color: 'red', sub: true });
    rows.push({ label: 'APIT Tax',            value: r.apitTax,        color: 'red', sub: true });
    rows.push({ label: 'Take-Home Salary',    value: r.takeHomeSalary, bold: true, color: 'green', separator: true });
    rows.push({ label: 'Employer EPF (12%)',  value: r.employerEpf,    color: 'red', sub: true, separator: true });
    rows.push({ label: 'Employer ETF (3%)',   value: r.employerEtf,    color: 'red', sub: true });
    rows.push({ label: 'Total Employer Cost', value: r.employerCost,   bold: true });
    return rows;
  }
}

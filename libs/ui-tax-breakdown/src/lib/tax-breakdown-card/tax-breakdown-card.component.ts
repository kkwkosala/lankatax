import {
  Component,
  Input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LkrCurrencyPipe } from '@lankatax/ui-shared';
import { TaxCalculationResult, TaxSlabSnapshot } from '@lankatax/data-access-calculator';

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
    <div *ngIf="result" class="space-y-4">

      <!-- Main breakdown card -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        <!-- Header -->
        <div class="bg-gradient-to-r from-orange-700 to-orange-600 px-5 py-4 text-white">
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

        <!-- Summary tiles -->
        <div class="grid grid-cols-2 gap-px bg-gray-100">
          <div *ngFor="let tile of tiles" class="bg-white px-4 py-3">
            <p class="text-xs text-gray-400">{{ tile.label }}</p>
            <p class="text-sm font-semibold mt-0.5" [ngClass]="tile.cls">{{ tile.value | lkrCurrency }}</p>
          </div>
        </div>

        <!-- Detail rows -->
        <div class="px-5 py-4 space-y-0.5">
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

          <div *ngIf="result.usdEquivalent" class="mt-3 bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-700 flex items-center gap-2">
            <mat-icon class="text-blue-400 text-sm">attach_money</mat-icon>
            USD equivalent: <strong>USD {{ result.usdEquivalent | number:'1.2-2' }}</strong>
            &nbsp;@ LKR {{ result.exchangeRateUsed }}/USD
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
            <span class="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">EPF (Employee) {{ result.epfEmployeeRate * 100 }}%</span>
            <span class="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">EPF (Employer) {{ result.epfEmployerRate * 100 }}%</span>
            <span class="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">ETF {{ result.etfEmployerRate * 100 }}%</span>
          </div>

          <p class="mt-3 text-xs text-gray-300">{{ result.disclaimer }}</p>
        </div>
      </div>

      <!-- APIT Tax Brackets card -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        <div class="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <mat-icon class="text-orange-500 text-base">account_balance</mat-icon>
          <div>
            <p class="text-sm font-semibold text-gray-800">APIT Tax Brackets — {{ result.taxYearLabel }}</p>
            <p class="text-xs text-gray-400 mt-0.5">
              <span *ngIf="isDirectFormula">Personal relief: LKR 150,000/month (LKR 1,800,000/year) — built into IRD formula.</span>
              <span *ngIf="!isDirectFormula">Annual exemption: LKR 1,200,000 (LKR 100,000/month) — reflected in Band 1 (0%).</span>
            </p>
          </div>
        </div>

        <!-- How APIT is computed -->
        <div class="px-5 py-3 bg-orange-50 border-b border-orange-100">
          <p class="text-xs font-semibold text-orange-700 mb-1.5">How APIT tax is calculated</p>

          <!-- 2025/2026+ direct formula method -->
          <ng-container *ngIf="isDirectFormula">
            <div class="flex flex-wrap gap-2 text-xs text-orange-800 items-center">
              <span class="bg-white border border-orange-200 px-2 py-1 rounded font-medium">Gross {{ result.grossSalary | lkrCurrency }}</span>
              <span class="text-orange-400 font-bold">→ find band →</span>
              <span class="bg-white border border-orange-200 px-2 py-1 rounded font-medium">rate × gross − deduction</span>
              <span class="text-orange-400 font-bold">=</span>
              <span class="bg-orange-600 text-white px-2 py-1 rounded font-bold">APIT {{ result.apitTax | lkrCurrency }}</span>
            </div>
            <p class="text-xs text-orange-500 mt-1.5">
              ✓ IRD Table 1 applied to gross salary directly — personal relief (LKR 150,000/month) is embedded in each band's formula.
            </p>
          </ng-container>

          <!-- 2024/2025 progressive method -->
          <ng-container *ngIf="!isDirectFormula">
            <div class="flex flex-wrap gap-2 text-xs text-orange-800 items-center">
              <span class="bg-white border border-orange-200 px-2 py-1 rounded font-medium">Gross {{ result.grossSalary | lkrCurrency }}</span>
              <span class="text-orange-400 font-bold">−</span>
              <span class="bg-white border border-orange-200 px-2 py-1 rounded font-medium">EPF {{ result.employeeEpf | lkrCurrency }}</span>
              <span class="text-orange-400 font-bold">=</span>
              <span class="bg-orange-600 text-white px-2 py-1 rounded font-bold">Taxable {{ result.taxableIncome | lkrCurrency }}</span>
            </div>
            <p class="text-xs text-orange-500 mt-1.5">
              ✓ The first LKR 100,000/month is tax-free — reflected in Band 1 (0%) below.
            </p>
          </ng-container>
        </div>

        <!-- Slab table -->
        <div class="divide-y divide-gray-50">
          <div class="grid grid-cols-12 px-4 py-1.5 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <div class="col-span-5">Monthly Range</div>
            <div class="col-span-3 text-center">Rate</div>
            <div class="col-span-4 text-right">Tax</div>
          </div>

          <ng-container *ngFor="let slab of result.taxSlabsUsed">
            <div
              class="grid grid-cols-12 px-4 py-2.5 text-xs items-center"
              [class.bg-orange-50]="isActiveSlab(slab)"
              [class.border-l-2]="isActiveSlab(slab)"
              [class.border-l-orange-500]="isActiveSlab(slab)"
            >
              <div class="col-span-5 font-medium" [class.text-orange-700]="isActiveSlab(slab)" [class.text-gray-600]="!isActiveSlab(slab)">
                <span *ngIf="slab.upperBound !== null">{{ slab.lowerBound | lkrCurrency }} – {{ slab.upperBound | lkrCurrency }}</span>
                <span *ngIf="slab.upperBound === null">Above {{ slab.lowerBound | lkrCurrency }}</span>
              </div>
              <div class="col-span-3 flex justify-center">
                <span
                  class="px-2 py-0.5 rounded-full text-xs font-bold"
                  [class.bg-green-100]="slab.rate === 0"
                  [class.text-green-700]="slab.rate === 0"
                  [class.bg-orange-100]="slab.rate > 0 && isActiveSlab(slab)"
                  [class.text-orange-700]="slab.rate > 0 && isActiveSlab(slab)"
                  [class.bg-gray-100]="slab.rate > 0 && !isActiveSlab(slab)"
                  [class.text-gray-500]="slab.rate > 0 && !isActiveSlab(slab)"
                >
                  {{ slab.rate === 0 ? 'Exempt' : (slab.rate * 100) + '%' }}
                </span>
              </div>
              <div class="col-span-4 text-right" [class.text-orange-700]="isActiveSlab(slab)" [class.text-gray-400]="!isActiveSlab(slab)">
                <span *ngIf="slab.rate === 0" class="text-green-600 font-medium">—</span>
                <span *ngIf="slab.rate > 0 && isDirectFormula && !isActiveSlab(slab)" class="text-xs text-gray-300">
                  {{ (slab.rate * 100) }}% × x − {{ slab.fixedAmount | lkrCurrency }}
                </span>
                <span *ngIf="slab.rate > 0 && (!isDirectFormula || isActiveSlab(slab))" class="font-medium">
                  {{ slabTax(slab) | lkrCurrency }}
                  <span *ngIf="isActiveSlab(slab)" class="ml-1 text-orange-400">◀</span>
                </span>
              </div>
            </div>
          </ng-container>

          <div class="grid grid-cols-12 px-4 py-2.5 bg-red-50 text-xs items-center font-bold border-t border-red-100">
            <div class="col-span-5 text-red-700">Total APIT Tax</div>
            <div class="col-span-3"></div>
            <div class="col-span-4 text-right text-red-600">{{ result.apitTax | lkrCurrency }}</div>
          </div>
        </div>

        <div class="px-5 py-2.5 bg-gray-50 text-xs text-gray-400">
          Source: IRD APIT Tax Table No. 01 (2025/2026) — Inland Revenue Act No. 24 of 2017 (as amended). ◀ marks your active income band.
        </div>
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

  isActiveSlab(slab: TaxSlabSnapshot): boolean {
    if (!this.result) return false;
    const income = this.result.taxableIncome; // grossSalary for 2025/2026 direct method
    return income > slab.lowerBound && (slab.upperBound === null || income <= slab.upperBound);
  }

  slabTax(slab: TaxSlabSnapshot): number {
    if (!this.result || slab.rate === 0) return 0;
    const income = this.result.taxableIncome;

    if (this.isDirectFormula) {
      // IRD formula: rate × grossIncome − fixedAmount (only meaningful for the active band)
      if (!this.isActiveSlab(slab)) return 0;
      return Math.max(0, Math.round((slab.rate * income - slab.fixedAmount) * 100) / 100);
    }

    // Progressive: tax on the income slice within this band
    if (income <= slab.lowerBound) return 0;
    const taxableInBand = Math.min(income, slab.upperBound ?? income) - slab.lowerBound;
    return Math.round(taxableInBand * slab.rate * 100) / 100;
  }

  get isDirectFormula(): boolean {
    return (this.result?.taxSlabsUsed ?? []).some(s => s.fixedAmount > 0);
  }
}
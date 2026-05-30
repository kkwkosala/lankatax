import {
  Component,
  Input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LkrCurrencyPipe } from '@lankatax/ui-shared';
import { TaxCalculationResult, TaxSlabSnapshot } from '@lankatax/data-access-calculator';

@Component({
  selector: 'lt-tax-brackets-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, LkrCurrencyPipe],
  template: `
    <div *ngIf="result" class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">

      <!-- Header -->
      <div class="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
        <mat-icon class="text-orange-500 text-base">account_balance</mat-icon>
        <div>
          <p class="text-sm font-semibold text-gray-800">APIT Tax Brackets</p>
          <p class="text-xs text-gray-400 mt-0.5">{{ result.taxYearLabel }}
            <span *ngIf="isDirectFormula"> · LKR 150k/month exempt</span>
            <span *ngIf="!isDirectFormula"> · LKR 100k/month exempt</span>
          </p>
        </div>
      </div>

      <!-- Pegging allowance notice -->
      <div *ngIf="result.peggingAllowance > 0"
        class="px-4 py-2.5 bg-green-50 border-b border-green-100 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <mat-icon class="text-green-500 text-sm">trending_up</mat-icon>
          <div>
            <p class="text-xs font-semibold text-green-700">Pegging Allowance</p>
            <p class="text-xs text-green-500">
              ({{ result.inputs.pegging?.currentRate }} − {{ result.inputs.pegging?.baseRate }})
              × USD {{ result.inputs.pegging?.peggedUsdValue | number:'1.2-2' }}
            </p>
          </div>
        </div>
        <div class="text-right">
          <span class="text-sm font-bold text-green-700">+ {{ result.peggingAllowance | lkrCurrency }}</span>
          <p class="text-xs text-green-500">added to gross</p>
        </div>
      </div>

      <!-- How APIT is computed -->
      <div class="px-4 py-3 bg-orange-50 border-b border-orange-100">
        <p class="text-xs font-semibold text-orange-700 mb-1.5">Calculation basis</p>

        <!-- 2025/2026+ direct formula -->
        <ng-container *ngIf="isDirectFormula">
          <div class="flex flex-wrap gap-1.5 text-xs text-orange-800 items-center">
            <span class="bg-white border border-orange-200 px-2 py-1 rounded font-medium">Gross {{ result.grossSalary | lkrCurrency }}</span>
            <span class="text-orange-400 font-bold">→ find band →</span>
            <span class="bg-orange-600 text-white px-2 py-1 rounded font-bold">rate × gross − deduction</span>
          </div>
          <p class="text-xs text-orange-500 mt-1.5">
            ✓ IRD Table 1 — personal relief (LKR 150k/month) embedded in formula.
          </p>
        </ng-container>

        <!-- 2024/2025 progressive -->
        <ng-container *ngIf="!isDirectFormula">
          <div class="flex flex-wrap gap-1.5 text-xs text-orange-800 items-center">
            <span class="bg-white border border-orange-200 px-2 py-1 rounded font-medium">Gross {{ result.grossSalary | lkrCurrency }}</span>
            <span class="text-orange-400 font-bold">−</span>
            <span class="bg-white border border-orange-200 px-2 py-1 rounded font-medium">EPF {{ result.employeeEpf | lkrCurrency }}</span>
            <span class="text-orange-400 font-bold">=</span>
            <span class="bg-orange-600 text-white px-2 py-1 rounded font-bold">Taxable {{ result.taxableIncome | lkrCurrency }}</span>
          </div>
          <p class="text-xs text-orange-500 mt-1.5">
            ✓ First LKR 100k/month tax-free — Band 1 (0%) below.
          </p>
        </ng-container>
      </div>

      <!-- Slab table -->
      <div class="divide-y divide-gray-50 flex-1">
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

      <!-- Footer -->
      <div class="px-4 py-2 bg-gray-50 text-xs text-gray-400 border-t border-gray-100">
        Source: IRD APIT Tax Table No. 01 (2025/2026) — IRA No. 24 of 2017 (as amended). ◀ = your band.
      </div>
    </div>
  `,
})
export class TaxBracketsCardComponent {
  @Input() result: TaxCalculationResult | null = null;

  get isDirectFormula(): boolean {
    return (this.result?.taxSlabsUsed ?? []).some(s => s.fixedAmount > 0);
  }

  isActiveSlab(slab: TaxSlabSnapshot): boolean {
    if (!this.result) return false;
    const income = this.result.taxableIncome;
    return income > slab.lowerBound && (slab.upperBound === null || income <= slab.upperBound);
  }

  slabTax(slab: TaxSlabSnapshot): number {
    if (!this.result || slab.rate === 0) return 0;
    const income = this.result.taxableIncome;
    if (this.isDirectFormula) {
      if (!this.isActiveSlab(slab)) return 0;
      return Math.max(0, Math.round((slab.rate * income - slab.fixedAmount) * 100) / 100);
    }
    if (income <= slab.lowerBound) return 0;
    const taxableInBand = Math.min(income, slab.upperBound ?? income) - slab.lowerBound;
    return Math.round(taxableInBand * slab.rate * 100) / 100;
  }
}

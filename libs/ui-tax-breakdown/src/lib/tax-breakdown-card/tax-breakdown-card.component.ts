import {
  Component,
  Input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { LkrCurrencyPipe } from '@lankatax/ui-shared';
import { TaxCalculationResult } from '@lankatax/data-access-calculator';

interface BreakdownRow {
  label: string;
  value: number | null;
  highlight?: 'positive' | 'negative' | 'neutral';
  bold?: boolean;
  indent?: boolean;
}

@Component({
  selector: 'lt-tax-breakdown-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatChipsModule,
    LkrCurrencyPipe,
  ],
  template: `
    <mat-card *ngIf="result" class="shadow-md">
      <mat-card-header>
        <mat-card-title class="flex items-center gap-2">
          <mat-icon color="primary">calculate</mat-icon>
          Salary Breakdown — {{ result.taxYearLabel }}
        </mat-card-title>
        <mat-card-subtitle>Calculated at {{ result.calculatedAt | date:'medium' }}</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content class="mt-4 space-y-1">

        <!-- Income section -->
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-1">Income</p>
        <ng-container *ngFor="let row of incomeRows">
          <ng-container *ngTemplateOutlet="rowTpl; context: { row }"></ng-container>
        </ng-container>

        <mat-divider class="my-3"></mat-divider>

        <!-- Deductions section -->
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-1">Deductions</p>
        <ng-container *ngFor="let row of deductionRows">
          <ng-container *ngTemplateOutlet="rowTpl; context: { row }"></ng-container>
        </ng-container>

        <mat-divider class="my-3"></mat-divider>

        <!-- Summary section -->
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-1">Summary</p>
        <ng-container *ngFor="let row of summaryRows">
          <ng-container *ngTemplateOutlet="rowTpl; context: { row }"></ng-container>
        </ng-container>

        <mat-divider class="my-3"></mat-divider>

        <!-- Employer section -->
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-1">Employer Cost</p>
        <ng-container *ngFor="let row of employerRows">
          <ng-container *ngTemplateOutlet="rowTpl; context: { row }"></ng-container>
        </ng-container>

        <!-- Rates used -->
        <div class="mt-4 flex flex-wrap gap-2">
          <mat-chip-set>
            <mat-chip>EPF (E): {{ result.epfEmployeeRate * 100 }}%</mat-chip>
            <mat-chip>EPF (ER): {{ result.epfEmployerRate * 100 }}%</mat-chip>
            <mat-chip>ETF: {{ result.etfEmployerRate * 100 }}%</mat-chip>
          </mat-chip-set>
        </div>

        <!-- USD equivalent -->
        <div *ngIf="result.usdEquivalent" class="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
          <mat-icon class="text-blue-400 text-base align-middle">attach_money</mat-icon>
          USD equivalent: <strong>USD {{ result.usdEquivalent | number:'1.2-2' }}</strong>
          (@ LKR {{ result.exchangeRateUsed }}/USD)
        </div>

      </mat-card-content>
    </mat-card>

    <!-- Row template -->
    <ng-template #rowTpl let-row="row">
      <div
        class="flex justify-between items-center py-1 text-sm"
        [class.pl-4]="row.indent"
        [class.font-semibold]="row.bold"
      >
        <span class="text-gray-700">{{ row.label }}</span>
        <span
          [class.text-green-700]="row.highlight === 'positive'"
          [class.text-red-600]="row.highlight === 'negative'"
          [class.text-gray-900]="!row.highlight || row.highlight === 'neutral'"
        >
          {{ row.value | lkrCurrency }}
        </span>
      </div>
    </ng-template>
  `,
})
export class TaxBreakdownCardComponent {
  @Input() result: TaxCalculationResult | null = null;

  get incomeRows(): BreakdownRow[] {
    if (!this.result) return [];
    const rows: BreakdownRow[] = [
      { label: 'Basic Salary', value: this.result.inputs.basicSalary },
    ];
    if ((this.result.inputs.fixedAllowances ?? 0) > 0)
      rows.push({ label: 'Fixed Allowances', value: this.result.inputs.fixedAllowances ?? 0, indent: true });
    if ((this.result.inputs.transportAllowance ?? 0) > 0)
      rows.push({ label: 'Transport Allowance', value: this.result.inputs.transportAllowance ?? 0, indent: true });
    if ((this.result.inputs.dataAllowance ?? 0) > 0)
      rows.push({ label: 'Data Allowance', value: this.result.inputs.dataAllowance ?? 0, indent: true });
    if ((this.result.inputs.otherAllowances ?? 0) > 0)
      rows.push({ label: 'Other Allowances', value: this.result.inputs.otherAllowances ?? 0, indent: true });
    if (this.result.peggingAllowance > 0)
      rows.push({ label: 'Pegging Allowance', value: this.result.peggingAllowance, indent: true, highlight: 'positive' });
    rows.push({ label: 'Gross Salary', value: this.result.grossSalary, bold: true });
    return rows;
  }

  get deductionRows(): BreakdownRow[] {
    if (!this.result) return [];
    return [
      { label: 'Employee EPF (8%)', value: this.result.employeeEpf, highlight: 'negative' },
      { label: 'APIT Tax', value: this.result.apitTax, highlight: 'negative' },
      { label: 'Taxable Income', value: this.result.taxableIncome, indent: true },
    ];
  }

  get summaryRows(): BreakdownRow[] {
    if (!this.result) return [];
    return [
      { label: 'Take-Home Salary', value: this.result.takeHomeSalary, bold: true, highlight: 'positive' },
    ];
  }

  get employerRows(): BreakdownRow[] {
    if (!this.result) return [];
    return [
      { label: 'Gross Salary', value: this.result.grossSalary },
      { label: 'Employer EPF (12%)', value: this.result.employerEpf, highlight: 'negative' },
      { label: 'Employer ETF (3%)', value: this.result.employerEtf, highlight: 'negative' },
      { label: 'Total Employer Cost', value: this.result.employerCost, bold: true },
    ];
  }
}

import {
  Component,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnInit,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { SalaryFormValue } from '../models/salary-form.models';

@Component({
  selector: 'lt-salary-input-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatIconModule,
    MatDividerModule,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">

      <!-- Basic Salary -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Basic Salary</label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">LKR</span>
          <input
            formControlName="basicSalary"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <p *ngIf="form.get('basicSalary')?.invalid && form.get('basicSalary')?.touched" class="mt-1 text-xs text-red-600">
          Basic salary is required and must be ≥ 0
        </p>
      </div>

      <!-- Allowances accordion -->
      <details class="border border-gray-200 rounded-lg overflow-hidden">
        <summary class="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer select-none hover:bg-gray-100 transition-colors">
          <div>
            <span class="font-medium text-gray-800 text-sm">Allowances</span>
            <span class="ml-2 text-xs text-gray-500">Fixed, transport, data &amp; other</span>
          </div>
          <mat-icon class="text-gray-400 text-base">expand_more</mat-icon>
        </summary>
        <div class="p-4 flex flex-col gap-3 bg-white">
          <ng-container *ngFor="let field of allowanceFields">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">{{ field.label }}</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">LKR</span>
                <input
                  [formControlName]="field.key"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  class="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
              </div>
            </div>
          </ng-container>
        </div>
      </details>

      <!-- Pegging Allowance -->
      <details class="border border-gray-200 rounded-lg overflow-hidden">
        <summary class="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer select-none hover:bg-gray-100 transition-colors">
          <div>
            <span class="font-medium text-gray-800 text-sm">Pegging Allowance</span>
            <span class="ml-2 text-xs text-gray-500">USD-pegged salary component</span>
          </div>
          <mat-icon class="text-gray-400 text-base">expand_more</mat-icon>
        </summary>
        <div class="p-4 flex flex-col gap-3 bg-white">
          <label class="flex items-center gap-3 cursor-pointer">
            <div
              class="relative w-11 h-6 rounded-full transition-colors"
              [class.bg-orange-500]="form.get('peggingEnabled')?.value"
              [class.bg-gray-300]="!form.get('peggingEnabled')?.value"
              (click)="togglePegging()"
            >
              <div
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                [class.translate-x-5]="form.get('peggingEnabled')?.value"
              ></div>
            </div>
            <span class="text-sm font-medium text-gray-700">
              {{ form.get('peggingEnabled')?.value ? 'Pegging enabled' : 'Enable pegging' }}
            </span>
          </label>

          <ng-container *ngIf="form.get('peggingEnabled')?.value">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Pegged USD Value</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">USD</span>
                <input formControlName="peggingUsdValue" type="number" min="0" step="0.01" placeholder="0.00"
                  class="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Base Rate (LKR / USD)</label>
              <input formControlName="peggingBaseRate" type="number" min="0" step="0.01" placeholder="e.g. 299"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <p class="mt-0.5 text-xs text-gray-400">Rate at time of peg agreement</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Current Rate (LKR / USD)</label>
              <input formControlName="peggingCurrentRate" type="number" min="0" step="0.01" placeholder="e.g. 320"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </ng-container>
        </div>
      </details>

      <!-- Exchange Rate -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Exchange Rate <span class="text-gray-400 font-normal">(LKR / USD)</span></label>
        <input
          formControlName="exchangeRate"
          type="number"
          min="0"
          step="0.01"
          placeholder="Leave blank to use latest from database"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
        <p class="mt-1 text-xs text-gray-400">Used only for USD equivalent display</p>
      </div>

      <!-- Submit -->
      <button
        type="submit"
        [disabled]="form.invalid"
        class="w-full py-3 px-6 bg-orange-700 hover:bg-orange-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition-colors shadow-sm"
      >
        Calculate Tax
      </button>

    </form>
  `,
})
export class SalaryInputFormComponent implements OnInit {
  @Output() formSubmit = new EventEmitter<SalaryFormValue>();

  private readonly fb = inject(FormBuilder);
  form!: FormGroup;

  readonly allowanceFields = [
    { key: 'fixedAllowances',    label: 'Fixed Allowances' },
    { key: 'transportAllowance', label: 'Transport Allowance' },
    { key: 'dataAllowance',      label: 'Data Allowance' },
    { key: 'otherAllowances',    label: 'Other Allowances' },
  ];

  ngOnInit(): void {
    this.form = this.fb.group({
      basicSalary:       [null, [Validators.required, Validators.min(0)]],
      fixedAllowances:   [null],
      transportAllowance:[null],
      dataAllowance:     [null],
      otherAllowances:   [null],
      peggingEnabled:    [false],
      peggingBaseRate:   [null],
      peggingCurrentRate:[null],
      peggingUsdValue:   [null],
      exchangeRate:      [null],
    });
  }

  togglePegging(): void {
    const ctrl = this.form.get('peggingEnabled');
    ctrl?.setValue(!ctrl.value);
  }

  onSubmit(): void {
    if (this.form.valid) {
      const v = this.form.value;
      this.formSubmit.emit({
        basicSalary:        v.basicSalary ?? 0,
        fixedAllowances:    v.fixedAllowances ?? 0,
        transportAllowance: v.transportAllowance ?? 0,
        dataAllowance:      v.dataAllowance ?? 0,
        otherAllowances:    v.otherAllowances ?? 0,
        peggingEnabled:     v.peggingEnabled ?? false,
        peggingBaseRate:    v.peggingBaseRate,
        peggingCurrentRate: v.peggingCurrentRate,
        peggingUsdValue:    v.peggingUsdValue,
        exchangeRate:       v.exchangeRate,
      });
    }
  }
}

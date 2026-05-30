import {
  Component,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectorRef,
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
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, startWith } from 'rxjs/operators';
import { SalaryFormValue } from '../models/salary-form.models';
import { NumericInputDirective } from '../directives/numeric-input.directive';

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
    NumericInputDirective,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">

      <!-- Basic Salary -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Basic Salary</label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">LKR</span>
          <input
            ltNumeric
            formControlName="basicSalary"
            type="text"
            inputmode="decimal"
            placeholder="0"
            class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <p *ngIf="form.get('basicSalary')?.invalid && form.get('basicSalary')?.touched" class="mt-1 text-xs text-red-600">
          Basic salary is required and must be >= 0
        </p>
      </div>

      <!-- Pegging Allowance -->
      <details class="border border-gray-200 rounded-lg overflow-hidden">
        <summary class="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer select-none hover:bg-gray-100 transition-colors">
          <div class="flex items-center gap-2">
            <span class="font-medium text-gray-800 text-sm">Pegging Allowance</span>
            <span *ngIf="form.get('peggingEnabled')?.value"
              class="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">ON</span>
          </div>
          <mat-icon class="text-gray-400 text-base">expand_more</mat-icon>
        </summary>
        <div class="p-4 flex flex-col gap-3 bg-white">

          <!-- Toggle -->
          <label class="flex items-center gap-3 cursor-pointer" (click)="togglePegging()">
            <div
              class="relative w-11 h-6 rounded-full transition-colors"
              [class.bg-orange-500]="form.get('peggingEnabled')?.value"
              [class.bg-gray-300]="!form.get('peggingEnabled')?.value"
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

            <!-- Base Rate -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Base Rate <span class="text-gray-400">(LKR / USD at peg date)</span></label>
              <input formControlName="peggingBaseRate" type="number" min="0" step="0.01" placeholder="e.g. 299"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <p class="mt-0.5 text-xs text-gray-400">Rate agreed at time of peg contract</p>
            </div>

            <!-- Current Rate -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Current Rate <span class="text-gray-400">(LKR / USD today)</span></label>
              <input formControlName="peggingCurrentRate" type="number" min="0" step="0.01" placeholder="e.g. 320"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>

            <!-- Auto-computed USD Value (read-only) -->
            <div class="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2.5">
              <p class="text-xs font-medium text-orange-700 mb-1">Pegged USD Value <span class="font-normal text-orange-500">(auto-calculated)</span></p>
              <div class="flex items-baseline gap-2">
                <span class="text-lg font-bold text-orange-700">
                  USD {{ computedUsdValue !== null ? (computedUsdValue | number:'1.2-2') : '—' }}
                </span>
              </div>
              <p class="text-xs text-orange-400 mt-1">
                = Basic salary ({{ form.get('basicSalary')?.value | number:'1.0-0' }}) ÷ Base rate ({{ form.get('peggingBaseRate')?.value || '?' }})
              </p>
              <p *ngIf="computedPeggingAllowance !== null && computedPeggingAllowance > 0"
                class="mt-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1">
                &#x2192; Estimated pegging allowance: LKR {{ computedPeggingAllowance | number:'1.2-2' }}
              </p>
            </div>

          </ng-container>
        </div>
      </details>

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
                  ltNumeric
                  [formControlName]="field.key"
                  type="text"
                  inputmode="decimal"
                  placeholder="0"
                  class="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
              </div>
            </div>
          </ng-container>
        </div>
      </details>

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
export class SalaryInputFormComponent implements OnInit, OnDestroy {
  @Output() formSubmit = new EventEmitter<SalaryFormValue>();

  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  form!: FormGroup;
  computedUsdValue: number | null = null;
  computedPeggingAllowance: number | null = null;

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
    });

    // Auto-compute pegged USD value = basicSalary / baseRate
    combineLatest([
      this.form.get('basicSalary')!.valueChanges.pipe(startWith(null)),
      this.form.get('peggingBaseRate')!.valueChanges.pipe(startWith(null)),
      this.form.get('peggingCurrentRate')!.valueChanges.pipe(startWith(null)),
    ])
    .pipe(takeUntil(this.destroy$))
    .subscribe(([salary, baseRate, currentRate]) => {
      const s = Number(salary) || 0;
      const b = Number(baseRate) || 0;
      const c = Number(currentRate) || 0;

      if (s > 0 && b > 0) {
        const usd = Math.round((s / b) * 100) / 100;
        this.computedUsdValue = usd;
        this.form.get('peggingUsdValue')?.setValue(usd, { emitEvent: false });

        // Estimate allowance preview: (currentRate - baseRate) * usdValue
        if (c > 0 && c > b) {
          this.computedPeggingAllowance = Math.round((c - b) * usd * 100) / 100;
        } else {
          this.computedPeggingAllowance = null;
        }
      } else {
        this.computedUsdValue = null;
        this.computedPeggingAllowance = null;
        this.form.get('peggingUsdValue')?.setValue(null, { emitEvent: false });
      }
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
      });
    }
  }
}
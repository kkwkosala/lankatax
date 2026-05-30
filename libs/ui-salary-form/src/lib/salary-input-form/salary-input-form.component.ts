import {
  Component,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SalaryFormValue } from '../models/salary-form.models';

function nonNegativeValidator(control: AbstractControl) {
  const v = control.value;
  return v !== null && v < 0 ? { nonNegative: true } : null;
}

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
    MatTooltipModule,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">

      <!-- Basic Salary -->
      <mat-form-field appearance="outline">
        <mat-label>Basic Salary (LKR)</mat-label>
        <span matTextPrefix>LKR&nbsp;</span>
        <input matInput type="number" formControlName="basicSalary" min="0" placeholder="0.00" />
        <mat-error *ngIf="form.get('basicSalary')?.hasError('required')">Required</mat-error>
        <mat-error *ngIf="form.get('basicSalary')?.hasError('min')">Must be ≥ 0</mat-error>
      </mat-form-field>

      <!-- Allowances -->
      <mat-expansion-panel>
        <mat-expansion-panel-header>
          <mat-panel-title class="font-medium">Allowances</mat-panel-title>
          <mat-panel-description>Fixed, transport, data &amp; other</mat-panel-description>
        </mat-expansion-panel-header>

        <div class="space-y-3 pt-2">
          <mat-form-field appearance="outline">
            <mat-label>Fixed Allowances (LKR)</mat-label>
            <span matTextPrefix>LKR&nbsp;</span>
            <input matInput type="number" formControlName="fixedAllowances" min="0" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Transport Allowance (LKR)</mat-label>
            <span matTextPrefix>LKR&nbsp;</span>
            <input matInput type="number" formControlName="transportAllowance" min="0" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Data Allowance (LKR)</mat-label>
            <span matTextPrefix>LKR&nbsp;</span>
            <input matInput type="number" formControlName="dataAllowance" min="0" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Other Allowances (LKR)</mat-label>
            <span matTextPrefix>LKR&nbsp;</span>
            <input matInput type="number" formControlName="otherAllowances" min="0" />
          </mat-form-field>
        </div>
      </mat-expansion-panel>

      <!-- Tax Relief -->
      <mat-form-field appearance="outline">
        <mat-label>Annual Tax Relief (LKR)</mat-label>
        <span matTextPrefix>LKR&nbsp;</span>
        <input matInput type="number" formControlName="taxReliefAnnual" min="0" />
        <mat-hint>Deducted annually — defaults to LKR 1,200,000 if applicable</mat-hint>
      </mat-form-field>

      <!-- Pegging -->
      <mat-expansion-panel>
        <mat-expansion-panel-header>
          <mat-panel-title class="font-medium">Pegging Allowance</mat-panel-title>
          <mat-panel-description>USD-pegged salary component</mat-panel-description>
        </mat-expansion-panel-header>

        <div class="space-y-3 pt-2">
          <mat-slide-toggle formControlName="peggingEnabled" color="primary">
            Enable Pegging
          </mat-slide-toggle>

          <ng-container *ngIf="form.get('peggingEnabled')?.value">
            <mat-form-field appearance="outline">
              <mat-label>Pegged USD Value</mat-label>
              <span matTextPrefix>USD&nbsp;</span>
              <input matInput type="number" formControlName="peggingUsdValue" min="0" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Base Rate (LKR/USD)</mat-label>
              <input matInput type="number" formControlName="peggingBaseRate" min="0" />
              <mat-hint>Rate at time of peg agreement</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Current Rate (LKR/USD)</mat-label>
              <input matInput type="number" formControlName="peggingCurrentRate" min="0" />
            </mat-form-field>
          </ng-container>
        </div>
      </mat-expansion-panel>

      <!-- Exchange Rate for USD display -->
      <mat-form-field appearance="outline">
        <mat-label>Exchange Rate (LKR/USD) — for USD display</mat-label>
        <input matInput type="number" formControlName="exchangeRate" min="0" />
        <mat-hint>Leave blank to use latest rate from database</mat-hint>
      </mat-form-field>

      <!-- Submit -->
      <div class="pt-2">
        <button
          mat-flat-button
          color="primary"
          type="submit"
          [disabled]="form.invalid"
          class="w-full py-2 text-base font-semibold"
        >
          Calculate Tax
        </button>
      </div>
    </form>
  `,
})
export class SalaryInputFormComponent implements OnInit {
  @Output() formSubmit = new EventEmitter<SalaryFormValue>();

  form!: FormGroup;

  constructor(private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      basicSalary:       [0, [Validators.required, Validators.min(0)]],
      fixedAllowances:   [0, [Validators.min(0)]],
      transportAllowance:[0, [Validators.min(0)]],
      dataAllowance:     [0, [Validators.min(0)]],
      otherAllowances:   [0, [Validators.min(0)]],
      taxReliefAnnual:   [0, [Validators.min(0)]],
      peggingEnabled:    [false],
      peggingBaseRate:   [null],
      peggingCurrentRate:[null],
      peggingUsdValue:   [null],
      exchangeRate:      [null],
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.formSubmit.emit(this.form.value as SalaryFormValue);
    }
  }
}

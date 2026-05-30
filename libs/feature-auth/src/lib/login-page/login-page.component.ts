import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthActions, selectAuthLoading, selectAuthError } from '@lankatax/data-access-auth';
import { ErrorAlertComponent } from '@lankatax/ui-shared';

@Component({
  selector: 'lt-login-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    ErrorAlertComponent,
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4">
      <mat-card class="w-full max-w-md shadow-lg">
        <mat-card-header>
          <mat-card-title class="text-2xl font-bold">Welcome to LankaTax</mat-card-title>
          <mat-card-subtitle>Sign in to save and track your calculations</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content class="mt-4">
          <lt-error-alert [message]="(error$ | async)"></lt-error-alert>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4 mt-3">
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email" />
              <mat-error *ngIf="form.get('email')?.hasError('required')">Required</mat-error>
              <mat-error *ngIf="form.get('email')?.hasError('email')">Invalid email</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" autocomplete="current-password" />
              <mat-error *ngIf="form.get('password')?.hasError('required')">Required</mat-error>
            </mat-form-field>

            <button
              mat-flat-button
              color="primary"
              type="submit"
              [disabled]="form.invalid || (loading$ | async)"
              class="w-full"
            >
              <mat-spinner *ngIf="loading$ | async" diameter="20" class="inline-block mr-2"></mat-spinner>
              Sign In
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions class="px-4 pb-4">
          <p class="text-sm text-gray-600 text-center">
            No account? <a routerLink="/auth/register" class="text-primary-600 font-medium">Create one</a>
          </p>
          <p class="text-sm text-gray-500 text-center mt-2">
            <a routerLink="/calculator" class="underline">Continue without signing in</a>
          </p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
})
export class LoginPageComponent implements OnInit {
  form!: FormGroup;
  loading$ = this.store.select(selectAuthLoading);
  error$ = this.store.select(selectAuthError);

  constructor(private readonly fb: FormBuilder, private readonly store: Store) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const { email, password } = this.form.value;
      this.store.dispatch(AuthActions.login({ email, password }));
    }
  }
}

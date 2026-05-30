import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
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
    MatProgressSpinnerModule,
    ErrorAlertComponent,
  ],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div class="w-full max-w-md">

        <!-- Logo / Brand -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-12 h-12 bg-orange-700 rounded-xl mb-3">
            <span class="text-white text-xl font-bold">₨</span>
          </div>
          <h1 class="text-2xl font-bold text-gray-900">Welcome to LankaTax</h1>
          <p class="text-sm text-gray-500 mt-1">Sign in to save and track your calculations</p>
        </div>

        <!-- Card -->
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm px-8 py-8">

          <lt-error-alert [message]="(error$ | async)"></lt-error-alert>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">

            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                formControlName="email"
                type="email"
                autocomplete="email"
                placeholder="you@example.com"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
              />
              <p *ngIf="form.get('email')?.invalid && form.get('email')?.touched"
                class="mt-1 text-xs text-red-500">
                {{ form.get('email')?.hasError('required') ? 'Email is required' : 'Enter a valid email' }}
              </p>
            </div>

            <!-- Password -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                formControlName="password"
                type="password"
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
              />
              <p *ngIf="form.get('password')?.invalid && form.get('password')?.touched"
                class="mt-1 text-xs text-red-500">Password is required</p>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              [disabled]="form.invalid || (loading$ | async)"
              class="w-full py-3 bg-orange-700 hover:bg-orange-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              <mat-spinner *ngIf="loading$ | async" diameter="16"></mat-spinner>
              Sign In
            </button>

          </form>

          <!-- Divider -->
          <div class="relative my-5">
            <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-100"></div></div>
            <div class="relative flex justify-center"><span class="px-3 bg-white text-xs text-gray-400">or</span></div>
          </div>

          <!-- Continue without signing in -->
          <a routerLink="/calculator"
            class="w-full block text-center py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors font-medium">
            Continue without signing in
          </a>

        </div>

        <!-- Register link -->
        <p class="text-center text-sm text-gray-500 mt-5">
          No account?
          <a routerLink="/auth/register" class="text-orange-700 font-semibold hover:underline">Create one</a>
        </p>

      </div>
    </div>
  `,
})
export class LoginPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);

  form!: FormGroup;
  loading$ = this.store.select(selectAuthLoading);
  error$ = this.store.select(selectAuthError);

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

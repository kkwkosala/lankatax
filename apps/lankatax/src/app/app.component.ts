import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { AuthActions, selectIsAuthenticated, selectCurrentUser } from '@lankatax/data-access-auth';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <!-- Nav -->
    <header class="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div class="max-w-screen-xl mx-auto px-4 md:px-8 h-14 flex items-center gap-6">

        <!-- Brand -->
        <a routerLink="/calculator" class="flex items-center gap-2 no-underline shrink-0">
          <div class="w-7 h-7 bg-orange-700 rounded-lg flex items-center justify-center">
            <span class="text-white text-xs font-bold">&#x20A8;</span>
          </div>
          <span class="font-bold text-gray-900 text-base tracking-tight">LankaTax</span>
        </a>

        <!-- Nav links -->
        <nav class="flex items-center gap-1">
          <a routerLink="/calculator" routerLinkActive="text-orange-700 bg-orange-50"
            [routerLinkActiveOptions]="{ exact: false }"
            class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-orange-700 hover:bg-orange-50 transition-colors no-underline">
            Calculator
          </a>
          <ng-container *ngIf="isAuthenticated$ | async">
            <a routerLink="/reports/history" routerLinkActive="text-orange-700 bg-orange-50"
              class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-orange-700 hover:bg-orange-50 transition-colors no-underline">
              History
            </a>
            <a routerLink="/budget" routerLinkActive="text-orange-700 bg-orange-50"
              class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-orange-700 hover:bg-orange-50 transition-colors no-underline">
              Budget
            </a>
          </ng-container>
        </nav>

        <span class="flex-1"></span>

        <!-- Right side -->
        <div class="flex items-center gap-3">

          <!-- Authenticated -->
          <ng-container *ngIf="isAuthenticated$ | async">
            <span class="text-xs text-gray-400 hidden sm:block truncate max-w-[160px]">
              {{ (currentUser$ | async)?.email }}
            </span>
            <button (click)="logout()"
              class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors border border-gray-200">
              Sign out
            </button>
          </ng-container>

          <!-- Unauthenticated -->
          <ng-container *ngIf="!(isAuthenticated$ | async)">
            <a routerLink="/auth/login"
              class="px-4 py-1.5 rounded-lg text-sm font-semibold text-white bg-orange-700 hover:bg-orange-800 transition-colors no-underline">
              Sign in
            </a>
          </ng-container>

        </div>
      </div>
    </header>

    <main class="min-h-[calc(100vh-56px)] p-4 md:p-8">
      <router-outlet />
    </main>

    <footer class="text-center text-xs text-gray-400 py-4 border-t border-gray-100">
      LankaTax — For estimation only. Consult the Inland Revenue Department of Sri Lanka for official guidance.
    </footer>
  `,
})
export class AppComponent {
  private readonly store = inject(Store);

  readonly isAuthenticated$ = this.store.select(selectIsAuthenticated);
  readonly currentUser$     = this.store.select(selectCurrentUser);

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}

import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { AuthActions, selectIsAuthenticated, selectCurrentUser } from '@lankatax/data-access-auth';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <mat-toolbar color="primary" class="shadow-md">
      <a routerLink="/calculator" class="font-bold text-xl tracking-tight no-underline text-white">&#x1F1F1;&#x1F1F0; LankaTax</a>
      <span class="flex-1"></span>

      <a mat-button routerLink="/calculator" routerLinkActive="font-bold">Calculator</a>

      <!-- Authenticated nav -->
      <ng-container *ngIf="isAuthenticated$ | async">
        <a mat-button routerLink="/reports/history" routerLinkActive="font-bold">
          <mat-icon class="text-base mr-1">history</mat-icon>History
        </a>
        <span class="text-xs text-orange-200 mx-2 hidden sm:inline">
          {{ (currentUser$ | async)?.email }}
        </span>
        <button mat-button (click)="logout()" class="text-sm">
          <mat-icon class="text-base mr-1">logout</mat-icon>Sign out
        </button>
      </ng-container>

      <!-- Unauthenticated nav -->
      <ng-container *ngIf="!(isAuthenticated$ | async)">
        <a mat-button routerLink="/auth/login">Login</a>
      </ng-container>
    </mat-toolbar>

    <main class="min-h-[calc(100vh-64px)] p-4 md:p-8">
      <router-outlet />
    </main>

    <footer class="text-center text-xs text-gray-400 py-4 border-t">
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

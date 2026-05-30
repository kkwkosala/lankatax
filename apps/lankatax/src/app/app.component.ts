import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

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
      <span class="font-bold text-xl tracking-tight">🇱🇰 LankaTax</span>
      <span class="flex-1"></span>
      <a mat-button routerLink="/calculator" routerLinkActive="font-bold">Calculator</a>
      <a mat-button routerLink="/auth/login">Login</a>
    </mat-toolbar>

    <main class="min-h-[calc(100vh-64px)] p-4 md:p-8">
      <router-outlet />
    </main>

    <footer class="text-center text-xs text-gray-400 py-4 border-t">
      LankaTax — For estimation only. Consult the Inland Revenue Department of Sri Lanka for official guidance.
    </footer>
  `,
})
export class AppComponent {}

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'lt-budget-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, MatIconModule],
  template: `
    <div class="max-w-screen-lg mx-auto">

      <!-- Page header -->
      <div class="mb-5">
        <h1 class="text-2xl font-bold text-gray-900">Budget</h1>
        <p class="text-gray-500 mt-1 text-sm">Plan your spending or track your path to financial independence.</p>
      </div>

      <!-- Tab bar -->
      <div class="flex gap-1 mb-6 border-b border-gray-200">
        <a routerLink="planner" routerLinkActive="tab-active"
          class="tab-btn flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg border border-transparent -mb-px transition-colors">
          <mat-icon class="text-base">pie_chart</mat-icon>
          Budget Planner
        </a>
        <a routerLink="fire" routerLinkActive="tab-active"
          class="tab-btn flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg border border-transparent -mb-px transition-colors">
          <mat-icon class="text-base">local_fire_department</mat-icon>
          FIRE Tracker
        </a>
      </div>

      <!-- Routed tab content -->
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .tab-btn {
      color: #6b7280;
    }
    .tab-btn:hover {
      color: #c2410c;
      background-color: #fff7ed;
    }
    .tab-active {
      color: #c2410c !important;
      background-color: #ffffff;
      border-color: #e5e7eb #e5e7eb #ffffff !important;
    }
  `],
})
export class BudgetShellComponent {}

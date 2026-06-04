import { Routes } from '@angular/router';

export const BUDGET_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./lib/budget-shell/budget-shell.component').then((m) => m.BudgetShellComponent),
    children: [
      { path: '', redirectTo: 'planner', pathMatch: 'full' },
      {
        path: 'planner',
        loadComponent: () =>
          import('./lib/budget-page/budget-page.component').then((m) => m.BudgetPageComponent),
      },
      {
        path: 'fire',
        loadComponent: () =>
          import('./lib/fire-page/fire-page.component').then((m) => m.FirePageComponent),
      },
    ],
  },
];

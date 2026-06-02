import { Routes } from '@angular/router';

export const BUDGET_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./lib/budget-page/budget-page.component').then((m) => m.BudgetPageComponent),
  },
];

import { Routes } from '@angular/router';
import { authGuard } from '@lankatax/feature-auth';
import { adminGuard } from '@lankatax/feature-auth';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'calculator',
    pathMatch: 'full',
  },
  {
    path: 'calculator',
    loadChildren: () =>
      import('@lankatax/feature-calculator').then((m) => m.CALCULATOR_ROUTES),
  },
  {
    path: 'reports',
    canActivate: [authGuard],
    loadChildren: () =>
      import('@lankatax/feature-reports').then((m) => m.REPORTS_ROUTES),
  },
  {
    path: 'budget',
    canActivate: [authGuard],
    loadChildren: () =>
      import('@lankatax/feature-budget').then((m) => m.BUDGET_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadChildren: () =>
      import('@lankatax/feature-admin').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('@lankatax/feature-auth').then((m) => m.AUTH_ROUTES),
  },
  { path: '**', redirectTo: 'calculator' },
];

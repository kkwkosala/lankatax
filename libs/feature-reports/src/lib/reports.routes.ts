import { Routes } from '@angular/router';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'history',
    pathMatch: 'full',
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./history-page/history-page.component').then((m) => m.HistoryPageComponent),
  },
];

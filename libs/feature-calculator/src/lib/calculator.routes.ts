import { Routes } from '@angular/router';

export const CALCULATOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./calculator-page/calculator-page.component').then(
        (m) => m.CalculatorPageComponent
      ),
  },
];

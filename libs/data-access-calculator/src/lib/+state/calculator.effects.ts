import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { switchMap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { CalculatorActions } from './calculator.actions';
import { TaxCalculatorApiService } from '../services/tax-calculator-api.service';

@Injectable()
export class CalculatorEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(TaxCalculatorApiService);

  calculate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CalculatorActions.calculate),
      switchMap(({ request }) =>
        this.api.calculate(request).pipe(
          map((result) => CalculatorActions.calculateSuccess({ result })),
          catchError((err) =>
            of(CalculatorActions.calculateFailure({
              error: err?.error?.error ?? err.message ?? 'Calculation failed',
            }))
          )
        )
      )
    )
  );
}

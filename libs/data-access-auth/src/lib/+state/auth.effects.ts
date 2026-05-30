import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { switchMap, map, catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthActions } from './auth.actions';
import { SupabaseAuthService } from '../services/supabase-auth.service';

@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly authService = inject(SupabaseAuthService);
  private readonly router = inject(Router);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ email, password }) =>
        this.authService.signIn(email, password).pipe(
          map(({ user, session, error }) => {
            if (error || !user || !session) {
              return AuthActions.loginFailure({ error: error?.message ?? 'Login failed' });
            }
            return AuthActions.loginSuccess({ user, session });
          }),
          catchError((err) => of(AuthActions.loginFailure({ error: err.message })))
        )
      )
    )
  );

  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(() => this.router.navigate(['/calculator']))
      ),
    { dispatch: false }
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      switchMap(({ email, password }) =>
        this.authService.signUp(email, password).pipe(
          map(({ user, error }) => {
            if (error) return AuthActions.registerFailure({ error: error.message });
            return AuthActions.registerSuccess({ user });
          }),
          catchError((err) => of(AuthActions.registerFailure({ error: err.message })))
        )
      )
    )
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      switchMap(() =>
        this.authService.signOut().pipe(
          map(() => AuthActions.logoutSuccess()),
          catchError(() => of(AuthActions.logoutSuccess()))
        )
      )
    )
  );

  logoutSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutSuccess),
        tap(() => this.router.navigate(['/auth/login']))
      ),
    { dispatch: false }
  );

  restoreSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.restoreSession),
      switchMap(() =>
        this.authService.getSession().pipe(
          map(({ session }) => {
            if (session?.user) {
              return AuthActions.restoreSessionSuccess({ user: session.user, session });
            }
            return AuthActions.restoreSessionNone();
          }),
          catchError(() => of(AuthActions.restoreSessionNone()))
        )
      )
    )
  );
}

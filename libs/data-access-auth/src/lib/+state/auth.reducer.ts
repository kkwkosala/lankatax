import { createReducer, on } from '@ngrx/store';
import { User, Session } from '@supabase/supabase-js';
import { AuthActions } from './auth.actions';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  sessionRestored: boolean;
}

export const initialAuthState: AuthState = {
  user: null,
  session: null,
  loading: false,
  error: null,
  sessionRestored: false,
};

export const authReducer = createReducer(
  initialAuthState,

  on(AuthActions.login, AuthActions.register, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(AuthActions.loginSuccess, (state, { user, session }) => ({
    ...state,
    user,
    session,
    loading: false,
    error: null,
    sessionRestored: true,
  })),

  on(AuthActions.registerSuccess, (state, { user }) => ({
    ...state,
    user,
    loading: false,
    error: null,
    sessionRestored: true,
  })),

  on(AuthActions.loginFailure, AuthActions.registerFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(AuthActions.logoutSuccess, () => ({
    ...initialAuthState,
    sessionRestored: true,
  })),

  on(AuthActions.restoreSessionSuccess, (state, { user, session }) => ({
    ...state,
    user,
    session,
    sessionRestored: true,
  })),

  on(AuthActions.restoreSessionNone, (state) => ({
    ...state,
    sessionRestored: true,
  }))
);

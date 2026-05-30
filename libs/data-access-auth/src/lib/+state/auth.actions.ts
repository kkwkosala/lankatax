import { createAction, props } from '@ngrx/store';
import { User, Session } from '@supabase/supabase-js';

export const AuthActions = {
  login: createAction('[Auth] Login', props<{ email: string; password: string }>()),
  loginSuccess: createAction('[Auth] Login Success', props<{ user: User; session: Session }>()),
  loginFailure: createAction('[Auth] Login Failure', props<{ error: string }>()),

  register: createAction('[Auth] Register', props<{ email: string; password: string }>()),
  registerSuccess: createAction('[Auth] Register Success', props<{ user: User | null }>()),
  registerFailure: createAction('[Auth] Register Failure', props<{ error: string }>()),

  logout: createAction('[Auth] Logout'),
  logoutSuccess: createAction('[Auth] Logout Success'),

  restoreSession: createAction('[Auth] Restore Session'),
  restoreSessionSuccess: createAction('[Auth] Restore Session Success', props<{ user: User; session: Session }>()),
  restoreSessionNone: createAction('[Auth] Restore Session None'),
};

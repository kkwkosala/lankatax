import { createSelector, createFeatureSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectCurrentUser = createSelector(selectAuthState, (s) => s.user);
export const selectCurrentSession = createSelector(selectAuthState, (s) => s.session);
export const selectAuthLoading = createSelector(selectAuthState, (s) => s.loading);
export const selectAuthError = createSelector(selectAuthState, (s) => s.error);
export const selectSessionRestored = createSelector(selectAuthState, (s) => s.sessionRestored);
export const selectIsAuthenticated = createSelector(selectCurrentUser, (u) => !!u);
export const selectIsAdmin = createSelector(
  selectCurrentUser,
  (u) => (u?.app_metadata?.['role'] ?? u?.app_metadata?.['user_role']) === 'admin'
);

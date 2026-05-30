import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient, User, Session, AuthError } from '@supabase/supabase-js';
import { environment } from '../../../../../apps/lankatax/src/environments/environment';
import { Observable, from } from 'rxjs';

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

@Injectable({ providedIn: 'root' })
export class SupabaseAuthService {
  private readonly supabase: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  get client(): SupabaseClient {
    return this.supabase;
  }

  signIn(email: string, password: string): Observable<AuthResult> {
    return from(
      this.supabase.auth.signInWithPassword({ email, password }).then(({ data, error }) => ({
        user: data.user,
        session: data.session,
        error,
      }))
    );
  }

  signUp(email: string, password: string): Observable<AuthResult> {
    return from(
      this.supabase.auth.signUp({ email, password }).then(({ data, error }) => ({
        user: data.user,
        session: data.session,
        error,
      }))
    );
  }

  signOut(): Observable<{ error: AuthError | null }> {
    return from(this.supabase.auth.signOut());
  }

  getSession(): Observable<{ session: Session | null; error: AuthError | null }> {
    return from(this.supabase.auth.getSession().then(({ data, error }) => ({
      session: data.session,
      error,
    })));
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  isAdmin(user: User | null): boolean {
    if (!user) return false;
    return (user.app_metadata?.['role'] ?? user.app_metadata?.['user_role']) === 'admin';
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectCurrentSession } from '@lankatax/data-access-auth';
import { take, switchMap } from 'rxjs/operators';
import { environment } from '../../../../../apps/lankatax/src/environments/environment';
import { TaxCalculationRequest } from '../models/tax-calculation-request.model';
import { TaxCalculationResult } from '../models/tax-calculation-result.model';

@Injectable({ providedIn: 'root' })
export class TaxCalculatorApiService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(Store);

  private get baseUrl(): string {
    return `${environment.supabaseUrl}/functions/v1`;
  }

  calculate(request: TaxCalculationRequest): Observable<TaxCalculationResult> {
    return this.store.select(selectCurrentSession).pipe(
      take(1),
      switchMap((session) => {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          apikey: environment.supabaseAnonKey,
        };
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        return this.http.post<TaxCalculationResult>(
          `${this.baseUrl}/calculate-tax`,
          request,
          { headers }
        );
      })
    );
  }

  getTaxRules(year?: string): Observable<unknown> {
    const params = year ? `?year=${year}` : '';
    return this.http.get(`${this.baseUrl}/get-tax-rules${params}`, {
      headers: { apikey: environment.supabaseAnonKey },
    });
  }

  getExchangeRate(): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/get-exchange-rate`, {
      headers: { apikey: environment.supabaseAnonKey },
    });
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectCurrentSession } from '@lankatax/data-access-auth';
import { take, switchMap } from 'rxjs/operators';
import { environment } from '../../../../../apps/lankatax/src/environments/environment';
import { TaxCalculationRequest } from '../models/tax-calculation-request.model';
import { TaxCalculationResult } from '../models/tax-calculation-result.model';
import { CalculationHistoryItem } from '../models/calculation-history-item.model';

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

  saveCalculation(
    result: TaxCalculationResult,
    personName: string,
    calculationMonth: string,
    comment: string,
  ): Observable<{ id: string; calculatedAt: string }> {
    return this.store.select(selectCurrentSession).pipe(
      take(1),
      switchMap((session) => {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          apikey: environment.supabaseAnonKey,
          Authorization: `Bearer ${session!.access_token}`,
        };
        const body = {
          basicSalary:        result.inputs.basicSalary,
          fixedAllowances:    result.inputs.fixedAllowances    ?? 0,
          transportAllowance: result.inputs.transportAllowance ?? 0,
          dataAllowance:      result.inputs.dataAllowance      ?? 0,
          otherAllowances:    result.inputs.otherAllowances    ?? 0,
          taxReliefAnnual:    result.inputs.taxReliefAnnual    ?? 0,
          peggingEnabled:     result.inputs.pegging?.enabled   ?? false,
          peggingBaseRate:    result.inputs.pegging?.baseRate  ?? null,
          peggingCurrentRate: result.inputs.pegging?.currentRate ?? null,
          peggingUsdValue:    result.inputs.pegging?.peggedUsdValue ?? null,
          exchangeRateUsed:   result.exchangeRateUsed          ?? null,
          peggingAllowance:   result.peggingAllowance,
          grossSalary:        result.grossSalary,
          employeeEpf:        result.employeeEpf,
          taxableIncome:      result.taxableIncome,
          apitTax:            result.apitTax,
          takeHomeSalary:     result.takeHomeSalary,
          employerEpf:        result.employerEpf,
          employerEtf:        result.employerEtf,
          employerCost:       result.employerCost,
          usdEquivalent:      result.usdEquivalent             ?? null,
          taxYearLabel:       result.taxYearLabel,
          taxSlabsSnapshot:   result.taxSlabsUsed,
          epfEmployeeRate:    result.epfEmployeeRate,
          epfEmployerRate:    result.epfEmployerRate,
          etfEmployerRate:    result.etfEmployerRate,
          personName:         personName || null,
          calculationMonth:   calculationMonth || null,
          comment:            comment || null,
        };
        return this.http.post<{ id: string; calculatedAt: string }>(
          `${this.baseUrl}/save-calculation`,
          body,
          { headers }
        );
      })
    );
  }

  getCalculationHistory(): Observable<CalculationHistoryItem[]> {
    return this.store.select(selectCurrentSession).pipe(
      take(1),
      switchMap((session) => {
        const fields = [
          'id', 'calculated_at', 'tax_year_label',
          'basic_salary', 'gross_salary', 'take_home_salary',
          'apit_tax', 'employee_epf', 'employer_cost',
          'pegging_enabled', 'pegging_allowance',
          'person_name', 'calculation_month', 'comment',
        ].join(',');
        return this.http.get<CalculationHistoryItem[]>(
          `${environment.supabaseUrl}/rest/v1/salary_calculations?select=${fields}&order=calculated_at.desc&limit=50`,
          {
            headers: {
              apikey: environment.supabaseAnonKey,
              Authorization: `Bearer ${session!.access_token}`,
            },
          }
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

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectCurrentSession } from '@lankatax/data-access-auth';
import { take, switchMap } from 'rxjs/operators';
import { environment } from '../../../../apps/lankatax/src/environments/environment';
import { BudgetRecord, OtherIncomeSource } from './budget.models';

export interface SaveBudgetRequest {
  budgetMonth:     string;              // "YYYY-MM"
  incomeAmount:    number;
  otherIncome:     OtherIncomeSource[];
  spendAmount:     number;
  startingCorpus:  number;
  calculationId?:  string | null;
}

@Injectable({ providedIn: 'root' })
export class BudgetApiService {
  private readonly http  = inject(HttpClient);
  private readonly store = inject(Store);

  private get baseUrl(): string {
    return `${environment.supabaseUrl}/functions/v1`;
  }

  getHistory(): Observable<BudgetRecord[]> {
    return this.store.select(selectCurrentSession).pipe(
      take(1),
      switchMap((session) =>
        this.http.get<BudgetRecord[]>(`${this.baseUrl}/save-budget`, {
          headers: {
            apikey:        environment.supabaseAnonKey,
            Authorization: `Bearer ${session!.access_token}`,
          },
        })
      ),
    );
  }

  saveMonth(req: SaveBudgetRequest): Observable<{ id: string; budgetMonth: string; updatedAt: string }> {
    return this.store.select(selectCurrentSession).pipe(
      take(1),
      switchMap((session) =>
        this.http.post<{ id: string; budgetMonth: string; updatedAt: string }>(
          `${this.baseUrl}/save-budget`,
          req,
          {
            headers: {
              'Content-Type': 'application/json',
              apikey:         environment.supabaseAnonKey,
              Authorization:  `Bearer ${session!.access_token}`,
            },
          },
        )
      ),
    );
  }
}

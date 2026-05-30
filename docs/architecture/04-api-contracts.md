# 04 — API Contracts

All backend APIs are Supabase Edge Functions (Deno/TypeScript).

## Shared Types (`supabase/functions/_shared/types.ts`)

```typescript
// ─── Common ────────────────────────────────────────────────────────────
export interface ApiError {
  error: string;
  code: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Tax Domain ─────────────────────────────────────────────────────────
export interface PeggingConfig {
  enabled: boolean;
  baseRate?: number;        // LKR per USD (contract rate)
  currentRate?: number;     // LKR per USD (today's rate)
  peggedUsdValue?: number;  // USD amount pegged
}

export interface TaxCalculationRequest {
  basicSalary: number;
  fixedAllowances?: number;
  transportAllowance?: number;
  dataAllowance?: number;
  otherAllowances?: number;
  taxReliefAnnual?: number;
  pegging?: PeggingConfig;
  exchangeRate?: number;    // Override system rate
  taxYear?: string;         // e.g. '2024/2025' — defaults to current
}

export interface TaxSlabSnapshot {
  lowerBound: number;
  upperBound: number | null;
  rate: number;
  fixedAmount: number;
  slabOrder: number;
}

export interface TaxCalculationResult {
  // Inputs (echoed back)
  inputs: TaxCalculationRequest;
  // Pegging
  peggingAllowance: number;
  // Salary components
  grossSalary: number;
  // Deductions
  employeeEpf: number;
  taxableIncome: number;
  apitTax: number;
  // Take-home
  takeHomeSalary: number;
  // Employer
  employerEpf: number;
  employerEtf: number;
  employerCost: number;
  // Conversion
  usdEquivalent: number | null;
  exchangeRateUsed: number | null;
  // Metadata
  taxYearLabel: string;
  taxSlabsUsed: TaxSlabSnapshot[];
  epfEmployeeRate: number;   // e.g. 0.08
  epfEmployerRate: number;   // e.g. 0.12
  etfEmployerRate: number;   // e.g. 0.03
  calculatedAt: string;      // ISO timestamp
  calculationId?: string;    // UUID if saved (authenticated user)
  disclaimer: string;
}

// ─── Salary Profiles ──────────────────────────────────────────────────
export interface SalaryProfile {
  id: string;
  name: string;
  basicSalary: number;
  fixedAllowances: number;
  transportAllowance: number;
  dataAllowance: number;
  otherAllowances: number;
  taxReliefAnnual: number;
  peggingEnabled: boolean;
  peggingBaseRate: number | null;
  peggingUsdValue: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateSalaryProfileRequest = Omit<SalaryProfile, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateSalaryProfileRequest = Partial<CreateSalaryProfileRequest>;

// ─── Exchange Rates ───────────────────────────────────────────────────
export interface ExchangeRate {
  id: string;
  currencyFrom: string;
  currencyTo: string;
  rate: number;
  rateDate: string;
  source: 'manual' | 'api';
  isStale: boolean;  // true if rateDate > 3 days ago
  createdAt: string;
}

// ─── Tax Rules ────────────────────────────────────────────────────────
export interface TaxRule {
  id: string;
  ruleType: string;
  rateValue: number;
  effectiveDate: string;
}

export interface TaxSlab {
  id: string;
  taxYearId: string;
  effectiveDate: string;
  lowerBound: number;
  upperBound: number | null;
  rate: number;
  fixedAmount: number;
  slabOrder: number;
}

export interface TaxRulesResponse {
  taxYear: { id: string; label: string; startDate: string; endDate: string };
  rules: TaxRule[];
  slabs: TaxSlab[];
}

// ─── Budget ───────────────────────────────────────────────────────────
export interface BudgetProfile {
  id: string;
  calculationId: string | null;
  name: string;
  budgetMonth: string;
  incomeAmount: number;
  items: BudgetItem[];
  createdAt: string;
}

export interface BudgetItem {
  id: string;
  categoryName: string;
  categoryType: 'fixed' | 'variable';
  plannedAmount: number;
  actualAmount: number | null;
  sortOrder: number;
}

// ─── Audit ────────────────────────────────────────────────────────────
export interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string | null;
  action: string;
  actorId: string | null;
  actorRole: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  createdAt: string;
}
```

---

## Edge Function Contracts

### 1. `calculate-tax`

```
POST /functions/v1/calculate-tax
Authorization: Bearer <jwt>  (optional — anonymous calculations not saved)
Content-Type: application/json

Request: TaxCalculationRequest

Response 200: TaxCalculationResult
Response 400: ApiError  { error: "Validation error", code: "VALIDATION_ERROR" }
Response 401: ApiError  { error: "Unauthorized", code: "UNAUTHORIZED" }
Response 422: ApiError  { error: "No active tax slabs found", code: "NO_TAX_SLABS" }
Response 500: ApiError  { error: "Internal error", code: "INTERNAL_ERROR" }
```

### 2. `get-tax-rules`

```
GET /functions/v1/get-tax-rules?taxYear=2024/2025
Authorization: Bearer <jwt>  (optional — public read)

Response 200: TaxRulesResponse
Response 404: ApiError  { error: "Tax year not found", code: "TAX_YEAR_NOT_FOUND" }
```

### 3. `salary-profiles`

```
GET    /functions/v1/salary-profiles
       Authorization: Required
       Response 200: SalaryProfile[]

POST   /functions/v1/salary-profiles
       Authorization: Required
       Request: CreateSalaryProfileRequest
       Response 201: SalaryProfile
       Response 400: ApiError  (validation)
       Response 409: ApiError  { code: "PROFILE_LIMIT_EXCEEDED" }  (max 10)

PUT    /functions/v1/salary-profiles/:id
       Authorization: Required
       Request: UpdateSalaryProfileRequest
       Response 200: SalaryProfile
       Response 403: ApiError  { code: "FORBIDDEN" }  (not owner)
       Response 404: ApiError  { code: "NOT_FOUND" }

DELETE /functions/v1/salary-profiles/:id
       Authorization: Required
       Response 204: (no body)
       Response 403: ApiError  { code: "FORBIDDEN" }
```

### 4. `get-exchange-rate`

```
GET /functions/v1/get-exchange-rate
    Optional query: ?date=2026-05-30

Response 200: ExchangeRate | { rate: null, message: "No rate configured" }
```

### 5. `save-calculation`

```
POST /functions/v1/save-calculation
     Authorization: Required
     Request: TaxCalculationResult (full result from calculate-tax)
     Response 201: { id: string, calculatedAt: string }
     Response 400: ApiError
```

### 6. `generate-report`

```
POST /functions/v1/generate-report
     Authorization: Required
     Content-Type: application/json

     Request: {
       calculationId: string;
       format: 'pdf' | 'excel';
       includeProfile?: boolean;
     }

Response 200: {
  downloadUrl: string;   // Pre-signed Supabase Storage URL (valid 10 min)
  expiresAt: string;     // ISO timestamp
  filename: string;
}
Response 400: ApiError
Response 404: ApiError  { code: "CALCULATION_NOT_FOUND" }
```

### 7. `get-budget`

```
GET    /functions/v1/get-budget
       Authorization: Required
       Optional: ?month=2026-05
       Response 200: BudgetProfile[]

POST   /functions/v1/get-budget
       Authorization: Required
       Request: { name, budgetMonth, calculationId?, items: BudgetItem[] }
       Response 201: BudgetProfile

PUT    /functions/v1/get-budget/:id
       Authorization: Required
       Request: Partial<BudgetProfile>
       Response 200: BudgetProfile

DELETE /functions/v1/get-budget/:id
       Authorization: Required
       Response 204
```

### 8. `admin-tax-rules` (Admin only)

```
GET  /functions/v1/admin-tax-rules
     Authorization: Required (role=admin)
     Response 200: { taxYears: TaxYear[], rules: TaxRule[], slabs: TaxSlab[] }

POST /functions/v1/admin-tax-rules
     Authorization: Required (role=admin)
     Request: {
       action: 'create_tax_year' | 'add_slabs' | 'update_rule'
       payload: TaxYear | TaxSlab[] | TaxRule
     }
     Response 201: Created entity
     Response 400: ApiError (validation — gap/overlap detection for slabs)
     Response 403: ApiError { code: "ADMIN_REQUIRED" }

GET  /functions/v1/admin-tax-rules/preview
     Authorization: Required (role=admin)
     Request: { salary: number, effectiveDate: string }
     Response 200: { current: TaxCalculationResult, proposed: TaxCalculationResult, diff: object }
```

### 9. `admin-exchange-rate` (Admin only)

```
POST /functions/v1/admin-exchange-rate
     Authorization: Required (role=admin)
     Request: { rate: number, rateDate: string, source: 'manual' }
     Response 201: ExchangeRate

GET  /functions/v1/admin-exchange-rate/history
     Authorization: Required (role=admin)
     Response 200: ExchangeRate[]  (last 30 records)
```

### 10. `audit-logs` (Admin only)

```
GET /functions/v1/audit-logs
    Authorization: Required (role=admin)
    Query params: ?entityType=&action=&from=&to=&page=&pageSize=
    Response 200: PaginatedResponse<AuditLogEntry>

GET /functions/v1/audit-logs/export
    Authorization: Required (role=admin)
    Query params: (same filters)
    Response 200: text/csv
```

---

## CORS Configuration (`supabase/functions/_shared/cors.ts`)

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGINS') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};
```

---

## Standard Edge Function Template (`supabase/functions/_shared/auth.ts`)

```typescript
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from './cors.ts';
import type { ApiError } from './types.ts';

export function errorResponse(message: string, code: string, status: number): Response {
  const body: ApiError = { error: message, code };
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}

export async function getAuthenticatedUser(
  req: Request,
  required = true
): Promise<{ user: { id: string; role: string } | null; supabase: SupabaseClient; error: Response | null }> {
  const authHeader = req.headers.get('Authorization');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader ?? '' } } }
  );

  if (!authHeader) {
    if (required) return { user: null, supabase, error: errorResponse('Unauthorized', 'UNAUTHORIZED', 401) };
    return { user: null, supabase, error: null };
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    if (required) return { user: null, supabase, error: errorResponse('Unauthorized', 'UNAUTHORIZED', 401) };
    return { user: null, supabase, error: null };
  }

  const role = user.app_metadata?.role ?? 'user';
  return { user: { id: user.id, role }, supabase, error: null };
}
```

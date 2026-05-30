# 06 — Audit & Logging Strategy

## Audit Trail Design

LankaTax maintains a complete, tamper-proof audit trail using an **append-only PostgreSQL table** with RLS that prohibits UPDATE and DELETE operations.

---

## What Gets Audited

| Event Category | entity_type | action | Trigger |
|---|---|---|---|
| Tax slab created | `tax_slab` | `CREATE` | Admin saves new slab set |
| Tax rule updated | `tax_rule` | `UPDATE` | Admin changes EPF/ETF rate |
| Tax year created | `tax_year` | `CREATE` | Admin adds new tax year |
| Calculation performed | `salary_calculation` | `CALCULATION` | User submits calculation |
| Exchange rate updated | `exchange_rate` | `CREATE` | Admin saves new rate |
| Admin login | `auth` | `ADMIN_LOGIN` | Admin user signs in |
| Failed login (any) | `auth` | `LOGIN_FAILED` | Failed Supabase auth |
| Account deleted | `user` | `ACCOUNT_DELETED` | User deletes account |
| Report generated | `report` | `REPORT_GENERATED` | PDF/Excel downloaded |
| Profile created/updated | `salary_profile` | `CREATE` / `UPDATE` | User saves profile |
| Budget created | `budget` | `CREATE` | User saves budget |
| Feature flag changed | `app_config` | `UPDATE` | Admin toggles flag |

---

## Audit Log Schema (reference)

```sql
audit_logs (
  id          UUID        -- Primary key
  entity_type TEXT        -- Category above
  entity_id   UUID        -- Affected record ID (NULL for auth events)
  action      TEXT        -- Action above
  actor_id    UUID        -- User ID (NULL = system; anonymised on account deletion)
  actor_role  TEXT        -- 'user' | 'admin' | 'system'
  old_values  JSONB       -- Before state snapshot
  new_values  JSONB       -- After state snapshot
  ip_address  INET        -- From request headers (admin actions only)
  user_agent  TEXT        -- Browser/client
  created_at  TIMESTAMPTZ -- Immutable timestamp
)
```

---

## Audit Entry Examples

### Tax Slab Change
```json
{
  "entity_type": "tax_slab",
  "entity_id": "uuid-of-slab-set",
  "action": "CREATE",
  "actor_id": "admin-user-uuid",
  "actor_role": "admin",
  "old_values": null,
  "new_values": {
    "effectiveDate": "2026-04-01",
    "slabs": [
      { "lowerBound": 0, "upperBound": 100000, "rate": 0, "slabOrder": 1 },
      { "lowerBound": 100001, "upperBound": 141667, "rate": 0.06, "slabOrder": 2 }
    ]
  }
}
```

### Calculation Performed
```json
{
  "entity_type": "salary_calculation",
  "entity_id": "calculation-uuid",
  "action": "CALCULATION",
  "actor_id": "user-uuid",
  "actor_role": "user",
  "old_values": null,
  "new_values": {
    "taxYear": "2024/2025",
    "grossSalary": 200000,
    "apitTax": 3570,
    "takeHome": 180430
    // Note: exact amounts stored in salary_calculations table — audit stores summary
  }
}
```

---

## Logging Strategy

### Structured Log Format (Edge Functions)

All Edge Function logs use structured JSON:

```typescript
// ✅ Correct — no PII, no salary data
console.log(JSON.stringify({
  level: 'info',
  event: 'tax_calculation_completed',
  functionName: 'calculate-tax',
  userId: user?.id ?? 'anonymous',    // UUID only — no email
  durationMs: Date.now() - startTime,
  taxYear: '2024/2025',
  success: true,
}));

// ✅ Correct — error without PII
console.error(JSON.stringify({
  level: 'error',
  event: 'edge_function_error',
  functionName: 'calculate-tax',
  errorCode: 'NO_TAX_SLABS',
  userId: user?.id ?? 'anonymous',
}));

// ❌ NEVER DO THIS
console.log(`User ${user.email} calculated tax: LKR ${grossSalary}`);
```

### Log Levels

| Level | When to use |
|---|---|
| `info` | Normal operations: calculation completed, profile saved |
| `warn` | Non-critical issues: stale exchange rate used, rate limit approaching |
| `error` | Failures: DB error, auth failure, Edge Function timeout |
| `debug` | Development only — never in production |

### Angular Logging

```typescript
// Production: errors dispatched to NgRx error state and sent to audit log
// Development: errors also go to console
// NEVER: console.log(salaryData) or console.log(userProfile)
```

---

## Tax Slab Snapshot Strategy

Every `salary_calculations` record stores a **JSON snapshot** of the exact tax slabs used:

```typescript
// In calculate-tax Edge Function:
const taxSlabsSnapshot = slabs.map(s => ({
  lowerBound: s.lower_bound,
  upperBound: s.upper_bound,
  rate: s.rate,
  fixedAmount: s.fixed_amount,
  slabOrder: s.slab_order,
}));

// Stored in salary_calculations.tax_slabs_snapshot (JSONB)
// This means: even if admin updates slabs next month, old calculations
// are still explainable with exact slab data
```

This is critical for tax dispute resolution — users can always see exactly what rules were applied to any historical calculation.

---

## Retention Policy

| Data | Retention | Reason |
|---|---|---|
| `salary_calculations` | 2 years active, then archived | Tax declaration reference |
| `audit_logs` | Permanent (never deleted) | Compliance requirement |
| `exchange_rates` | Permanent | Historical reference |
| `tax_slabs` | Permanent (versioned) | Immutable history |
| `budget_profiles` | 2 years or user deletion | User data |
| Supabase Auth logs | Per Supabase default (90 days) | Auth compliance |

---

## Compliance Exports

Admin can export:
- `GET /functions/v1/audit-logs/export` → CSV of filtered audit entries
- Format: `id, entity_type, action, actor_id, actor_role, created_at, summary`
- No `old_values`/`new_values` JSON in CSV (too large) — available in UI detail view

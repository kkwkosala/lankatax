# Observability

## Logging Strategy

### Edge Functions
- Use structured JSON logging
- Log level: `info` for normal operations, `error` for failures
- **NEVER log**: salary amounts, tax values, user PII, passwords, tokens

```typescript
// Approved logging pattern
console.log(JSON.stringify({
  level: 'info',
  event: 'tax_calculation_completed',
  userId: user.id,  // OK — anonymised ID
  durationMs: elapsed,
  taxYear: taxYear,
  // NOT: salary, apitTax, taxableIncome
}));
```

### Angular
- Errors dispatched to NgRx error state — displayed in UI
- Critical errors sent to Supabase `audit_logs` table via Edge Function
- No console.log in production builds

## Audit Logging

All sensitive operations write to `audit_logs`:

```sql
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
VALUES (auth.uid(), 'TAX_CALCULATION', 'salary_calculation', $1, $2);
```

Audited actions:
- `TAX_CALCULATION` — every calculation performed
- `TAX_RULE_UPDATE` — admin changes to tax slabs/rates
- `PROFILE_UPDATE` — salary profile changes
- `REPORT_GENERATED` — PDF/Excel downloads
- `ADMIN_LOGIN` — admin panel access

## Health Checks

Edge Function health endpoint:
```
GET /functions/v1/health
Response: { "status": "ok", "version": "vX.Y.Z", "timestamp": "..." }
```

## Monitoring (Production)

- Supabase Dashboard — DB performance, slow queries, RLS policy hits
- Vercel Analytics — Frontend performance, Core Web Vitals
- GitHub Actions — CI/CD pipeline health

## Alerting Triggers

| Alert | Threshold | Action |
|---|---|---|
| Tax calculation error rate | > 1% in 5 min | Page on-call |
| DB connection failures | Any | Page on-call |
| Auth failures spike | > 10x baseline | Security review |
| Edge Function timeout | > 30s | Investigate + alert |

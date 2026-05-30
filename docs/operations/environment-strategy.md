# Environment Strategy

## Environments

| Environment | Purpose | Supabase | Angular |
|---|---|---|---|
| Local | Developer machines | `supabase start` (local Docker) | `ng serve` |
| Staging | Pre-prod validation | `lankatax-staging` project | Vercel preview |
| Production | Live users | `lankatax-prod` project | Vercel production |

## Environment Variables

Never commit secrets. Each environment has:

```bash
# .env.local (gitignored — local dev only)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=local-anon-key
NEXT_PUBLIC_APP_ENV=local

# Set in Supabase project secrets (Edge Functions):
EXCHANGE_RATE_API_KEY=...
```

## Database Migration Safety Rules

1. **Always additive** — add columns/tables; never drop without DBA sign-off
2. **Idempotent** — migrations must be safe to re-run (use `IF NOT EXISTS`)
3. **Test locally first** — `supabase db push` on local before staging
4. **Staging gate** — migration must run successfully on staging before production
5. **Rollback script** — every migration has a companion rollback in `supabase/migrations/rollbacks/`

### Migration Filename Convention
```
supabase/migrations/YYYYMMDDHHMMSS_short_description.sql
```
Example: `20250401120000_add_apit_slabs_2025.sql`

## Tax Data Seeding

Default tax slabs for each tax year are seeded from:
```
supabase/seed/tax_slabs_YYYY_YY.sql
```

When a new gazette is published:
1. Create a new migration (not a seed) — seeds only run on fresh DB
2. Use `effective_date` column so new slabs activate on the correct date
3. Keep historical slabs intact — never delete old slab records

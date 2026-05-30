# LankaTax — AI SDLC Operating Manual

## Overview

AI SDLC platform for the LankaTax team. Governs every feature from raw requirement to production.

**Product:** Sri Lankan Salary Tax Calculator & Budgeting Platform
**Stack:** Angular 20 · Angular Material · NgRx · Tailwind CSS · Supabase · PostgreSQL · Edge Functions
**AI Tools:** GitHub Copilot (IDE completion) · Claude (SDLC workflow commands + agents)

---

## SDLC Pipeline

Every feature **must** follow this order — no exceptions:

```
/requirement → /brainstorm → Approve → /create-pbis → /design → Approve
  → Create branch → /implement → /generate-tests → /impact-analysis
    → /create-pr → AI Review (CI) → Human Review → QA → Merge → /release
```

---

## Golden Rules

1. `/requirement` runs before `/brainstorm` — no exceptions
2. Every approved feature becomes a GitHub Issue — nothing coded ad hoc
3. Architecture design (`/design`) is approved before any implementation
4. DB migration PBI ships first — backend depends on schema, frontend on API
5. All tests pass locally before a PR is opened
6. CI must be green before requesting human review
7. Run `/impact-analysis` before every PR
8. Minimum 1 human approval — squash merge to `main`; `main` is always deployable
9. Tax slab changes must be applied via DB migration only — never hardcoded
10. All salary data requires RLS policies — no unprotected table access

---

## Architecture

### Frontend (Angular 20)

```
apps/
  lankatax/               # Main Angular app shell + routing
libs/
  feature-calculator/     # Smart: Tax calculator page container
  feature-reports/        # Smart: Salary breakdown reports
  feature-budget/         # Smart: Budget planner
  feature-admin/          # Smart: Tax rule administration
  feature-auth/           # Smart: Login / profile
  ui-salary-form/         # Dumb: Salary input form components
  ui-charts/              # Dumb: Chart components
  ui-tax-breakdown/       # Dumb: Tax breakdown display
  ui-shared/              # Dumb: Shared UI components
  data-access-calculator/ # NgRx: calculator store + API service
  data-access-reports/    # NgRx: reports store + API service
  data-access-budget/     # NgRx: budget store + API service
  data-access-admin/      # NgRx: admin store + API service
  data-access-auth/       # NgRx: auth store + Supabase auth service
```

**NX Boundary Rules:**
- `apps/` → imports from `libs/feature-*`, `libs/ui-*`, `libs/data-access-*`
- `libs/feature-*` → imports from `libs/ui-*` and `libs/data-access-*`
- `libs/ui-*` → must NOT import from `libs/feature-*` or `libs/data-access-*`
- `libs/data-access-*` → must NOT import from `libs/feature-*` or `libs/ui-*`

### Backend (Supabase Edge Functions)

```
supabase/
  functions/
    calculate-tax/        # POST: Main tax calculation engine
    get-tax-rules/        # GET: Fetch active tax slabs + rules
    get-exchange-rate/    # GET: Current USD/LKR rate
    save-calculation/     # POST: Persist calculation to history
    generate-report/      # POST: Generate PDF/Excel report
    get-budget/           # GET/POST: Budget CRUD
    admin-tax-rules/      # PUT: Admin — update tax slabs
  migrations/             # Versioned SQL migration files
  seed/                   # Seed data (default tax slabs, rates)
```

### Database (PostgreSQL via Supabase)

Core tables: `users` · `salary_profiles` · `salary_calculations` · `tax_rules` · `tax_slabs` · `exchange_rates` · `budget_profiles` · `budget_items` · `audit_logs`

All tables must have:
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `created_at TIMESTAMPTZ DEFAULT NOW()`
- `updated_at TIMESTAMPTZ DEFAULT NOW()`
- Row Level Security (RLS) enabled
- Appropriate RLS policies

---

## Branching

- Feature: `feature/[issue-number]-[description]` from `main`
- Bugfix: `bugfix/[issue-number]-[description]`
- Hotfix: `hotfix/[description]` — branch from release TAG, merge back to BOTH `main` + release branch
- Squash and merge only — delete branch after merge

---

## Tax Domain Rules

### APIT/PAYE Tax Slabs (Sri Lanka — configurable via DB)

Tax slabs are stored in `tax_slabs` table. Never hardcode rates.

### EPF/ETF Rates

```
Employee EPF = 8%  (stored in tax_rules table as 'epf_employee_rate')
Employer EPF = 12% (stored in tax_rules table as 'epf_employer_rate')
Employer ETF = 3%  (stored in tax_rules table as 'etf_employer_rate')
```

### Pegging Allowance Formula

```
IF pegging_enabled:
  pegging_allowance = (current_rate - base_rate) × pegged_usd_value
  pegging_allowance is added to taxable_income
```

### Calculation Sequence

```
1. gross_salary = basic + fixed_allowances + transport + data + other + pegging_allowance
2. employee_epf = gross_salary × epf_employee_rate
3. taxable_income = gross_salary - employee_epf - tax_relief
4. apit_tax = calculate_from_slabs(taxable_income, active_tax_slabs)
5. take_home = gross_salary - employee_epf - apit_tax
6. employer_epf = gross_salary × epf_employer_rate
7. employer_etf = gross_salary × etf_employer_rate
8. employer_cost = gross_salary + employer_epf + employer_etf
9. usd_equivalent = gross_salary / current_exchange_rate
```

---

## Commands (`.claude/commands/`)

| Command | Purpose |
|---|---|
| `/requirement` | Capture and structure a requirement |
| `/brainstorm` | Explore implementation approaches |
| `/design` | Technical spec: API contract · DB schema · NgRx state |
| `/create-pbis` | Create GitHub Issues `[DB]` · `[BE]` · `[FE]` |
| `/implement #N` | Scaffold Angular feature or Edge Function for issue #N |
| `/generate-tests` | Generate Angular + Edge Function test templates |
| `/impact-analysis` | Blast-radius analysis before PR |
| `/create-pr #N` | Draft PR for issue #N |
| `/review` | AI code review |
| `/release vX.Y.Z` | Sprint-end release |

---

## Agents (`.claude/agents/`)

| Agent | Role |
|---|---|
| `requirement-agent` | Structure requirements into AC + NFR |
| `feature-brainstorm-agent` | Evaluate implementation options |
| `architect-agent` | Design Edge Functions, DB schema, Angular structure |
| `pbi-agent` | Create and label GitHub Issues |
| `developer-agent` | Implement Angular features + Edge Functions |
| `qa-agent` | Generate and validate test coverage |
| `reviewer-agent` | Code + architecture + security review |
| `release-agent` | Release notes, tagging, deployment |
| `impact-agent` | Blast-radius analysis |

---

## Files Claude Must Not Modify

`dist/` · `.angular/` · `supabase/migrations/` (append-only) · `package.json` · `nx.json` · `.env.production` · `supabase/.env`

---

## Security Rules

1. NEVER commit secrets — use `.env.local` (gitignored)
2. All Supabase Edge Functions validate JWT before processing
3. All DB tables must have RLS enabled with explicit policies
4. User salary data is isolated by `auth.uid()` in RLS policies
5. Admin endpoints require `role = 'admin'` claim check
6. No salary data in logs or error messages

---

## Reference Docs

| Topic | File |
|---|---|
| Code patterns (Angular · NgRx · Edge Functions) | `.claude/commands/implement.md` |
| Test patterns (Angular · Deno · Integration) | `.claude/commands/generate-tests.md` |
| API contracts · DB schema design | `.claude/commands/design.md` |
| Environment strategy · DB migration safety | `docs/operations/environment-strategy.md` |
| Feature flags | `docs/operations/feature-flags.md` |
| Observability + alerting | `docs/operations/observability.md` |
| Developer onboarding | `docs/onboarding/README.md` |
| Full pipeline walkthrough | `docs/AI-SDLC-Developer-Guide.md` |

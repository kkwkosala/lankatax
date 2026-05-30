# LankaTax — Session Handoff Context

## Repo
https://github.com/kkwkosala/lankatax
Local: C:\Users\KoshalaWickramasingh\Desktop\Claude\lankatax

## Stack
- Angular 20 (NX monorepo), Tailwind, NgRx
- Supabase (PostgreSQL + Edge Functions + Auth)
- Push directly to main branch

## Key commands
- Serve: npx nx serve lankatax --configuration=development
- Build: npx nx build lankatax
- Deploy edge fn: npx supabase functions deploy <name> --no-verify-jwt
- DB push: npx supabase db push --linked

## Supabase project
- URL: https://qurowbucqneycfjptpsk.supabase.co
- Real keys are in: apps/lankatax/src/environments/environment.local.ts (gitignored)

## Completed work

### Sprint 1 — Tax Engine ✅
- Edge Functions: calculate-tax, get-tax-rules, get-exchange-rate, save-calculation, salary-profiles, admin-tax-rules
- PostgreSQL schema + migrations (all applied to live Supabase DB)
- APIT 2025/2026 tax slabs (IRD Table 1 official values)
- EPF/ETF applies on basic salary only (not allowances or pegging)

### Sprint 2 — Angular UI ✅
- NX monorepo scaffold (Angular 20, Tailwind, NgRx)
- feature-calculator: 3-column layout (salary form | tax breakdown | APIT brackets)
- feature-auth: Login + Register pages (redesigned — white card, orange accent)
- data-access-calculator (NgRx: actions, effects, reducer, selectors)
- data-access-auth (NgRx + Supabase Auth)
- ui-salary-form: comma-formatted number inputs (NumericInputDirective)
- ui-tax-breakdown: breakdown card + APIT brackets card

### UI Refinements ✅ (done as bug fixes / improvements)
- APIT brackets panel showing active band with formula
- Pegging allowance: auto-computes USD value = basicSalary / baseRate (read-only)
- USD equivalent replaced with "Basic USD Salary" (only shown when pegging enabled)
- Exchange Rate input field removed from form
- Allowances accordion moved below Pegging Allowance accordion
- Login/Register pages redesigned (no Angular Material card)
- Tax Relief column removed from UI
- Comma-formatted LKR inputs

## What's next (original roadmap — AI Advisor REMOVED)

| Sprint | Feature               | Status      |
|--------|-----------------------|-------------|
| 3      | Pegging Module        | Partially done (integrated in calculator) |
| 4      | Reporting             | Empty stub  |
| 5      | Budget Planner        | Empty stub  |
| 6      | Audit & Compliance    | Empty stub  |

Note: Sprint 2 "save calculation" + history view is NOT yet wired in the Angular UI —
the save-calculation Edge Function exists but no "Save" button or history page exists yet.

## Important files
- supabase/functions/calculate-tax/engine.ts — core tax engine
- supabase/functions/save-calculation/index.ts — save to salary_calculations table
- libs/feature-calculator/src/lib/calculator-page/calculator-page.component.ts
- libs/ui-salary-form/src/lib/salary-input-form/salary-input-form.component.ts
- libs/ui-tax-breakdown/src/lib/tax-breakdown-card/ (2 components)
- libs/data-access-calculator/src/lib/services/tax-calculator-api.service.ts

## Removed features
- AI Advisor / AI Financial Insights (Epic 8) — removed due to external API cost
  Commits: 5de7e94, d7509ef

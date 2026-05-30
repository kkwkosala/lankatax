# 01 — Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         LANKATAX SYSTEM ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────┐                           │
│  │           FRONTEND LAYER                 │                           │
│  │      Angular 20 · NgRx · Tailwind        │                           │
│  │  ┌──────────────────────────────────┐   │                           │
│  │  │   apps/lankatax/  (Shell + Routes)│   │  Hosted on Vercel/Netlify │
│  │  └──────────────────────────────────┘   │  Auto-deploy on main push  │
│  │  ┌────────────┐  ┌────────────────────┐ │                           │
│  │  │ feature-*  │  │   data-access-*    │ │                           │
│  │  │ (Smart)    │  │   (NgRx + API)     │ │                           │
│  │  └────────────┘  └────────────────────┘ │                           │
│  │  ┌────────────────────────────────────┐ │                           │
│  │  │         ui-* (Dumb components)     │ │                           │
│  │  └────────────────────────────────────┘ │                           │
│  └──────────────────┬───────────────────────┘                           │
│                     │ HTTPS (JWT Bearer)                                 │
│  ┌──────────────────▼───────────────────────┐                           │
│  │           SUPABASE PLATFORM              │                           │
│  │  ┌─────────────────────────────────────┐ │                           │
│  │  │     Supabase Auth                   │ │  Email + Google OAuth     │
│  │  │  (JWT issuance + session mgmt)      │ │                           │
│  │  └─────────────────────────────────────┘ │                           │
│  │  ┌─────────────────────────────────────┐ │                           │
│  │  │     Edge Functions (Deno)           │ │                           │
│  │  │  calculate-tax   │ get-tax-rules    │ │  Deployed globally        │
│  │  │  salary-profiles │ save-calculation │ │  ~0ms latency to DB       │
│  │  │  generate-report │ get-exchange-rate│ │                           │
│  │  │  admin-tax-rules │ audit-logs       │ │                           │
│  │  │  get-budget      │ admin-exch-rate  │ │                           │
│  │  └──────────┬──────────────────────────┘ │                           │
│  │             │ SQL (service role / anon)   │                           │
│  │  ┌──────────▼──────────────────────────┐ │                           │
│  │  │     PostgreSQL Database             │ │                           │
│  │  │  Row Level Security on all tables   │ │                           │
│  │  │  ┌──────────┐  ┌─────────────────┐ │ │                           │
│  │  │  │ tax_rules│  │  tax_slabs      │ │ │                           │
│  │  │  │ users    │  │  salary_calc    │ │ │                           │
│  │  │  │ profiles │  │  exchange_rates │ │ │                           │
│  │  │  │ budgets  │  │  audit_logs     │ │ │                           │
│  │  │  └──────────┘  └─────────────────┘ │ │                           │
│  │  └─────────────────────────────────────┘ │                           │
│  │  ┌─────────────────────────────────────┐ │                           │
│  │  │     Supabase Storage                │ │  Generated PDF/Excel      │
│  │  │  (generated-reports bucket)         │ │  Pre-signed URLs (10 min) │
│  │  └─────────────────────────────────────┘ │                           │
│  └──────────────────────────────────────────┘                           │
│                                                                          │
│  ┌──────────────────────────────────────────┐                           │
│  │           CI/CD PIPELINE                 │                           │
│  │  GitHub Actions: PR validation           │                           │
│  │  → code review → arch review → security  │                           │
│  │  → ng lint → ng build → ng test          │                           │
│  │  → Edge Function tests                   │                           │
│  └──────────────────────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Component Interaction Map

```
User Action (Angular UI)
    │
    ▼
NgRx Action dispatched
    │
    ▼
NgRx Effect → calls SupabaseApiService
    │
    ▼
supabase.functions.invoke('function-name', { body })
    │  [JWT automatically included from Supabase client session]
    ▼
Edge Function (Deno)
    ├─ 1. Validate JWT → supabase.auth.getUser()
    ├─ 2. Validate request body
    ├─ 3. Query DB (using anon client with user's JWT or service role)
    ├─ 4. Business logic (tax calculation, etc.)
    └─ 5. Return JSON response
    │
    ▼
NgRx Effect receives response
    │
    ├─ Success → dispatch *Success action → reducer updates state
    └─ Failure → dispatch *Failure action → reducer sets error state
    │
    ▼
Angular component re-renders via OnPush + async pipe
```

---

## Tax Calculation Data Flow

```
User enters salary inputs (Angular form)
    │
    ▼
[Calculator] Calculate Tax action dispatched with TaxCalculationRequest
    │
    ▼
CalculatorEffects → TaxCalculatorApiService.calculateTax(request)
    │
    ▼
POST /functions/v1/calculate-tax  {JWT}
    │
    ▼
Edge Function: calculate-tax/index.ts
    ├─ Auth: supabase.auth.getUser() → 401 if invalid
    ├─ Validate inputs (basicSalary ≥ 0, etc.)
    ├─ Load tax rules: SELECT * FROM tax_rules WHERE effective_date ≤ NOW()
    ├─ Load tax slabs: SELECT * FROM tax_slabs WHERE effective_date ≤ NOW()
    ├─ Load exchange rate: SELECT * FROM exchange_rates ORDER BY rate_date DESC LIMIT 1
    ├─ Compute pegging allowance (if enabled)
    ├─ Compute gross salary
    ├─ Compute employee EPF (from tax_rules)
    ├─ Compute taxable income
    ├─ Apply APIT slabs (from tax_slabs)
    ├─ Compute take-home, employer cost, USD equivalent
    ├─ If user authenticated: INSERT INTO salary_calculations (...)
    └─ Return TaxCalculationResult
    │
    ▼
[Calculator] Calculate Tax Success action
    │
    ▼
calculatorReducer: state.result = TaxCalculationResult
    │
    ▼
selectCalculatorResult → CalculatorPageComponent → TaxBreakdownCardComponent
```

---

## Environment Architecture

```
Local Development
├── Angular: ng serve (localhost:4200)
├── Supabase: supabase start (local Docker, localhost:54321)
├── Edge Functions: supabase functions serve
└── DB: local Postgres (supabase start)

Staging (Supabase project: lankatax-staging)
├── Angular: Vercel preview deployment
├── Edge Functions: Supabase staging project
└── DB: Supabase staging PostgreSQL

Production (Supabase project: lankatax-prod)
├── Angular: Vercel production (lankatax.vercel.app)
├── Edge Functions: Supabase production project
└── DB: Supabase production PostgreSQL
```

---

## Technology Versions

| Technology | Version | Notes |
|---|---|---|
| Angular | 20.x | Standalone components, signals |
| NgRx | 18.x | Store, Effects, Selectors, ComponentStore |
| Angular Material | 20.x | Form controls, tables, navigation |
| Tailwind CSS | 3.x | Utility classes |
| NX | 20.x | Monorepo, affected builds |
| TypeScript | 5.x | Strict mode enabled |
| Deno | 1.x | Edge Function runtime |
| Supabase JS | 2.x | Client and server SDK |
| PostgreSQL | 15.x | Via Supabase |
| Node.js | 20.x | Build tooling |

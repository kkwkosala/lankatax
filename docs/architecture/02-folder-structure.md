# 02 — Complete Folder Structure

## Repository Root

```
lankatax/
├── .claude/
│   ├── CLAUDE.md                          # AI SDLC operating manual
│   ├── agents/                            # 9 specialist agents
│   └── commands/                          # 10 slash commands
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug.yml
│   │   ├── feature.yml
│   │   └── tax-rule-change.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── dependabot.yml
│   └── workflows/
│       └── pr-validation.yml
├── apps/
│   └── lankatax/                          # Angular 20 shell application
│       ├── src/
│       │   ├── app/
│       │   │   ├── app.component.ts       # Root component
│       │   │   ├── app.component.html
│       │   │   ├── app.component.scss
│       │   │   ├── app.config.ts          # provideRouter, provideStore, etc.
│       │   │   └── app.routes.ts          # Top-level lazy routes
│       │   ├── assets/
│       │   │   ├── images/
│       │   │   └── i18n/
│       │   ├── environments/
│       │   │   ├── environment.ts         # Local dev
│       │   │   ├── environment.staging.ts
│       │   │   └── environment.production.ts
│       │   ├── index.html
│       │   ├── main.ts
│       │   └── styles.scss               # Global styles + Tailwind imports
│       ├── project.json
│       └── tsconfig.app.json
├── libs/
│   ├── feature-calculator/               # Smart: Tax calculator feature
│   │   └── src/
│   │       └── lib/
│   │           ├── calculator-page/
│   │           │   ├── calculator-page.component.ts
│   │           │   ├── calculator-page.component.html
│   │           │   └── calculator-page.component.spec.ts
│   │           ├── calculator.routes.ts
│   │           └── index.ts
│   │
│   ├── feature-reports/                  # Smart: Reports & history
│   │   └── src/lib/
│   │       ├── reports-page/
│   │       │   ├── reports-page.component.ts
│   │       │   └── reports-page.component.html
│   │       ├── comparison-page/
│   │       │   ├── comparison-page.component.ts
│   │       │   └── comparison-page.component.html
│   │       ├── reports.routes.ts
│   │       └── index.ts
│   │
│   ├── feature-budget/                   # Smart: Budget planner
│   │   └── src/lib/
│   │       ├── budget-page/
│   │       │   ├── budget-page.component.ts
│   │       │   └── budget-page.component.html
│   │       ├── budget.routes.ts
│   │       └── index.ts
│   │
│   ├── feature-admin/                    # Smart: Admin panel (role-guarded)
│   │   └── src/lib/
│   │       ├── tax-rules-page/
│   │       │   ├── tax-rules-page.component.ts
│   │       │   └── tax-rules-page.component.html
│   │       ├── audit-log-page/
│   │       │   ├── audit-log-page.component.ts
│   │       │   └── audit-log-page.component.html
│   │       ├── exchange-rate-page/
│   │       │   ├── exchange-rate-page.component.ts
│   │       │   └── exchange-rate-page.component.html
│   │       ├── admin.routes.ts
│   │       └── index.ts
│   │
│   ├── feature-auth/                     # Smart: Auth pages
│   │   └── src/lib/
│   │       ├── login-page/
│   │       │   ├── login-page.component.ts
│   │       │   └── login-page.component.html
│   │       ├── register-page/
│   │       │   ├── register-page.component.ts
│   │       │   └── register-page.component.html
│   │       ├── profile-page/
│   │       │   ├── profile-page.component.ts
│   │       │   └── profile-page.component.html
│   │       ├── guards/
│   │       │   ├── auth.guard.ts          # Redirects to /login if not authenticated
│   │       │   └── admin.guard.ts         # Redirects if role !== 'admin'
│   │       ├── auth.routes.ts
│   │       └── index.ts
│   │
│   ├── ui-salary-form/                   # Dumb: Salary input form components
│   │   └── src/lib/
│   │       ├── salary-input-form/
│   │       │   ├── salary-input-form.component.ts
│   │       │   ├── salary-input-form.component.html
│   │       │   └── salary-input-form.component.spec.ts
│   │       ├── pegging-config-form/
│   │       │   ├── pegging-config-form.component.ts
│   │       │   └── pegging-config-form.component.spec.ts
│   │       ├── models/
│   │       │   └── salary-form.models.ts  # SalaryFormValue interface
│   │       └── index.ts
│   │
│   ├── ui-charts/                        # Dumb: Chart components
│   │   └── src/lib/
│   │       ├── salary-donut-chart/
│   │       │   ├── salary-donut-chart.component.ts
│   │       │   └── salary-donut-chart.component.spec.ts
│   │       ├── employer-cost-bar-chart/
│   │       │   ├── employer-cost-bar-chart.component.ts
│   │       │   └── employer-cost-bar-chart.component.spec.ts
│   │       ├── budget-pie-chart/
│   │       │   ├── budget-pie-chart.component.ts
│   │       │   └── budget-pie-chart.component.spec.ts
│   │       └── index.ts
│   │
│   ├── ui-tax-breakdown/                 # Dumb: Tax breakdown display
│   │   └── src/lib/
│   │       ├── tax-breakdown-card/
│   │       │   ├── tax-breakdown-card.component.ts
│   │       │   ├── tax-breakdown-card.component.html
│   │       │   └── tax-breakdown-card.component.spec.ts
│   │       ├── salary-comparison-table/
│   │       │   ├── salary-comparison-table.component.ts
│   │       │   └── salary-comparison-table.component.spec.ts
│   │       └── index.ts
│   │
│   ├── ui-shared/                        # Dumb: Shared components
│   │   └── src/lib/
│   │       ├── disclaimer-banner/
│   │       │   └── disclaimer-banner.component.ts
│   │       ├── loading-spinner/
│   │       │   └── loading-spinner.component.ts
│   │       ├── error-alert/
│   │       │   └── error-alert.component.ts
│   │       ├── currency-display/
│   │       │   └── currency-display.component.ts  # LKR formatter
│   │       ├── pipes/
│   │       │   ├── lkr-currency.pipe.ts
│   │       │   └── tax-year.pipe.ts
│   │       └── index.ts
│   │
│   ├── data-access-calculator/           # NgRx: Tax calculator store
│   │   └── src/lib/
│   │       ├── +state/
│   │       │   ├── calculator.actions.ts
│   │       │   ├── calculator.reducer.ts
│   │       │   ├── calculator.effects.ts
│   │       │   ├── calculator.selectors.ts
│   │       │   ├── calculator.reducer.spec.ts
│   │       │   ├── calculator.effects.spec.ts
│   │       │   └── calculator.selectors.spec.ts
│   │       ├── services/
│   │       │   ├── tax-calculator-api.service.ts
│   │       │   └── tax-calculator-api.service.spec.ts
│   │       ├── models/
│   │       │   ├── tax-calculation-request.model.ts
│   │       │   └── tax-calculation-result.model.ts
│   │       └── index.ts
│   │
│   ├── data-access-reports/              # NgRx: Reports store
│   │   └── src/lib/
│   │       ├── +state/
│   │       │   ├── reports.actions.ts
│   │       │   ├── reports.reducer.ts
│   │       │   ├── reports.effects.ts
│   │       │   └── reports.selectors.ts
│   │       ├── services/
│   │       │   └── reports-api.service.ts
│   │       └── index.ts
│   │
│   ├── data-access-budget/               # NgRx: Budget store
│   │   └── src/lib/
│   │       ├── +state/
│   │       │   ├── budget.actions.ts
│   │       │   ├── budget.reducer.ts
│   │       │   ├── budget.effects.ts
│   │       │   └── budget.selectors.ts
│   │       ├── services/
│   │       │   └── budget-api.service.ts
│   │       └── index.ts
│   │
│   ├── data-access-admin/                # NgRx: Admin store
│   │   └── src/lib/
│   │       ├── +state/
│   │       │   ├── admin.actions.ts
│   │       │   ├── admin.reducer.ts
│   │       │   ├── admin.effects.ts
│   │       │   └── admin.selectors.ts
│   │       ├── services/
│   │       │   └── admin-api.service.ts
│   │       └── index.ts
│   │
│   └── data-access-auth/                 # NgRx: Auth store + Supabase auth
│       └── src/lib/
│           ├── +state/
│           │   ├── auth.actions.ts
│           │   ├── auth.reducer.ts
│           │   ├── auth.effects.ts
│           │   └── auth.selectors.ts
│           ├── services/
│           │   └── supabase-auth.service.ts
│           └── index.ts
│
├── supabase/
│   ├── config.toml                        # Supabase local config
│   ├── functions/
│   │   ├── _shared/                       # Shared utilities (imported by all functions)
│   │   │   ├── cors.ts                    # CORS headers constant
│   │   │   ├── types.ts                   # Shared TypeScript interfaces
│   │   │   ├── auth.ts                    # JWT validation helper
│   │   │   ├── errors.ts                  # Typed error responses
│   │   │   └── tax-calculator.ts          # Core calculation logic
│   │   ├── calculate-tax/
│   │   │   ├── index.ts
│   │   │   └── __tests__/
│   │   │       └── calculate-tax.test.ts
│   │   ├── get-tax-rules/
│   │   │   ├── index.ts
│   │   │   └── __tests__/
│   │   ├── get-exchange-rate/
│   │   │   └── index.ts
│   │   ├── salary-profiles/
│   │   │   ├── index.ts
│   │   │   └── __tests__/
│   │   ├── save-calculation/
│   │   │   └── index.ts
│   │   ├── generate-report/
│   │   │   └── index.ts
│   │   ├── get-budget/
│   │   │   ├── index.ts
│   │   │   └── __tests__/
│   │   ├── admin-tax-rules/
│   │   │   ├── index.ts
│   │   │   └── __tests__/
│   │   ├── admin-exchange-rate/
│   │   │   └── index.ts
│   ├── migrations/
│   │   ├── 20260601000000_create_tax_tables.sql
│   │   ├── 20260601000100_create_users_table.sql
│   │   ├── 20260615000000_create_salary_tables.sql
│   │   ├── 20260615000100_create_audit_logs.sql
│   │   ├── 20260629000000_create_exchange_rates.sql
│   │   ├── 20260727000000_create_budget_tables.sql
│   │   └── 20260727000100_create_app_config.sql
│   ├── rollbacks/                         # Companion rollback scripts
│   └── seed/
│       ├── 01_tax_rules.sql               # EPF/ETF rates
│       ├── 02_tax_slabs_2023_24.sql       # APIT slabs 2023/24
│       ├── 03_tax_slabs_2024_25.sql       # APIT slabs 2024/25
│       ├── 04_exchange_rates.sql          # Initial USD/LKR rate
│       └── 05_app_config.sql             # Feature flags
│
├── docs/
│   ├── product-discovery/
│   │   └── phase-01-product-discovery.md
│   ├── requirements/
│   │   ├── phase-02-requirements.md
│   │   └── epic-01 through epic-10 .md
│   ├── architecture/                      # ← YOU ARE HERE
│   │   ├── phase-03-solution-architecture.md
│   │   ├── 01-architecture-overview.md
│   │   ├── 02-folder-structure.md
│   │   ├── 03-database-schema.md
│   │   ├── 04-api-contracts.md
│   │   ├── 05-security-model.md
│   │   └── 06-audit-logging.md
│   ├── AI-SDLC-Developer-Guide.md
│   ├── onboarding/
│   └── operations/
│
├── scripts/
│   ├── review_code.py
│   ├── review_architecture.py
│   └── security_scan.py
│
├── automation/
│   └── create_github_issue.py
│
├── angular.json                           # Angular workspace config
├── nx.json                                # NX workspace config
├── package.json
├── tailwind.config.js
├── tsconfig.base.json                     # Shared TypeScript paths (@lankatax/*)
├── .env.example                           # Template (gitignored .env.local)
├── .gitignore
├── LICENSE
└── README.md
```

---

## NX Library Boundary Rules (enforced via project.json tags)

```
Tag: "type:app"         → apps/lankatax/
Tag: "type:feature"     → libs/feature-*/
Tag: "type:ui"          → libs/ui-*/
Tag: "type:data-access" → libs/data-access-*/

Allowed imports:
  type:app         → type:feature, type:ui, type:data-access
  type:feature     → type:ui, type:data-access
  type:ui          → (nothing — dumb components only)
  type:data-access → (nothing — no UI or feature imports)
```

## TypeScript Path Aliases (tsconfig.base.json)

```json
{
  "paths": {
    "@lankatax/feature-calculator": ["libs/feature-calculator/src/index.ts"],
    "@lankatax/feature-reports":    ["libs/feature-reports/src/index.ts"],
    "@lankatax/feature-budget":     ["libs/feature-budget/src/index.ts"],
    "@lankatax/feature-admin":      ["libs/feature-admin/src/index.ts"],
    "@lankatax/feature-auth":       ["libs/feature-auth/src/index.ts"],
    "@lankatax/ui-salary-form":     ["libs/ui-salary-form/src/index.ts"],
    "@lankatax/ui-charts":          ["libs/ui-charts/src/index.ts"],
    "@lankatax/ui-tax-breakdown":   ["libs/ui-tax-breakdown/src/index.ts"],
    "@lankatax/ui-shared":          ["libs/ui-shared/src/index.ts"],
    "@lankatax/data-access-calculator": ["libs/data-access-calculator/src/index.ts"],
    "@lankatax/data-access-reports":    ["libs/data-access-reports/src/index.ts"],
    "@lankatax/data-access-budget":     ["libs/data-access-budget/src/index.ts"],
    "@lankatax/data-access-admin":      ["libs/data-access-admin/src/index.ts"],
    "@lankatax/data-access-auth":       ["libs/data-access-auth/src/index.ts"]
  }
}
```

## Angular Route Structure

```typescript
// apps/lankatax/src/app/app.routes.ts
export const routes: Routes = [
  { path: '', redirectTo: 'calculator', pathMatch: 'full' },
  {
    path: 'calculator',
    loadChildren: () => import('@lankatax/feature-calculator').then(m => m.CALCULATOR_ROUTES)
  },
  {
    path: 'reports',
    canActivate: [authGuard],
    loadChildren: () => import('@lankatax/feature-reports').then(m => m.REPORTS_ROUTES)
  },
  {
    path: 'budget',
    canActivate: [authGuard],
    loadChildren: () => import('@lankatax/feature-budget').then(m => m.BUDGET_ROUTES)
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadChildren: () => import('@lankatax/feature-admin').then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'auth',
    loadChildren: () => import('@lankatax/feature-auth').then(m => m.AUTH_ROUTES)
  },
  { path: '**', redirectTo: 'calculator' }
];
```

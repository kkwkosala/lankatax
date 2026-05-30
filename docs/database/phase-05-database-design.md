# Phase 5 — Database Design

## Overview

LankaTax uses **Supabase PostgreSQL** with Row Level Security (RLS) on every table. All schema changes are managed through versioned migration files in `supabase/migrations/`.

---

## Tables

| Table | Purpose | Records By |
|---|---|---|
| `tax_years` | Sri Lankan fiscal year definitions | Admin |
| `tax_rules` | EPF/ETF statutory rates (versioned) | Admin |
| `tax_slabs` | APIT slab bands (versioned by effective_date) | Admin |
| `users` | User profile linked to Supabase Auth | Auto (trigger) |
| `salary_profiles` | Saved salary configurations | User |
| `salary_calculations` | Immutable calculation history | System |
| `exchange_rates` | USD/LKR rate history | Admin |
| `budget_profiles` | Monthly budget definitions | User |
| `budget_items` | Individual budget line items | User |
| `audit_logs` | Append-only compliance log | System |
| `app_config` | Feature flags and system settings | Admin |

---

## Migration Execution Order

Run migrations in this exact order:

```
1. 20260601000000_create_tax_tables.sql        → tax_years, tax_rules, tax_slabs
2. 20260601000100_create_users_table.sql       → users + auto-create trigger
3. 20260615000000_create_salary_tables.sql     → salary_profiles, salary_calculations
4. 20260615000100_create_audit_logs.sql        → audit_logs
5. 20260629000000_create_exchange_rates.sql    → exchange_rates
6. 20260727000000_create_budget_tables.sql     → budget_profiles, budget_items
7. 20260727000100_create_app_config.sql        → app_config (feature flags)
```

Then run seed files:
```
supabase/seed/01_tax_years.sql
supabase/seed/02_tax_rules.sql
supabase/seed/03_tax_slabs_2024_2025.sql
supabase/seed/04_tax_slabs_2025_2026.sql
supabase/seed/05_config_and_rates.sql
```

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         auth.users (Supabase)                       │
│                  id · email · app_metadata (role)                   │
└──────┬──────────────────────────┬───────────────────────────────────┘
       │ 1:1 (trigger)            │ 1:N
       ▼                          ▼
┌─────────────┐          ┌─────────────────────┐
│    users    │          │   salary_profiles   │
│─────────────│          │─────────────────────│
│ id (PK=FK)  │          │ id (PK)             │
│ display_name│          │ user_id (FK)        │
│ role        │          │ name                │
│ created_at  │          │ basic_salary        │
│ updated_at  │          │ allowances...       │
└─────────────┘          │ pegging_*           │
                         │ is_default          │
                         └──────────┬──────────┘
                                    │ 1:N
                                    ▼
                         ┌─────────────────────┐     ┌──────────────┐
                         │ salary_calculations │────▶│  tax_slabs   │
                         │─────────────────────│     │  (snapshot   │
                         │ id (PK)             │     │   in JSONB)  │
                         │ user_id (FK)        │     └──────────────┘
                         │ profile_id (FK)     │
                         │ [inputs snapshot]   │
                         │ [outputs snapshot]  │
                         │ tax_slabs_snapshot  │
                         │ calculated_at       │
                         └──────────┬──────────┘
                                    │ 1:1 (optional)
                                    ▼
                         ┌─────────────────────┐
                         │   budget_profiles   │
                         │─────────────────────│
                         │ id (PK)             │
                         │ user_id (FK)        │
                         │ calculation_id (FK) │
                         │ budget_month        │
                         └──────────┬──────────┘
                                    │ 1:N
                                    ▼
                         ┌─────────────────────┐
                         │    budget_items     │
                         │─────────────────────│
                         │ id (PK)             │
                         │ budget_id (FK)      │
                         │ category_name       │
                         │ planned_amount      │
                         │ actual_amount       │
                         └─────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│  tax_years   │    │  tax_rules   │    │  exchange_rates  │
│──────────────│    │──────────────│    │──────────────────│
│ id (PK)      │    │ id (PK)      │    │ id (PK)          │
│ label        │    │ rule_type    │    │ currency_from    │
│ start_date   │    │ rate_value   │    │ currency_to      │
│ end_date     │    │ effective_date│   │ rate             │
│ is_current   │    └──────────────┘    │ rate_date        │
└──────┬───────┘                        └──────────────────┘
       │ 1:N
       ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│  tax_slabs   │    │  audit_logs  │    │   app_config     │
│──────────────│    │──────────────│    │──────────────────│
│ id (PK)      │    │ id (PK)      │    │ key (PK)         │
│ tax_year_id  │    │ entity_type  │    │ value (JSONB)    │
│ effective_date│   │ action       │    │ description      │
│ lower_bound  │    │ actor_id     │    │ updated_at       │
│ upper_bound  │    │ old_values   │    └──────────────────┘
│ rate         │    │ new_values   │
│ slab_order   │    │ created_at   │
└──────────────┘    └──────────────┘
```

---

## RLS Policy Summary

| Table | Who can SELECT | Who can INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `tax_years` | Everyone | Admin only | ❌ | ❌ |
| `tax_rules` | Everyone | Admin only | ❌ | ❌ |
| `tax_slabs` | Everyone | Admin only | ❌ | ❌ |
| `users` | Own record | Via trigger | Own (role immutable) | Via cascade |
| `salary_profiles` | Own records | Own user_id | Own records | Own records |
| `salary_calculations` | Own records | Own user_id | ❌ (immutable) | ❌ (immutable) |
| `exchange_rates` | Everyone | Admin only | ❌ | ❌ |
| `budget_profiles` | Own records | Own user_id | Own records | Own records |
| `budget_items` | Via parent | Via parent | Via parent | Via parent |
| `audit_logs` | Admin only | Anyone (service) | ❌ | ❌ |
| `app_config` | Everyone | Admin only | Admin only | Admin only |

---

## Index Strategy

| Table | Index | Purpose |
|---|---|---|
| `tax_rules` | `(rule_type, effective_date DESC)` | Latest rate lookup by type |
| `tax_slabs` | `(tax_year_id, effective_date DESC)` | Active slabs for a tax year |
| `tax_slabs` | `(effective_date DESC, slab_order ASC)` | Ordered slab iteration |
| `tax_years` | `(is_current) WHERE is_current = TRUE` | Unique partial — one current year |
| `salary_profiles` | `(user_id)` | User's profiles list |
| `salary_profiles` | `(user_id) WHERE is_default = TRUE` | Unique partial — one default |
| `salary_calculations` | `(user_id, calculated_at DESC)` | User's calculation history |
| `exchange_rates` | `(rate_date DESC)` | Latest rate lookup |
| `exchange_rates` | `(from, to, rate_date)` UNIQUE | No duplicate rates per day |
| `budget_profiles` | `(user_id, budget_month DESC)` | User's monthly budgets |
| `budget_items` | `(budget_id, sort_order)` | Ordered items in a budget |
| `audit_logs` | `(entity_type, entity_id)` | Audit trail for an entity |
| `audit_logs` | `(actor_id, created_at DESC)` | Audit trail for a user |
| `audit_logs` | `(action, created_at DESC)` | Filter by action type |

---

## Rollback Strategy

Each migration has a corresponding rollback file:

```
supabase/migrations/rollback/
  rollback_20260727000100.sql   → DROP app_config
  rollback_20260727000000.sql   → DROP budget_items, budget_profiles
  rollback_20260629000000.sql   → DROP exchange_rates
  rollback_20260615000100.sql   → DROP audit_logs
  rollback_20260615000000.sql   → DROP salary_calculations, salary_profiles
  rollback_20260601000100.sql   → DROP trigger, DROP users
  rollback_20260601000000.sql   → DROP tax_slabs, tax_rules, tax_years
```

> ⚠️ **Never run rollbacks on production** without a full database backup. Run in reverse migration order only.

---

## Key Constraints

| Rule | Implementation |
|---|---|
| One current tax year | `UNIQUE INDEX ... WHERE is_current = TRUE` |
| One default salary profile per user | `UNIQUE INDEX ... WHERE is_default = TRUE` |
| Calculations are immutable | No UPDATE/DELETE RLS policy on `salary_calculations` |
| Audit log is append-only | No UPDATE/DELETE RLS policy on `audit_logs` |
| Tax slabs never edited | No UPDATE/DELETE RLS policy on `tax_slabs` |
| Budget items inherit access | RLS checks parent `budget_profiles.user_id` |

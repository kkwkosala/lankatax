# LankaTax — AI SDLC Developer Guide

## Overview

This guide walks through the complete AI-SDLC pipeline for LankaTax, from raw requirement to production deployment.

## The Pipeline

```
Step 1: /requirement   → Structured requirement doc
Step 2: /brainstorm    → Approved implementation approach
Step 3: /create-pbis   → GitHub Issues created
Step 4: /design        → Approved technical design
Step 5: Create branch  → feature/N-description
Step 6: /implement     → Code + Edge Functions
Step 7: /generate-tests → Tests written + passing
Step 8: /impact-analysis → Blast radius assessed
Step 9: /create-pr     → PR opened with template
Step 10: CI Review     → Automated checks pass
Step 11: Human Review  → 1 approval minimum
Step 12: QA            → Staging verification
Step 13: Squash Merge  → To main
Step 14: /release      → Sprint-end tag + deploy
```

## Example: Adding a New Tax Slab

### Step 1 — Requirement
```
/requirement

Type: Tax Rule Change
Raw: "IRD gazette No. 2345/12 effective 2025-04-01 updates APIT slabs"
Scope: [DB] + [BE] (slab data change + validation)
```

### Step 2 — Brainstorm
```
/brainstorm
Approach A: Admin panel UI update
Approach B: Direct migration script
Recommended: Migration script (audit trail, reproducible)
```

### Step 3 — Design
```
/design
Migration: supabase/migrations/20250401000000_update_apit_slabs_2025.sql
Edge Function: get-tax-rules (no change needed — reads from DB)
Effective date: 2025-04-01
```

### Step 4 — Implement
```bash
git checkout -b feature/45-update-apit-slabs-2025-04

# Write migration SQL
# Update seed data
# No Edge Function change needed
```

### Step 5 — Test + Review
```
/generate-tests  → Verify new slabs produce correct APIT values
/impact-analysis → Additive migration, no contract change
/create-pr #45   → PR opened
```

## Key Commands Reference

| Command | Input | Output |
|---|---|---|
| `/requirement` | Raw stakeholder ask | Structured AC + NFR doc |
| `/brainstorm` | Requirement doc | 2–3 approaches + recommendation |
| `/design` | Approved approach | API contracts + DB schema + NgRx design |
| `/create-pbis` | Approved design | GitHub Issues with labels + milestone |
| `/implement #N` | Issue #N + design | Code files |
| `/generate-tests` | Implemented code | Test files |
| `/impact-analysis` | Changed files | Risk level + blast radius |
| `/create-pr #N` | All above | Structured PR |
| `/review` | PR diff | Code review comments |
| `/release vX.Y.Z` | Green main branch | Tag + deploy + CHANGELOG |

## Tax Domain Quick Reference

```
GrossSalary = BasicSalary + AllAllowances + PeggingAllowance

PeggingAllowance = (CurrentRate - BaseRate) × PeggedUSDValue  [if enabled]

EmployeeEPF   = GrossSalary × 8%          [from tax_rules]
TaxableIncome = GrossSalary - EmployeeEPF - TaxRelief

APitTax       = calculate_from_slabs(TaxableIncome)  [from tax_slabs]

TakeHome      = GrossSalary - EmployeeEPF - APitTax

EmployerEPF   = GrossSalary × 12%         [from tax_rules]
EmployerETF   = GrossSalary × 3%          [from tax_rules]
EmployerCost  = GrossSalary + EmployerEPF + EmployerETF

USDEquivalent = GrossSalary ÷ CurrentExchangeRate
```

## Branch Strategy

```
main          — always deployable, protected
feature/N-*   — from main, squash-merged back
bugfix/N-*    — from main, squash-merged back
hotfix/*      — from release TAG, merged to main + release branch
```

## Supabase Environment Strategy

| Environment | Supabase Project | Angular Config |
|---|---|---|
| Local dev | supabase start (local) | environment.ts |
| Staging | lankatax-staging | environment.staging.ts |
| Production | lankatax-prod | environment.production.ts |

## CI/CD

Every PR triggers:
1. AI code review (`scripts/review_code.py`)
2. Architecture review (`scripts/review_architecture.py`)
3. Security scan (`scripts/security_scan.py`)
4. Angular lint + build + tests (if FE/FULL)
5. Edge Function tests (if BE/FULL)

All checks must pass before human review.

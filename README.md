# 🇱🇰 LankaTax — Sri Lankan Salary Tax & Budgeting Platform

[![PR Validation](https://github.com/kkwkosala/lankatax/actions/workflows/pr-validation.yml/badge.svg)](https://github.com/kkwkosala/lankatax/actions/workflows/pr-validation.yml)

> AI-SDLC powered platform for APIT/PAYE tax calculation, EPF/ETF contributions, pegging allowances, USD salary conversion, and personal budget planning — built for Sri Lankan employees.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 20 · Angular Material · NgRx · Tailwind CSS |
| Backend | Supabase Edge Functions (Deno/TypeScript) |
| Database | Supabase PostgreSQL with Row Level Security |
| Auth | Supabase Auth (email + OAuth) |
| CI/CD | GitHub Actions |
| Hosting | Supabase (backend) · Vercel/Netlify (frontend) |

## AI-SDLC Pipeline

```
/requirement → /brainstorm → Approve → /create-pbis → /design → Approve
  → Create branch → /implement → /generate-tests → /impact-analysis
  → /create-pr → AI Review (CI) → Human Review (1 approval) → QA → Squash Merge → /release
```

## Claude Commands Quick Reference

| Command | When |
|---|---|
| `/requirement` | **First step** — capture and structure any new requirement |
| `/brainstorm` | Explore implementation approaches |
| `/design` | After brainstorm approval — full tech spec |
| `/create-pbis` | Break design into `[DB]`/`[BE]`/`[FE]` GitHub Issues |
| `/implement #N` | Scaffold Angular feature or Edge Function slice |
| `/generate-tests` | Write Angular + Edge Function tests |
| `/impact-analysis` | Blast radius check before PR |
| `/create-pr #N` | Open structured PR |
| `/review` | AI code + architecture + security review |
| `/release vX.Y.Z` | Sprint-end production release |

## Core Features

- ✅ APIT/PAYE tax calculation (configurable slabs)
- ✅ EPF (8% employee / 12% employer) & ETF (3%) contributions
- ✅ Pegging allowance calculator (USD-LKR rate differential)
- ✅ USD equivalent salary display
- ✅ Full salary breakdown with charts
- ✅ Historical tax year comparison
- ✅ PDF/Excel salary reports
- ✅ Personal budget planning
- ✅ Admin tax rule management panel

## CI Checks (every PR)

| Check | Script | Covers |
|---|---|---|
| Code review | `scripts/review_code.py` | Angular best practices, Edge Function patterns, NgRx |
| Architecture | `scripts/review_architecture.py` | Layer boundaries, Supabase RLS, security |
| Security | `scripts/security_scan.py` | OWASP Top 10, secrets, SQL injection, XSS |

## Docs

- [Developer Onboarding](docs/onboarding/README.md)
- [AI SDLC Developer Guide](docs/AI-SDLC-Developer-Guide.md)
- [Operating Manual](.claude/CLAUDE.md)
- [Agents](.claude/agents/)
- [Commands](.claude/commands/)
- [Phase 1 — Product Discovery](docs/product-discovery/phase-01-product-discovery.md)
 Sri Lankan Salary Tax Calculator &amp; Budgeting Platform — AI-SDLC powered

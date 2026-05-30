# LankaTax — Developer Onboarding

Welcome to the LankaTax team. This guide gets you set up and productive in one session.

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 20+ | https://nodejs.org |
| Angular CLI | 20+ | `npm install -g @angular/cli` |
| Deno | 1.x | https://deno.land |
| Supabase CLI | latest | `npm install -g supabase` |
| Git | 2.x | https://git-scm.com |
| VS Code | latest | https://code.visualstudio.com |

## VS Code Extensions (Required)

- Angular Language Service
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Deno (by denoland)
- Supabase

## Repository Setup

```bash
git clone https://github.com/kkwkosala/lankatax.git
cd lankatax
npm install
```

## Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Fill in your values:
# SUPABASE_URL=https://[your-project].supabase.co
# SUPABASE_ANON_KEY=your-anon-key
# (AI insights feature removed — no external API costs)
```

**Never commit `.env.local` — it is gitignored.**

## Supabase Local Development

```bash
# Start local Supabase
supabase start

# Apply migrations
supabase db push

# Seed default tax data
supabase db seed

# Deploy Edge Functions locally
supabase functions serve
```

## Running the Application

```bash
# Start Angular dev server
ng serve

# App available at: http://localhost:4200
```

## Running Tests

```bash
# Angular tests
ng test --watch=false

# Edge Function tests (Deno)
deno test supabase/functions/ --allow-all

# All tests
npm run test:all
```

## AI-SDLC Workflow

Every feature follows this pipeline — no exceptions:

```
/requirement → /brainstorm → Approve → /create-pbis → /design → Approve
  → feature branch → /implement → /generate-tests → /impact-analysis
  → /create-pr → CI → Human Review → QA → Squash Merge → /release
```

Read the full pipeline: [AI-SDLC Developer Guide](../AI-SDLC-Developer-Guide.md)

## Sri Lankan Tax Domain

Before coding anything tax-related, understand:

1. Tax slabs are stored in `tax_slabs` table — NEVER hardcode them
2. EPF/ETF rates are in `tax_rules` table — NEVER hardcode them
3. Calculation sequence: `gross → employee_epf → taxable_income → apit_tax → take_home`
4. Pegging formula: `(current_rate - base_rate) × pegged_usd_value`
5. All rates are **monthly** (Sri Lankan APIT is assessed monthly)

## Key Contacts

- Tax domain questions → [Koshala / Finance team]
- Architecture decisions → Run `/design` first, then discuss
- Production issues → Create hotfix branch from release tag

## First Task

1. Read [CLAUDE.md](../../.claude/CLAUDE.md) — the operating manual
2. Read the agents in `.claude/agents/`
3. Pick an issue from Sprint 1 on the GitHub board
4. Run `/requirement #N` to understand it fully
5. Start coding!

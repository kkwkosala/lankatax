# Phase 3 — Solution Architecture
## LankaTax: Sri Lankan Salary Tax & Budgeting Platform

**Status:** ✅ Complete  
**Date:** 2026-05-30  
**Phase:** 3 of 10  
**Architect:** AI Architect Agent  
**Previous Phase:** [Phase 2 — Requirement Analysis](../requirements/phase-02-requirements.md)  
**Next Phase:** Phase 4 — Sri Lankan Tax Domain Design

---

## Architecture Documents

| Document | Contents |
|---|---|
| [01 — Architecture Overview](01-architecture-overview.md) | System diagram, component map, data flow |
| [02 — Folder Structure](02-folder-structure.md) | Angular 20 NX + Supabase complete file tree |
| [03 — Database Schema](03-database-schema.md) | Full PostgreSQL schema, indexes, RLS policies |
| [04 — API Contracts](04-api-contracts.md) | All Edge Function endpoints with TypeScript types |
| [05 — Security Model](05-security-model.md) | Auth, RLS, OWASP controls, admin isolation |
| [06 — Audit & Logging Strategy](06-audit-logging.md) | Audit trail design, logging approach |

---

## Architectural Decisions

| # | Decision | Choice | Rationale |
|---|---|---|---|
| AD1 | Backend runtime | Supabase Edge Functions (Deno) | Zero-config deployment, co-located with DB, no cold start for simple functions |
| AD2 | Frontend framework | Angular 20 (standalone components) | Enterprise-grade, strong TypeScript, signals for reactivity |
| AD3 | State management | NgRx with signals integration | Predictable state, time-travel debugging, enterprise pattern |
| AD4 | CSS framework | Tailwind CSS + Angular Material | Utility-first for layout, Material for form components and accessibility |
| AD5 | Tax rule storage | PostgreSQL tables (not config files) | Admin-editable without deployments; versioned by effective_date |
| AD6 | Auth provider | Supabase Auth | Integrated with DB, RLS uses auth.uid() natively |
| AD7 | PDF generation | Server-side Edge Function | Consistent output, no client-side library bloat |
| AD8 | Monorepo | NX workspace | Enforced library boundaries, shared TypeScript paths, affected builds |
| AD9 | Audit log | Append-only Postgres table | Tamper-proof, queryable, no external service needed at MVP scale |

---

## Non-Functional Requirements

| NFR | Target |
|---|---|
| Tax calculation latency | < 500ms p95 (Edge Function cold start included) |
| PDF generation | < 5 seconds |
| Frontend First Contentful Paint | < 1.5s (Vercel CDN) |
| Database query performance | All queries < 50ms with indexes |
| Availability | 99.9% (Supabase SLA) |
| Security | OWASP Top 10 compliance; RLS on all user tables |
| Accessibility | WCAG 2.1 AA on all calculator and form screens |
| Tax accuracy | Results match IRD published examples to within LKR 1 |

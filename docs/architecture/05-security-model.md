# 05 — Security Model

## Authentication Architecture

```
User → Angular App → Supabase Auth
                          │
                    Issues JWT (RS256)
                          │
                    Stored: memory / httpOnly cookie
                          │
               Every API call: Authorization: Bearer <jwt>
                          │
                    Edge Function validates JWT
                    via supabase.auth.getUser()
                          │
                    PostgreSQL RLS policies
                    evaluate auth.uid() and
                    auth.jwt() ->> 'role'
```

---

## Auth Security Controls

| Control | Implementation |
|---|---|
| Password storage | Supabase Auth (bcrypt) — never in application DB |
| Session token | JWT (RS256), stored in memory; refresh token in httpOnly cookie |
| Session expiry | Access token: 1 hour; Refresh token: 30 days |
| Brute force | Supabase Auth: 5 failed attempts → 15min lockout |
| OAuth | Google OAuth via Supabase — no OAuth tokens stored |
| Admin auth | Email/password only (no OAuth for admin accounts) |
| Role management | `app_metadata.role` set server-side only — users cannot self-elevate |
| Password reset | Email-based OTP via Supabase Auth |

---

## Row Level Security (RLS) Policy Matrix

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `users` | Own record only | Via trigger only | Own record (role immutable) | Via cascade (account deletion) |
| `salary_profiles` | Own records | Own user_id | Own records | Own records |
| `salary_calculations` | Own records | Own user_id (or NULL) | ❌ None (immutable) | ❌ None (immutable) |
| `tax_years` | Everyone | Admin only | ❌ None | ❌ None |
| `tax_rules` | Everyone | Admin only | ❌ None | ❌ None |
| `tax_slabs` | Everyone | Admin only | ❌ None | ❌ None |
| `exchange_rates` | Everyone | Admin only | ❌ None | ❌ None |
| `budget_profiles` | Own records | Own user_id | Own records | Own records |
| `budget_items` | Via parent budget | Via parent budget | Via parent budget | Via parent budget |
| `audit_logs` | Admin only | Anyone (service) | ❌ None | ❌ None |
| `app_config` | Everyone | Admin only | Admin only | Admin only |

### Admin Role Check Pattern

```sql
-- Used in admin-only policies:
auth.jwt() ->> 'role' = 'admin'

-- This reads from app_metadata (server-controlled, not user-editable)
-- Set via Supabase Admin API: supabase.auth.admin.updateUserById(id, { app_metadata: { role: 'admin' } })
```

---

## Edge Function Security Controls

Every Edge Function implements in order:

### 1. CORS Preflight (all functions)
```typescript
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders });
}
```

### 2. JWT Validation
```typescript
const { user, supabase, error } = await getAuthenticatedUser(req, /* required= */ true);
if (error) return error; // Returns 401
```

### 3. Admin Role Check (admin functions only)
```typescript
if (user.role !== 'admin') {
  return errorResponse('Admin access required', 'ADMIN_REQUIRED', 403);
}
```

### 4. Input Validation
```typescript
// Validate all request body fields before processing
// Return 400 with field-level error messages
```

### 5. No PII in Responses
```typescript
// Never include: email, password, full name in error responses
// Never log: salary amounts, tax values, user email
```

---

## OWASP Top 10 Controls

| # | Risk | Control |
|---|---|---|
| A01 Broken Access Control | RLS on every table; admin role server-enforced; no direct DB access | ✅ |
| A02 Cryptographic Failures | Supabase handles TLS; no secrets in code; JWT RS256 | ✅ |
| A03 Injection | Parameterised queries via Supabase client; no string interpolation in SQL | ✅ |
| A04 Insecure Design | RLS-first design; immutable calculations; append-only audit log | ✅ |
| A05 Security Misconfiguration | Minimal Supabase permissions; no public schema exposure; CORS restricted | ✅ |
| A06 Vulnerable Components | Dependabot weekly updates; no `npm audit` failures in CI | ✅ |
| A07 Auth Failures | Supabase Auth with brute force protection; JWT validation in every function | ✅ |
| A08 Integrity Failures | Tax slabs snapshotted in calculations; audit log append-only | ✅ |
| A09 Logging Failures | Audit log captures all sensitive actions; security events logged | ✅ |
| A10 SSRF | Edge Functions only call Supabase DB and OpenAI (allowlisted) | ✅ |

---

## Secrets Management

| Secret | Storage | Access |
|---|---|---|
| Supabase URL | `.env.local` / Vercel env var | Frontend + Edge Functions |
| Supabase Anon Key | `.env.local` / Vercel env var | Frontend (public key — safe) |
| Supabase Service Role Key | Supabase Edge Function secrets ONLY | Edge Functions (server-side) |
| OpenAI API Key | Supabase Edge Function secrets ONLY | `ai-insights` function only |
| Exchange Rate API Key | Supabase Edge Function secrets ONLY | `admin-exchange-rate` function |

**Rules:**
- Service role key NEVER in frontend
- OpenAI key NEVER in frontend or git
- All secrets in `.env.local` are gitignored
- CI/CD secrets in GitHub Actions encrypted secrets

---

## Frontend Security Controls

| Control | Implementation |
|---|---|
| XSS | Angular template binding (safe by default); no `innerHTML`; DomSanitizer for any dynamic HTML |
| CSRF | Not applicable (JWT Bearer — not cookie-based for API calls) |
| Content Security Policy | Configured in Vercel `vercel.json` |
| Sensitive data in state | NgRx state never stores JWT or passwords |
| Route protection | `authGuard` on all authenticated routes; `adminGuard` on admin routes |
| Input validation | Angular reactive forms with validators on all fields |

---

## Security Checklist (Per PR)

Every PR touching auth, Edge Functions, or DB must verify:
- [ ] JWT validated in every new/modified Edge Function
- [ ] No new tables without RLS enabled
- [ ] No new RLS policies that expose cross-user data
- [ ] No secrets in source code (checked by `scripts/security_scan.py`)
- [ ] No salary/PII data in log statements
- [ ] Admin endpoints have role check (`user.role !== 'admin'`)
- [ ] All inputs validated before DB operations
- [ ] No `innerHTML` in Angular templates

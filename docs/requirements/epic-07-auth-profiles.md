# EPIC 7 — Authentication & Profiles

**Epic Label:** `epic:auth`  
**Priority:** 🔴 Critical  
**Sprint:** 1  
**GitHub Milestone:** Sprint 1 — Tax Engine & Auth

---

## Epic Goal
Implement secure user authentication using Supabase Auth, with support for email/password and Google OAuth. Manage user profiles and ensure all salary data is strictly isolated by user.

---

## User Stories

### US-7.1 — User Registration
**As a** new user  
**I want to** create an account with my email and password  
**So that** I can save my salary profiles and access my calculation history  

#### Acceptance Criteria
- **AC1:** Registration form: email, password, confirm password
- **AC2:** Email must be unique — duplicate email returns friendly error
- **AC3:** Password minimum: 8 characters, at least 1 number, at least 1 uppercase
- **AC4:** Email verification sent on registration
- **AC5:** User can use the app without verifying email, but a banner prompts verification
- **AC6:** Registration form is accessible (WCAG 2.1 AA)

#### Business Rules
- BR7.1.1: Supabase Auth handles password hashing — never stored in plain text
- BR7.1.2: Email stored in Supabase Auth — not duplicated in `users` table
- BR7.1.3: On first login, a `users` profile record is created via DB trigger

#### Validation Rules
- Email: required, valid format, max 254 chars
- Password: min 8 chars, must contain uppercase and digit
- Confirm password: must match password

---

### US-7.2 — User Login / Logout
**As a** returning user  
**I want to** log in with my email and password (or Google)  
**So that** I can access my saved profiles and history  

#### Acceptance Criteria
- **AC1:** Email/password login with Supabase Auth
- **AC2:** Google OAuth login supported
- **AC3:** "Remember me" keeps session for 30 days
- **AC4:** Failed login shows generic error (not "email not found" — security)
- **AC5:** After 5 failed attempts, account temporarily locked for 15 minutes
- **AC6:** Logout clears session and redirects to home

#### Business Rules
- BR7.2.1: JWT session token stored in memory / httpOnly cookie — not localStorage
- BR7.2.2: Session refresh handled automatically by Supabase client
- BR7.2.3: Admin users must use email/password only (no OAuth)

#### Edge Cases
- OAuth account same email as email/password account → Supabase handles merging
- Expired JWT → silent refresh, if refresh fails redirect to login

---

### US-7.3 — User Profile Management
**As a** registered user  
**I want to** manage my account profile  
**So that** I can update my display name and manage my account  

#### Acceptance Criteria
- **AC1:** User can update: display name
- **AC2:** User can change password (requires current password)
- **AC3:** User can view account creation date and last login
- **AC4:** User can view their calculation count and profile count

---

### US-7.4 — Account Deletion
**As a** registered user  
**I want to** permanently delete my account and all associated data  
**So that** I can exercise my right to erasure  

#### Acceptance Criteria
- **AC1:** Delete account option in profile settings
- **AC2:** Confirmation step: user must type "DELETE" to confirm
- **AC3:** On deletion: user record, all salary profiles, all calculations deleted
- **AC4:** Deletion is irreversible — shown prominently in UI
- **AC5:** User receives confirmation email after deletion

#### Business Rules
- BR7.4.1: Cascade delete: `ON DELETE CASCADE` on all user-owned tables
- BR7.4.2: Audit logs are retained (anonymised) for compliance even after deletion
- BR7.4.3: Deletion handled by Edge Function (bypasses RLS with service role)

---

### US-7.5 — Anonymous / Guest Mode
**As a** visitor who hasn't registered  
**I want to** use the tax calculator without creating an account  
**So that** I can evaluate the tool before committing to registration  

#### Acceptance Criteria
- **AC1:** Full calculator available without login
- **AC2:** Calculations not saved in guest mode
- **AC3:** After calculation, a non-intrusive prompt invites user to register to save
- **AC4:** Guest session is not tracked beyond the current session

#### Business Rules
- BR7.5.1: Guest mode uses Supabase anonymous sessions or no auth
- BR7.5.2: No personal data collected from guest users

---

## DB Requirements

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'user', -- 'user' | 'admin'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own" ON users USING (auth.uid() = id);
```

## Definition of Epic Done
- [ ] Email/password registration and login
- [ ] Google OAuth login
- [ ] Session management (JWT refresh)
- [ ] Profile management UI
- [ ] Account deletion with cascade
- [ ] Guest/anonymous calculator mode
- [ ] Auth guard on all protected Angular routes
- [ ] RLS verified: no cross-user data access

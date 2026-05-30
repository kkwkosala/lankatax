# release-agent

## Role
Release Manager — handles sprint-end releases, generates CHANGELOG, release notes, deployment guide, and creates GitHub releases.

## When to Use
At sprint end, after all PRs are merged to `main` and CI is green.

## Release Process

### 1. Pre-Release Checks
- [ ] All sprint PRs merged to `main`
- [ ] CI pipeline green on `main`
- [ ] Supabase migrations applied to staging
- [ ] Angular build succeeds (`ng build --configuration=production`)
- [ ] Edge Functions deployed to staging
- [ ] Smoke tests passed on staging

### 2. Version Bump
Follow Semantic Versioning:
- `MAJOR` — breaking change (new tax year with incompatible slab format)
- `MINOR` — new feature (new calculation type, new report format)
- `PATCH` — bug fix or tax slab data update

### 3. CHANGELOG Format

```markdown
# CHANGELOG

## [vX.Y.Z] — YYYY-MM-DD

### Added
- [EPIC] Feature description

### Changed
- [EPIC] What changed and why

### Fixed
- [EPIC] Bug description

### Tax Rules Updated
- [Tax Year YYYY/YY] Updated APIT slab: LKR X–Y at Z%
- [Tax Year YYYY/YY] EPF employee rate: 8% (unchanged)

### Security
- Security fix description

### Migration Notes
- Run: `supabase db push` for migration YYYYMMDDHHMMSS_description
```

### 4. GitHub Release Notes

```markdown
## LankaTax vX.Y.Z — YYYY-MM-DD

### 🇱🇰 Tax Updates
[If any tax rules changed this release]

### ✨ New Features
- Feature 1
- Feature 2

### 🐛 Bug Fixes
- Fix 1

### 🔒 Security
- Security update 1

### 📦 Deployment

**Supabase (backend):**
```bash
supabase db push
supabase functions deploy --no-verify-jwt calculate-tax
supabase functions deploy get-tax-rules
```

**Frontend:**
```bash
ng build --configuration=production
# Deploy dist/ to Vercel/Netlify
```

### ⏪ Rollback
- Frontend: redeploy previous deployment from Vercel/Netlify dashboard
- Backend: `supabase db reset` + redeploy previous functions (see rollback guide)
- Tax rules: revert via admin panel or direct DB update in `tax_slabs`
```

## Output
- Updated `CHANGELOG.md`
- GitHub Release created with tag `vX.Y.Z`
- Deployment instructions provided
- Rollback guide documented

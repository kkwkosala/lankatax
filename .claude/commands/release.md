# /release vX.Y.Z

You are acting as the **Release Agent**. Prepare and execute a sprint-end production release.

## When to Use
At sprint end, after all PRs are merged and `main` CI is green.

## Pre-Release Checklist
- [ ] All sprint PRs merged to `main`
- [ ] CI pipeline green on `main`
- [ ] Supabase migrations applied to staging: `supabase db push`
- [ ] Edge Functions deployed to staging: `supabase functions deploy`
- [ ] Angular build succeeds: `ng build --configuration=production`
- [ ] Smoke tests passed on staging (calculator, EPF, pegging, reports)
- [ ] Tax calculation verified against IRD reference (if tax rules changed)

## Release Steps

### 1. Update CHANGELOG.md
Add entry at top:
```markdown
## [vX.Y.Z] — YYYY-MM-DD
### Added
### Changed
### Fixed
### Tax Rules Updated (if applicable)
### Security
### Migration Notes
```

### 2. Tag the Release
```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z — [Sprint name]"
git push origin vX.Y.Z
```

### 3. Deploy to Production

**Supabase backend:**
```bash
supabase db push --linked
supabase functions deploy calculate-tax
supabase functions deploy get-tax-rules
supabase functions deploy get-exchange-rate
supabase functions deploy save-calculation
supabase functions deploy generate-report
supabase functions deploy get-budget
supabase functions deploy admin-tax-rules
supabase functions deploy ai-insights
```

**Frontend (Vercel):**
```bash
ng build --configuration=production
# Vercel auto-deploys on main push, or:
vercel --prod
```

### 4. Post-Deploy Verification
- [ ] Health check: `/api/health` → 200
- [ ] Calculator produces correct result for reference salary
- [ ] EPF/ETF rates display correctly
- [ ] Tax slabs load correctly for current tax year
- [ ] Auth login/logout works

### 5. Create GitHub Release
- Title: `LankaTax vX.Y.Z — [Sprint name]`
- Tag: `vX.Y.Z`
- Body: copy from CHANGELOG

## Rollback Procedure
1. **Frontend:** Redeploy previous deployment from Vercel dashboard
2. **Edge Functions:** `supabase functions deploy [name] --version [previous-sha]`
3. **DB Migration:** Execute rollback script from `supabase/migrations/rollbacks/`
4. **Tax Slabs:** Revert via admin panel or direct: `UPDATE tax_slabs SET active=false WHERE ...`

## Next Steps
→ Notify team → Update sprint board → Begin next sprint planning

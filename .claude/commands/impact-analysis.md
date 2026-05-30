# /impact-analysis

You are acting as the **Impact Agent**. Assess the full blast radius of your changes before opening a PR.

## When to Use
Before every `/create-pr`. Non-negotiable step in the pipeline.

## Analysis Checklist

Run through each dimension:

### Tax Domain (highest priority)
```
[ ] Does this change the calculation sequence?
[ ] Which step: gross / employee_epf / taxable_income / apit_tax / take_home / employer_cost / pegging
[ ] Are historical calculations affected?
[ ] Are tax slabs / rates / relief thresholds changed?
[ ] Is a new tax rule effective date required?
[ ] Does the pegging formula change?
```

### Database
```
[ ] Tables added? (additive — low risk)
[ ] Columns added? (additive — low risk)
[ ] Columns modified/removed? (breaking — requires sign-off)
[ ] New RLS policies? (security check required)
[ ] Existing RLS policies changed? (security check required)
[ ] Seed data updated? (tax_slabs, exchange_rates)
```

### Edge Functions
```
[ ] Which functions modified?
[ ] Request type changed? (breaking if FE not updated simultaneously)
[ ] Response type changed? (breaking if FE not updated simultaneously)
[ ] Shared utilities modified? (affects all functions importing them)
[ ] Auth logic modified? (security check required)
```

### Angular
```
[ ] NX library boundaries violated? (must fix before PR)
[ ] NgRx state shape changed? (check all selectors)
[ ] Shared UI components changed? (check all consumers)
[ ] Routes added/modified?
[ ] AuthGuard added where needed?
```

### Cross-Cutting
```
[ ] Audit logging affected?
[ ] Open PRs that conflict with these changes?
[ ] Feature flags needed?
```

## Output Format
```markdown
## Impact Analysis: PR #[N] — [Branch name]
**Risk Level:** 🟢 Low / 🟡 Medium / 🔴 High / ⚫ Critical

### Tax Domain
- Calculation steps affected: [none / list]
- Historical data impact: None / Recompute required / Preserve (note discrepancy)
- Tax slab migration: Yes / No

### Database
- Breaking migration: Yes / No
- New RLS policies: Yes / No

### Edge Functions
- Breaking contract change: Yes / No
- Functions modified: [list]

### Angular  
- NX boundary violations: None / [list]
- NgRx state change: Yes / No

### Open PR Conflicts
- [#N - title] — conflict on [file]

### Recommendation
[Proceed / Fix [issues] before proceeding]
```

## Next Steps
→ On low/medium risk: `/create-pr #N`
→ On high/critical: fix issues, re-run `/impact-analysis`

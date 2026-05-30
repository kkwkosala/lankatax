# /create-pbis

You are acting as the **PBI Agent**. Break an approved design into GitHub Issues and create them via the automation script.

## When to Use
After design approval. Creates GitHub Issues before any implementation begins.

## Steps

1. Read the approved design document
2. Identify all PBIs needed:
   - `[DB]` — migration script
   - `[BE]` — Edge Function(s)
   - `[FE]` — Angular feature (smart + dumb components + NgRx)
3. Set correct dependencies (`[BE]` blocked by `[DB]`, `[FE]` blocked by `[BE]`)
4. Create issues using `automation/create_github_issue.py`
5. Assign to correct sprint milestone

## PBI Template Per Issue

```markdown
**Title:** [DB/BE/FE] Short description

**Body:**
## Summary
[1–2 sentences]

## Design Reference
[Link to docs/design/[name].md]

## Acceptance Criteria
- [ ] AC1
- [ ] AC2

## Technical Notes
[DB]: Migration file path + tables affected + RLS policies
[BE]: Edge Function path + request/response types + auth requirement
[FE]: NX lib + components + NgRx slice + API service method

## Dependencies
Blocked by: #N (if applicable)

## Definition of Done
- [ ] Implemented per design
- [ ] Tests written and passing
- [ ] CI green
- [ ] PR reviewed and approved
```

## Labels to Apply
- Type: `db`, `backend`, `frontend`
- Epic: `epic:tax-engine`, `epic:salary-breakdown`, `epic:pegging`, `epic:usd-conversion`, `epic:tax-admin`, `epic:reporting`, `epic:auth`, `epic:ai-insights`, `epic:budget`, `epic:audit`
- Priority: `priority:critical`, `priority:high`, `priority:medium`, `priority:low`
- Sprint: `sprint:1` through `sprint:6`

## Usage
```bash
python automation/create_github_issue.py \
  --title "[DB] Create tax_slabs migration" \
  --body "..." \
  --labels "db,epic:tax-engine,priority:critical,sprint:1" \
  --milestone "Sprint 1 — Tax Engine"
```

## Next Steps
→ Create feature branch → `/implement #N`

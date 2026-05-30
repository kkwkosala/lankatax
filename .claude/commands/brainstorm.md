# /brainstorm

You are acting as the **Feature Brainstorm Agent**. Evaluate multiple implementation approaches before any design or code begins.

## When to Use
After requirement approval. Output must be approved before `/design`.

## Steps

1. Read the structured requirement document
2. Generate 2–3 distinct implementation approaches
3. For each approach evaluate:
   - Angular / Edge Function / DB impact
   - Tax engine impact (if applicable)
   - Pros, Cons, Effort (S/M/L/XL)
4. Recommend the best approach with rationale
5. Identify risks and mitigations

## Output

```markdown
## Brainstorm: [Feature Name]
**Requirement ref:** docs/requirements/[name].md
**Date:** YYYY-MM-DD

### Approach 1: [Name]
**Description:** ...
**Angular impact:** ...
**Edge Function impact:** ...
**DB impact:** ...
**Tax engine impact:** ...
**Pros:** ...
**Cons:** ...
**Effort:** S / M / L / XL

### Approach 2: [Name]
...

### Recommended Approach: [Name]
**Rationale:** ...
**Risks:** ...
**Mitigation:** ...
```

## Next Steps
→ On approval: `/design` with chosen approach

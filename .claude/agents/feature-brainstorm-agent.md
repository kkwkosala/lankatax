# feature-brainstorm-agent

## Role
Innovation Lead — evaluates multiple implementation approaches for a requirement, weighing technical trade-offs before any design or code is written.

## When to Use
After a requirement is approved. Run before `/design`. Output must be approved before architecture work begins.

## Steps to Follow

### 1. Understand the Requirement
Read the structured requirement document. Identify:
- Core problem to solve
- Tax domain constraints (if applicable)
- Performance / security / accuracy requirements

### 2. Generate 2–3 Distinct Approaches
For each approach, evaluate:
- **Approach name** — short descriptive label
- **Description** — how it works
- **Angular impact** — which NX libs affected, component changes
- **Edge Function impact** — new/modified functions, complexity
- **DB impact** — schema changes, migrations, RLS changes
- **Tax engine impact** — does this change calculation logic? How?
- **Pros** — benefits
- **Cons** — risks, limitations
- **Effort** — S / M / L / XL (story points estimate)

### 3. Recommend One Approach
Select the approach that best balances:
- Correctness (tax accuracy above all)
- Maintainability (tax rules must be updatable without code changes)
- Security (user data isolation)
- Development speed
- Future extensibility

### 4. Identify Risks
List any risks specific to the recommended approach.

## Output Format

```markdown
## Brainstorm: [Feature Name]
**Requirement ref:** [link to requirement doc]
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

### Approach 3: [Name] *(optional)*
...

### Recommended Approach: [Name]
**Rationale:** [Why this is the best choice for LankaTax]
**Risks:** ...
**Mitigation:** ...
```

## Next Steps
1. Present to stakeholder for approval
2. On approval: run `/design` with the chosen approach

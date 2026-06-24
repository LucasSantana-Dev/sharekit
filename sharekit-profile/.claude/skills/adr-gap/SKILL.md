---
name: adr-gap
description: 'Scan recent git history and open issues to find architectural decisions that were made without a corresponding ADR. Use when auditing documentation coverage or before a release. Triggers: "adr gap", "missing adrs", "undocumented decisions", "adr coverage", "find undocumented decisions".'
metadata:
  owner: global-agents
  tier: ephemeral
---

# ADR Gap

Find decisions that were made but never documented.

## Workflow

1. **Index existing ADRs** — read titles and dates from `docs/decisions/` (or `docs/adr/`, `adr/`)

2. **Scan recent commits** (last 60 days) for decision signals:
   ```bash
   git log --since="60 days ago" --oneline | grep -iE "add|remove|replace|migrate|switch|adopt|drop|move|deprecate"
   ```

3. **Identify structural changes** — commits that changed:
   - Dependencies added/removed (lock file changes)
   - Schema migrations
   - Configuration changes to CI, deployment, or infrastructure
   - New packages or directories indicating new architectural boundaries

4. **Cross-reference** — for each structural change, find the matching ADR by date and subject. Flag those with no match.

5. **Scan open issues** — find issues labeled `architecture`, `decision`, `rfc`, or similar that were closed without an ADR.

## Output

```
ADR Gap Report
──────────────
Existing ADRs: N (latest: YYYY-MM-DD)

Missing ADRs:
  - [commit SHA] YYYY-MM-DD: "add prisma as ORM" — no ADR found
  - [commit SHA] YYYY-MM-DD: "switch from jest to vitest" — no ADR found

Suggested ADR titles:
  - YYYY-MM-DD-<slug>.md: "Adopt Prisma as ORM"
  - YYYY-MM-DD-<slug>.md: "Switch to Vitest"
```

## Rules

- Only flag decisions with architectural scope — dependency bumps for minor versions don't need ADRs
- If git history is unclear, surface for human judgment rather than guessing
- Don't create ADRs automatically — output the gap list and let the human decide which to write

---
name: merge-confidently
description: |
  Composite skill — one-call answer to "merge this?", "ship this?", "ready for merge?". 
  Chains: pr-merge-readiness (verdict) → ci-watch/gh-fix-ci/gh-address-comments (resolve 
  blockers) → ship (when MERGE). Automates waits and fixes; halts at human-only gates 
  (another person's review, branch protection override, env access).
user-invocable: true
auto-invoke: merge-requests + pr-completion-claims
metadata:
  owner: global-agents
  tier: contextual
  canonical_source: ~/.claude/skills/merge-confidently
---

# Merge Confidently

One-workflow answer to "is this PR ready to merge?" Resolves waits and blockers; 
stops at human-only gates.

## Triggers

Use when: user asks "merge this", "ship this", "ready?"; after commit-push-pr; when 
PR is open >24h.

## Workflow

### Phase 1 — Combined verdict (always)

Invoke `/pr-merge-readiness` for the 8-signal aggregate verdict (8 signals; verdict: MERGE/WAIT/FIX).

Done when: verdict returned. Drives remaining phases:
- **MERGE** → Phase 5 (ship)
- **WAIT** → Phase 2 (resolve waits)
- **FIX** → Phase 3 (resolve blockers)

### Phase 2 — Resolve waits (if WAIT)

For each WAIT signal, resolve in parallel (same message) when independent:
- CI in progress → invoke `/ci-watch` until all checks pass
- CodeRabbit/Greptile suggestions → invoke `/gh-address-comments` 
- Branch behind base → rebase or merge base in
- Awaiting review → notify reviewers (signal only; stop, escalate to user for decision)

Done when: all resolvable waits cleared. Re-invoke `/pr-merge-readiness`. 
If still WAIT after 2 cycles: surface blocker + escalate to user.

### Phase 3 — Resolve blockers (if FIX)

For each FAIL signal, resolve in parallel (same message) when independent:
- CI failure → invoke `/gh-fix-ci` (autonomous fix attempt)
- CHANGES_REQUESTED review → invoke `/gh-address-comments`
- Conflicts → rebase, resolve, push
- Branch protection override needed → STOP; surface blocker, escalate to user

Done when: all fixable blockers resolved. Re-invoke `/pr-merge-readiness`. 
Loop max 3 times; if still FIX: escalate full blocker list to user.

### Phase 4 — Re-verify (if Phase 2 or 3 ran)

Re-invoke `/pr-merge-readiness`. 

Done when: verdict is MERGE. If FIX/WAIT: loop back to Phase 2/3, or escalate.

### Phase 5 — Ship (when verdict is MERGE)

Invoke `/ship`. Handles version bump / changelog / tag / merge / post-merge verification.

Done when: merge successful, SHA + tag logged.

HARD CONSTRAINT (per CLAUDE.md): Never invoke `ship` if another person authored this 
PR or has active comments on it. If detected: halt, surface as blocker, escalate to user.

### Phase 6 — Cleanup (always after merge)

Delete merged branch (if not auto-deleted by GitHub). Invoke `/commit-commands:clean_gone` 
if multiple stale local branches exist.

Done when: branch deleted, stale branches cleaned (if applicable).

## Output / Evidence

Signal-first verdict + per-phase log:

```
[OK] MERGE CONFIDENTLY — PR #<n> "<title>"
   Verdict: MERGE ✓
   Phase 1: pr-merge-readiness → 6 green, 2 yellow (CI in progress)
   Phase 2: ci-watch → green; gh-address-comments → 3 suggestions resolved
   Phase 4: re-verdict → MERGE ✓
   Phase 5: ship → merged at <SHA>; v<X.Y.Z> tagged
   Phase 6: cleanup → branch deleted
   
   Log: <merge-log-path> | (task ongoing)
```

## Stop Conditions (escalate to user)

- Another person authored this PR or has active review comments → HALT (hard rule; 
  see CLAUDE.md §1)
- After 3 fix cycles still FIX → full blocker list + escalate
- After 2 wait cycles still WAIT → likely human-gated (review, access, staffing) + 
  escalate
- Branch protection override needed → surface blocker, halt
- Never invoke `ship` without `pr-merge-readiness` returning MERGE (enforce in Phase 5)

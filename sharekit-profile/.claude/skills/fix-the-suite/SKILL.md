---
name: fix-the-suite
description: |
  Composite skill — repair and validate a test suite end-to-end when: suite is bloated
  (test count >2× proportionality), slow (runtime >5 min), or cleanup previously stalled
  at coverage gate. Chains: diagnose → gate-check → prune+replace → validate → capture.
  Use when user reports "tests are slow", "too many tests", "test cleanup didn't work",
  or test-cleanup skill exits with "out of scope / needs further work."
user-invocable: true
auto-invoke: bloated-suite + slow-suite + test-failure-clusters
metadata:
  owner: global-agents
  tier: contextual
  canonical_source: ~/.claude/skills/fix-the-suite
---

# Fix The Suite

Replaces repetitive clean-up passes (each deleting 16 tests then hitting gate conflicts)
with a single orchestrated workflow. Runs all phases in order; stops explicitly on
blocker, never silently falls back.

## When to invoke

- Suite test count >2× proportionality target (see `standards/testing.md §2.1`)
- Runtime >5 minutes
- Mutation score <60% on critical modules after cleanup
- `test-cleanup` exits with "out of scope" or "needs further work" (restarts the full cycle)
- User says "tests are slow", "too many tests", "test cleanup stalled"

## Related standards & auto-chains

- `standards/testing.md §2–3` — test proportionality targets, gate thresholds
- After Phase 5 (if ADR written): auto-chain `docs-sync` in Phase 6 (no skip)
- If Phase 4 collapses: revert to Phase 2 (no silent fallback; surface blocker as output)
- `standards/durable-execution.md §3` — idempotency check before Phase 1 (is suite already green?)

## Workflow

**Pre-flight:** Mount check — if `/Volumes/External HD` unmounted, RAG queries degrade;
note and proceed with `/config-drift-detect` grep-only fallback mode.

### Phase 1 — Diagnose
**Invoke:** `test-health` (full suite audit: count, coverage, runtime, dead weight,
mocked-SUT count, flake estimate).

**Done when:** Report shows: test count, % vs proportionality target, coverage %, runtime (sec),
slowest N tests, mutation-ready files.

**Stop if:** Verdict is HEALTHY (count + coverage + runtime within targets) → exit; nothing to fix.

### Phase 2 — Gate compatibility check
**Invoke:** `config-drift-detect` scoped to test config only (jest/vitest coverage thresholds,
skipped-test policy).

**Done when:** Conflict list (if any) is surfaced + resolution chosen by user:
- (A) Lower gate to actual coverage, record why
- (B) Exclude low-value files, record exclusion  
- (C) Commit to integration-test backfill, document scope
- (D) No conflict → proceed to Phase 3

**Stop if:** User rejects all options A–D → "Suite cannot be efficiently cleaned
without one of: lower gate / exclude files / integration backfill. Blocked until
resolution chosen."

**Critical guard:** Do NOT skip to Phase 3 if a CRITICAL conflict exists (e.g.,
99% coverage gate on 3k-LOC app, 20% actual). Enforce user choice first.

### Phase 3 — Prune + replace
**Invoke:** `test-cleanup` with Phase 2 resolution recorded.

**Done when:** Report shows: test count before/after, runtime before/after, coverage
maintained at ≥baseline, new integration tests written, consolidation summary.

**Guard:** Never delete a test to go green. If deletions would drop coverage below
baseline, `test-cleanup` will halt; loop back to Phase 2 to adjust gate or add
integration tests.

### Phase 4 — Validate survivors
**Invoke:** `mutation-test` on changed files (Phase 3 modified set).

**Done when:** Mutation score ≥60% on critical modules, kill ratio >80%.

**Stop if:** Score <40% after cleanup → deletions removed real protection; revert
Phase 3 and resume from Phase 2 with modified strategy (add more integration tests
before deleting unit tests).

### Phase 5 — Capture (if Phase 2 changed gates)
**Invoke:** `adr-write` to record:
- The gate change (if any), platform, and rationale
- Cleanup outcome (tests removed, runtime gained, coverage hold reason)
- Proportionality reasoning (target vs. actual, app type context)

**Done when:** ADR committed and linked in handoff.

**Skip if:** No gate change in Phase 2 (resolution was (D) or (B) only).

### Phase 6 — Sync
**Invoke:** `docs-sync` to mirror any modified standards/skills to `~/.claude/`
and `~/.agents/`.

**Done when:** Sync reports no conflicts or all conflicts resolved.

## Stop / Failure Conditions

- **Phase 1 HEALTHY:** Suite already meets targets (count + runtime + coverage) → exit
- **Phase 2 unresolved:** User rejects all gate-change options (A–D) → surface blocker,
  halt, wait for user resolution
- **Phase 2 CRITICAL conflict:** Gate threshold >actual coverage by >40pp → enforce Phase 2
  halt; do not proceed to Phase 3 without resolution
- **Phase 4 collapse:** Mutation score <40% after cleanup → revert Phase 3 deletions;
  the cleanup removed real protection; resume Phase 2 with integration-test-first strategy
- **External HD unmounted:** Mount check fails → note that RAG queries will use grep-only
  fallback; proceed

## Outputs / Evidence

**Phase 1:** test-health report (before state)

**Phase 2:** config-drift verdict + chosen resolution (A/B/C/D)

**Phase 3:** test-cleanup report (count before/after, runtime, coverage hold proof)

**Phase 4:** mutation-test score + kill ratio on changed files

**Phase 5 (if applicable):** ADR path + commit hash

**Phase 6:** docs-sync reconciliation (conflicts resolved or none)

**Reconciliation (signal-first):**
```
FIX THE SUITE — <repo>

Diagnose:     tests=N coverage=X% runtime=Ts → BLOATED
Gates:        <conflict | none> → resolution=(A|B|C|D) → STATUS
Cleanup:      N → M tests (−X%), runtime −Y%, coverage maintained ≥X% → STATUS
Mutation:     score Z% on changed files, kill-ratio >K% → STATUS
Capture:      ADR=<path> (if gate changed) | (none) → STATUS

Snapshot: <path to handoff or cleanup report; (none — task ongoing) if paused>
```

If >3 findings beyond the top line, note "Ask for full cleanup report" and gate bulk
detail to reference file or user request.

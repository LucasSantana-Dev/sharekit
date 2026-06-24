---
name: test-sweep
description: 'Composite skill — three-phase test quality pipeline. Chains test-health (assess state) → test-cleanup (remove redundant/brittle tests) → mutation-test (validate surviving suite). Stops if Phase 1 shows no gaps, or if Phase 2 would remove >30% of tests. Use when improving test suite quality end-to-end. Triggers: "test sweep", "clean up tests end-to-end", "improve test quality", "test quality pipeline", "full test pass".'
user-invocable: true
auto-invoke: 'test-quality-improvement-requests'
metadata:
  owner: global-agents
  tier: contextual
---

# Test Sweep

End-to-end test quality: assess → clean → validate.

## Auto-invocation triggers

- User asks to "improve test quality", "clean up the test suite", "run a full test pass"
- After `audit-deep` flags HIGH test debt or >20% skip rate
- Before a major release to verify suite reliability

## Workflow

### Phase 1 — Health Assessment (always)

Invoke `test-health` on the target scope.

Output: test count, coverage %, flaky count, skip count, runtime, identified gaps.

**Proceed:** if health report reveals gaps (coverage below threshold, flaky tests, excessive skips, redundant tests).
**Stop:** if suite is healthy with no gaps → emit "Phase 1: suite healthy — no cleanup needed. Stopping." Do not invoke cleanup.

### Phase 2 — Cleanup

Invoke `test-cleanup` with Phase 1 gap list as input.

Output: list of removed/modified tests with rationale; updated test count and coverage delta.

**Proceed:** if proposed removal ≤ 30% of current test count.
**Stop:** if proposed removal > 30% → emit "Phase 2 blocked: removal would exceed 30% threshold (N tests). Surface for human review." Do NOT proceed to mutation-test.

### Phase 3 — Mutation Validation

Invoke `mutation-test` on the post-cleanup suite.

Output: mutation score, surviving mutants (coverage gaps), killed mutants.

**Done when:** mutation report delivered. Score < 60% → note surviving mutants as follow-up work, do not block.

## Reconciliation

```
TEST SWEEP — <scope>
  Phase 1 Health:    <pass | N gaps found>
  Phase 2 Cleanup:   <N tests removed | skipped (healthy) | blocked (>30%)>
  Phase 3 Mutation:  <score: X% | skipped | unavailable>

Net: -N tests, coverage Δ±X%, mutation score Y%
Follow-up: <none | N surviving mutants to cover | human review>
```

## Failure / Stop Conditions

- Phase 1 healthy → stop at Phase 1 (correct behavior, not a failure)
- Phase 2 removal > 30% → surface blocker, wait for human decision before continuing
- Phase 3 unavailable (no mutation runner configured) → note in reconciliation, mark as "unavailable" not "failed"
- Never invoke Phase 3 if Phase 2 was blocked

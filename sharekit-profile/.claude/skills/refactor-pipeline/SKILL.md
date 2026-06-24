---
name: refactor-pipeline
description: "Composite: end-to-end refactor with plan, parallel 3-agent implementation, test cleanup, ADR capture, and sync. Use when: (1) scope >5 files or cross-module boundaries; (2) user says 'rewrite / redesign module / extract / consolidate'; (3) audit-deep flagged HIGH structural issue; (4) improve-codebase-architecture recommends deepening."
user-invocable: true
auto-invoke: refactor-requests-with-cross-file-scope
metadata:
  owner: global-agents
  tier: contextual
---

# Refactor Pipeline

Orchestrates multi-phase refactors with rollback, parallel review, post-refactor
cleanup, and durable record. Chains: refactor-plan → three-man-team (parallel) →
fix-the-suite → adr-write → docs-sync.

**Composite contract:** Do not run sub-skills manually; invoke this skill once—it
chains internally. See `standards/composite-contract.md`.

## Workflow

### Phase 0 — RAG Pre-flight (always, read-only)

Before proposing a refactor, check whether this module was recently refactored or if a prior refactor plan already exists.

**Step 0a — Mount guard:**
```bash
mount | grep -q "${EXTERNAL_HD}" || {
  echo "WARN: external drive unmounted — RAG unreachable; falling back to local discovery only"
  export RAG_AVAILABLE=false
}
```

**Step 0b — Query RAG for prior refactor context:**
```bash
python3 ~/.claude/rag-index/query.py "refactor $(basename $(pwd)) prior plan ADR module boundaries" \
  --top 3 --scope memory --format json > /tmp/refactor-prior-<run-id>.json 2>/dev/null || true
```

**Step 0c — Skip-if-fresh gate:**
- If a prior refactor ADR exists with `created_at` < 14 days ago AND no new complexity signals since → present prior plan summary to user and ask: "This module was refactored recently. Re-plan from scratch, or build on the prior plan?"
  - On "build on prior" → load prior scope, load prior ADR into Phase 1 context, continue to Phase 1 with priors loaded.
  - On "re-plan" → continue to Phase 1 fresh.
- If no prior ADR or ADR is ≥ 14 days old → continue to Phase 1.

**Step 0d — Load stability signals:**
- Extract any "stable boundaries" or "don't refactor" notes from prior ADRs or module comments.
- Store them as `protected_scopes[]` so Phase 1.5 (critic) can flag if plan encroaches.

**Output feeds:** `rag_available` flag, `prior_plan_summary` (or null), `protected_scopes[]`.

**Stop condition:** If not in a git repo → abort entirely. Reconcile: `Pre-flight: (failed: not a git repo)`.

### Phase 1 — Plan + rollback

Invoke `refactor-plan`. Output: phased sequence with rollback per phase + effort estimate.

**Done when:** All phases estimated ≤2 days cumulative.

**STOP if:** Estimate >2 days → recommend smaller sub-refactors. Halt; do not continue.

### Phase 1.5 — Critic gate (read-only, conditional)

Before launching parallel execution, spawn a single read-only critic agent (`agentType: "critic"`) to challenge the refactor plan on three dimensions:

**Critic prompt (challenge scope):**
- "Is the scope too broad for one cycle? Would breaking it into 2 sub-refactors be safer?"
- "Does this touch stable code marked 'don't refactor' in prior decisions? If so, surface it as scope creep."
- "Are there missing test fixtures that would make this unsafe? Which API surfaces lack coverage?"
- "Does the plan avoid ripple effects into unrelated modules? Flag any hidden dependencies."

Critic output is a `scope_verdict` (proceed / revise-scope / revise-testing / revise-plan) + optional `critic_note` string.

**Rules:**
- Critic can flag concerns and suggest revision; it CANNOT remove plan phases unilaterally.
- If verdict == "proceed" → continue to Phase 2.
- If verdict == "revise-*" AND user accepts concern → STOP and halt the composite. Return Phase 1.5 verdict + critic note to user; wait for user to invoke `refactor-plan` again with revised scope.
- If verdict == "revise-*" AND user overrides with explicit "proceed anyway" → continue to Phase 2 with note.
- Critic must complete before Phase 2 begins.
- If critic is unavailable (no subagents), skip this phase with `(skipped: no subagent capability)`.

**Output feeds:** `scope_verdict`, `critic_note`, proceed/revise decision.

### Phase 2 — Parallel execution

Invoke `three-man-team` with plan. Launch agents in single message:
- Architect (Opus): reads codebase, refines plan against reality
- Builder (Sonnet): implements + commits per phase boundary
- Reviewer (Sonnet): validates phase against plan + runs tests

Reviewer waits for builder per phase.

**Done when:** All phases committed, reviewer approves each + tests green.

**STOP if:** Reviewer rejects 2 consecutive phases → plan needs revision. Halt; return to Phase 1.

### Phase 2.5 — Two-stage review (read-only, parallel subagents)

When parallel phase-by-phase execution completes, run two-stage review before advancing to test cleanup:

**Stage 1 — Spec compliance (agentType: "code-reviewer"):**
- Does each refactored section match the plan specification?
- Are the commit messages clear + tied to plan phases?
- Did the implementation avoid scope creep (no surprise changes outside the plan)?

Output: compliance verdict (match / partial / drift) + specific line-number findings per file.

**Stage 2 — Code quality (agentType: "critic"):**
- Did the refactored code improve on the original (clarity, test surface, complexity reduction)?
- Are there performance regressions? New tech-debt patterns?
- Would a maintainer unfamiliar with the old code understand the changes?

Output: quality verdict (improved / neutral / regressed) + specific recommendations.

**Integration:**
- If either stage flags "drift" or "regressed" → surface both verdicts to user + ask: "Proceed to test cleanup, or request Phase 2 revision?"
- If both pass → continue to Phase 3.
- If user requests revision → STOP and return control to Phase 2 (rebuild, don't fork).

**Output feeds:** compliance verdict, quality verdict, proceed/revise decision.

### Phase 3 — Post-refactor test cleanup

Invoke `fix-the-suite`. Refactors leave stale tests (wrong mocks, dropped coverage, API mismatches).

**Done when:** Coverage maintained or improved; integration tests pass with new API.

**STOP if:** Coverage drops >5% and user does not accept with rationale → revert Phase 2 commits.

### Phase 4 — Capture (mandatory)

Invoke `adr-write`. Record: what, why (structural issue), alternatives, consequences, revisit trigger.

**Done when:** ADR merged into decision record. No refactor ships without rationale artifact.

### Phase 5 — Sync + ship

Invoke `docs-sync` (if standards/skills changed), then `merge-confidently` to ship through gates.

**Done when:** PR merged, downstream synced.

## Reconciliation (signal-first)

```
REFACTOR PIPELINE — <module>
Pre-flight:      RAG <available|unavailable>; prior plan <date|none>; <N> protected scopes loaded
Phase 1 Plan:    ✓ / ✗ BLOCKED <reason>
Phase 1.5 Gate:  ✓ proceed / ✗ REVISE <scope_verdict>
Phase 2 Execute: ✓ / ✗ BLOCKED <reason>
Phase 2.5 Review:✓ <spec:match, quality:improved> / ✗ REVISE <verdict>
Phase 3 Test:    ✓ / ✗ Coverage drop >5%
Phase 4 ADR:     ADR-NNNN
Phase 5 Shipped: PR #N merged
```

## Hard rules (composite-contract.md compliance)

- Do not run sub-skills manually. Invoke this composite once; it chains internally.
- **Phase 0 RAG pre-flight runs first:** always check for prior refactors before proposing scope.
- **Phase 1.5 critic gate is mandatory:** no execution begins without scope challenge. If critic flags "revise-*" → STOP and return verdict to user; do not auto-override.
- **Phase 2.5 two-stage review is mandatory:** all parallel execution must pass spec-compliance + code-quality gates before test cleanup.
- Never skip Phase 4 (ADR). No rationale = revert.
- Coverage gate (Phase 3) is mandatory. Drops >5% require explicit user acceptance.
- Each phase must complete or surface blocker as reconciliation output. Do not silently
  switch skills or skip phases.
- Protected scopes (marked "don't refactor" in prior ADRs) must be honored. Plan encroachment = Phase 1.5 halt.
- Two-stage review verdicts (spec-compliance, code-quality) are advisory but heavyweight: drift/regressed findings surface to user with proceed/revise choice before test cleanup.

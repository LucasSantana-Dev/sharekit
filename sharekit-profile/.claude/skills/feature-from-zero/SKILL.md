---
name: feature-from-zero
description: |
  Mega-composite for end-to-end greenfield feature: idea → ADR → plan → implement → test → merge → deploy → capture.
  
  Chains: research-and-decide → scope-and-execute → design-build (if UI) → test-health → fix-the-suite (if tests need work) → merge-confidently → ship-it → knowledge-loop.
  
  Invoke when: "build feature X end-to-end", "implement Y start-to-finish", "ship new feature from spec".
user-invocable: true
auto-invoke: greenfield-feature-requests + spec-to-prod-workflows
metadata:
  owner: global-agents
  tier: contextual
---

# Feature From Zero

Mega-composite for the largest natural unit of work: an entire feature, from "we should build X" to "live in prod, decision captured." Chains 8 phases (7 composites + knowledge-loop) with checkpoints and mandatory stop conditions.

## When to use

Use when **starting a greenfield feature from scratch** and you'll own it end-to-end (idea → live, decision → capture).

Skip for: small fixes, single-phase refactors, or isolated sub-tasks — use `scope-and-execute` or `refactor-pipeline` instead.

## Workflow

### Phase 1 — Decide (always for greenfield)

**Invoke `research-and-decide`**, which internally (a) runs the mount-guarded RAG prior-decision pre-check — surfaces precedent so you don't re-litigate a settled choice, (b) validates the feature is worth building (vs alternatives, vs deferring), (c) decides the approach (library choice, pattern, integration points), (d) captures rationale in an ADR. Do not duplicate the RAG query here — `research-and-decide` owns it (its Phase 1a, mount-guarded per `standards/knowledge-brain.md §1`).

**Done when:** ADR written and decision is either (a) "build" → proceed to Phase 2, or (b) "defer/don't build" → stop here; ADR explains why.

### Phase 2 — Scope + plan (always)

Invoke `scope-and-execute` (phases 1–3):
- Phase 1: repo intake + constraints
- Phase 2: context-pack (affected files, dependencies, surfaces)
- Phase 3: draft plan with phased steps, per-phase validation gates

Present plan to user for review.

**Done when:** Plan approved by user. If rejected: loop back with feedback (max 3 iterations; after 3, escalate scope as too-fluid).

### Phase 3 — Implement (always)

Invoke `scope-and-execute` Phase 4 (execute), dispatching by work structure:
- **Independent tracks** (≥2): dispatch parallel sub-agents in a single message, each with its own worktree under `${WORKTREES_ROOT}/`. See `standards/workflow.md` parallel-execution rule.
- **Sequential phases**: loop compositely; parallel sub-tasks within each phase.
- **Complex multi-phase** (≥3 tightly-coupled phases): three-man-team.

Per-phase commits with validation gates. Follow the Phase 2 plan strictly.

**Done when:** All plan phases complete with validation gates passing; feature integrated into base branch.

### Phase 4 — UI build (conditional)

**Only if Phase 3 produced UI artifacts** (new components, pages, layouts).

If yes: invoke `design-build`:
- Audit design system (web-design-guidelines, impeccable, or reference brand)
- Scaffold + component build
- Verify (webapp-testing: a11y, console, breakpoints)

**Done when:** UI verified across breakpoints and accessibility gates passing. Else: skip (no new UI).

### Phase 5 — Test suite health (always)

Invoke `test-health`. Verdict:
- **HEALTHY**: skip to Phase 6
- **Anything else** (bloated, slow, failing): invoke `fix-the-suite` before proceeding

This prevents shipping a feature that degrades test suite state.

**Done when:** `test-health` verdict is HEALTHY.

### Phase 6 — Ship to merge (always)

Invoke `merge-confidently`:
- PR readiness verdict (review, CI, linked issues)
- Resolve WAIT / FIX feedback loops
- Merge through gates

**Done when:** PR merged to main/base branch.

### Phase 7 — Ship to prod (always for production-bound work)

Invoke `ship-it`:
- Version bump + changelog
- Tag + GitHub release
- Deploy via correct deployer (Vercel, Cloudflare, etc.)
- Post-deploy verification (smoke tests, Sentry scan)

**Stop condition:** If Phase 4 detects new Sentry issues → escalate to `incident-response` (do NOT auto-rollback).

**Done when:** Deployed to production and post-deploy smoke tests passing.

### Phase 8 — Capture (always — mandatory, most-skipped in practice)

Invoke `knowledge-loop`:
- Sync outcome to memory (feature description, phase timings, blockers, lessons)
- Index into RAG (via handoff or commit) for future search
- Write handoff if session ending

**Hard rule:** Never skip. Prior features lose decision context when capture is omitted.

**Done when:** Feature outcome committed to memory + RAG indexed + handoff written (if session-ending).

## Reconciliation

Signal-first summary: phase status + top-level metrics.

See `references/reconciliation-template.md` for the output format: phase verdicts, commit count, timing, snapshot, open watches.

Artifacts:
- Phase 1: ADR
- Phase 2: plan document
- Phase 3: commits (feature branch)
- Phase 4: UI audit output (or "skipped")
- Phase 5: test-health verdict + fix-the-suite log (if applied)
- Phase 6: merged PR
- Phase 7: GitHub release + deploy proof
- Phase 8: memory entry + handoff (if session-ending)

## Stop Conditions (surface blocker, halt)

- **Phase 1**: Decision is "don't build" or "defer" → exit clean with ADR explaining why; feature-from-zero concludes.
- **Phase 2**: Plan rejected by user → loop back with feedback (max 3 iterations); after 3, escalate scope as too-fluid.
- **Phase 3**: Implementation blocker not in plan → re-plan (Phase 2) before continuing; do NOT improvise past the plan.
- **Phase 7**: Deploy fails or post-deploy errors detected → STOP, escalate to `incident-response`; do NOT auto-rollback.
- **Phase 8**: Mandatory. Never skip capture even if time-pressed — decision context is lost when omitted.

## Discovery & Handoff

**Before Phase 1:** Query RAG/memory for prior feature decisions related to this scope (see Phase 1 RAG step above).

**After Phase 8:** Write feature outcome to memory with all phase artifacts and timings. Trend analysis reveals bottlenecks (e.g., "Phase 5 fix-the-suite consistently takes 2× estimate"). Index via `knowledge-loop` for next-session RAG search.

Reference: `standards/knowledge-brain.md §1` (RAG mount guard); `recall/SKILL.md` (all four discovery patterns).

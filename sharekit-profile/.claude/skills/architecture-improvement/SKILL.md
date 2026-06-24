---
name: architecture-improvement
description: |
  Composite skill — audit and deepen codebase architecture in one orchestrated workflow.
  Chains: coupling-map → orphan-hunt → improve-codebase-architecture → domain-modeling → adr-write.
  Use when: (1) planning a refactor, (2) evaluating architectural health, (3) user says
  "improve architecture", "reduce coupling", "find dead code", "audit architecture",
  (4) audit-deep flagged architectural friction, (5) need to sharpen domain language
  alongside structural changes.
user-invocable: true
auto-invoke: architecture-audit-requests + refactoring-research + structural-debt-signals
metadata:
  owner: global-agents
  tier: contextual
---

# Architecture Improvement

Map coupling, find orphans, deepen modules, sharpen domain language, and record decisions—all in one workflow. Stops at clear stopping points; does not auto-execute code changes (those are the user's call or a separate `/refactor-pipeline` invocation).

**Composite contract:** Do not run sub-skills manually; invoke this skill once—it chains internally. See `standards/composite-contract.md`.

## When to invoke

- Planning a refactor and need coupling context first
- Evaluating whether a codebase is testable or deeply-structured
- User says "improve architecture", "reduce coupling", "architecture audit", "find refactoring opportunities", "find dead code"
- `audit-deep` surfaced HIGH coupling or shallow modules
- Need to sharpen domain terminology while restructuring

## Related standards & auto-chains

- `standards/code-standards.md §3` — module depth and interface design
- `standards/durable-execution.md §3` — idempotency check (is codebase state stable before audit?)
- After Phase 5 (if ADR written): auto-chain `/docs-sync` to mirror to `~/.claude/` and `~/.agents/`
- If any phase is blocked by external drive unmounted: mount check (CLAUDE.md §1)

## Workflow

### Phase 0 — RAG Pre-flight (always, read-only)

Before spending tokens on architectural analysis, check whether a recent assessment already exists.

**Step 0a — Mount guard:**
```bash
mount | grep -q "${EXTERNAL_HD}" || {
  echo "WARN: external drive unmounted — RAG/vault unreachable; falling back to grep-only discovery"
  export RAG_AVAILABLE=false
}
```

**Step 0b — Query RAG for prior architecture assessments:**
```bash
python3 ~/.claude/rag-index/query.py "architecture $(basename $(pwd)) coupling orphans domain model ADR decisions" \
  --top 3 --scope memory --format json > /tmp/arch-prior-<run-id>.json 2>/dev/null || true
```

**Step 0c — Skip-if-fresh gate:**
- If a prior architecture assessment exists with `created_at` < 30 days ago **and** no structural changes (new modules, major refactors) since then → present summary to user and ask: "Use cached architecture analysis, or re-run full audit?"
  - On "use cached" → jump to Phase 5 (record decisions based on prior findings), skip Phases 1–4.
  - On "re-run" → continue to Phase 1.
- If no prior assessment or assessment is ≥ 30 days old → continue to Phase 1.

**Step 0d — Load prior ADRs:**
- Extract any ADRs from `docs/adr/` that relate to architecture decisions (coupling, module depth, domain language).
- Store as `prior_adrs[]` so Phases 3–5 do not re-propose already-decided changes.

**Output feeds:** `deferred_findings[]` (skipped from prior run), `rag_available` flag, `prior_assessment_summary` (or null), `prior_adrs[]`.

**Stop condition:** If not in a git repo → abort entirely. Reconcile: `Pre-flight: (failed: not a git repo)`.

---

**Pre-flight continued:** Mount check — if `${EXTERNAL_HD}` unmounted, RAG queries degrade; note and proceed with grep-only fallback. The skill is read-only until Phase 5 (recommendations are non-binding).

### Phase 1 — Map coupling (read-only discovery)

**Invoke:** `coupling-map` with `agentType: "Explore"` (build import graph, calculate fan-in/fan-out, find cycles, identify hotspots).

Explore agent cannot write files; this ensures coupling analysis is purely observational.

**Done when:** Report shows: high fan-in modules (most depended-on), high fan-out modules (most dependencies), cycles detected, coupling hotspots (appear in both lists).

**Stop if:** Codebase shows no notable hotspots, no cycles, and all fan-in/fan-out within moderate bounds (no module >2σ above mean) → proceed to Phase 2 but note "clean import graph" in final reconciliation. Do not exit; continue to find other issues.

### Phase 2 — Hunt orphans (read-only discovery)

**Invoke:** `orphan-hunt` with `agentType: "Explore"` (scan for dead code: orphaned files, unused exports, unused dependencies, dangling references).

Explore agent cannot write files; this ensures orphan analysis does not accidentally delete code.

**Done when:** Report categorizes: orphaned files (safe to delete), unused exports (verify before removing), unused dependencies, dangling references.

**Stop if:** No orphans found → note "no dead code detected" in final reconciliation. Proceed to Phase 3 (coupling + cleanliness confirmed).

**Guard:** Do not delete anything in this phase. Orphan-hunt is report-only; deletion is user decision (or a separate refactor phase).

### Phase 3 — Find deepening opportunities (read-only discovery)

**Invoke:** `improve-codebase-architecture` with `agentType: "Explore"` (explore friction points, apply deletion test, surface candidates for deepening — turning shallow modules into deep ones).

Explore agent cannot write files; analysis is observational only.

**Done when:** Ranked list of deepening opportunities: files involved, problem statement, solution, benefits (locality + leverage + test improvement). Candidates ordered by impact.

**Stop if:** No candidates found → note "architecture is already well-structured for current scale" in final reconciliation. Proceed to Phase 4 (domain language sharpening).

**Guard:** Do NOT propose interfaces or refactor yet. Phase 3 is discovery; Phase 4 grounds language; Phase 5 records decisions. User gates code changes via a separate `/refactor-pipeline` invocation.

### Phase 4 — Sharpen domain model (read-only discovery)

**Invoke:** `domain-modeling` with `agentType: "Explore"` (read CONTEXT.md + ADRs, challenge glossary, sharpen fuzzy terms, identify new terminology from Phase 3 candidates).

Explore agent cannot write files; domain language observations are captured for Phase 5 ADR recording only.

**Done when:** CONTEXT.md (if present) reflects current language; any vague terms resolved; new terminology (from Phase 3 candidates) is identified. Do NOT update CONTEXT.md in this phase.

**Stop if:** No CONTEXT.md exists and no ambiguous terms surfaced → create CONTEXT.md only if Phase 5 produces an ADR that needs new domain vocabulary. Otherwise skip creation (lazily created when next needed).

**Side effect:** If Phase 3 candidates used new terms, capture them for Phase 5 ADR. If none, proceed.

---

### Phase 4.5 — Critic gate (read-only, conditional)

Spawn a single read-only critic agent (`agentType: "critic"`) to challenge the Phase 3 deepening candidates **before** any ADR or decision recording begins.

The critic evaluates:
- "Are the Phase 3 candidates actionable given current codebase state and team constraints?"
- "Do any Phase 3 proposals conflict with existing ADRs in `docs/adr/`?"
- "Is the evidence for each candidate strong enough to justify a structural change?"
- "Are all Phase 4 domain observations grounded in real usage/risk, or speculative?"

Critic output is a `confidence` score (high/medium/low) per candidate + optional `critic_note` string.

**Rules:**
- Critic can ADD a note or lower confidence; it CANNOT remove candidates or change priority order.
- If confidence=low AND critic_note includes "insufficient evidence", flag for user review before Phase 5; do NOT auto-drop.
- Critic must complete before Phase 5 begins.
- If critic is unavailable (no subagents), skip this phase with `(skipped: no subagent capability)`.

**Output feeds:** confidence scores + notes merged into candidates array for Phase 5 decision recording.

### Phase 5 — Record decisions (if any)

**Invoke:** `adr-write` only if:
- Phase 3 surfaced candidate(s) **and** Phase 4.5 critic gave high/medium confidence (not low with insufficient-evidence flag), **OR**
- Phase 4 resolved domain terminology that should be permanent (hard to reverse, surprising without context, result of real tradeoff)

**Before writing ADR:**
- Cross-check Phase 3 candidates against `prior_adrs[]` loaded in Phase 0. Do NOT re-propose changes already decided.
- If a candidate contradicts a prior ADR, flag this conflict explicitly in the ADR "Consequences" section.

**Done when:** ADR file written to `docs/adr/`, numbered, staged for commit. Includes decision title, context, alternatives, consequences, revisit trigger.

**Skip entirely if:** User did not select any Phase 3 candidates, Phase 4.5 critic flagged all with low confidence, and no Phase 4 terminology changes warrant recording. Output: "No decisions to record."

**Guard:** Do NOT commit the ADR. Stage files; let user include with their implementation commit (or next `/refactor-pipeline` run).

### Phase 6 — Sync (optional, if Phase 5 ran)

**Invoke:** `docs-sync` to mirror any modified standards/skills to `~/.claude/` and `~/.agents/` if CONTEXT.md or ADRs were updated.

**Done when:** Sync reports no conflicts or all conflicts resolved.

**Skip if:** Phase 5 was skipped (no ADR written). No sync needed.

## Stop / Failure Conditions

- **Phase 0 prior assessment exists and is fresh:** Ask user to choose "use cached" or "re-run" before continuing
- **Phase 1 clean import graph:** Proceed to Phase 2 regardless; coupling context is useful even if moderate
- **Phase 2 no orphans:** Proceed to Phase 3; cleanliness is a positive signal
- **Phase 3 no candidates:** Note in reconciliation; proceed to Phase 4 (domain language may still need sharpening)
- **Phase 4 no CONTEXT.md and no new terms:** Skip creation; create lazily when ADR is needed
- **Phase 4.5 critic unavailable:** Skip critic gate with `(skipped: no subagent capability)`; proceed to Phase 5 with unvetted candidates
- **Phase 4.5 critic flags all candidates as low confidence with insufficient evidence:** Surface critic feedback to user; ask proceed or abort Phase 5
- **Phase 5 candidate conflicts with prior ADR:** Note conflict in ADR "Consequences"; do not skip — decision is to update/supersede prior ADR
- **Phase 5 no user-approved candidates and no new terms:** Skip ADR writing entirely; output "No decisions to record"
- **external drive unmounted:** Mount check fails → note that RAG queries will use grep-only fallback; proceed
- **User halts mid-phase:** Surface where you stopped as the composite's output; resume at that phase next session

## Outputs / Evidence

**Phase 0:** RAG query results (prior assessment, deferred findings, prior ADRs) + mount status

**Phase 1:** coupling-map report (fan-in, fan-out, cycles, hotspots)

**Phase 2:** orphan-hunt report (categorized dead code findings)

**Phase 3:** deepening opportunities list + (if grilled) user-approved candidates

**Phase 4:** domain language observations (new terms identified, glossary gaps) — NOT written to files yet

**Phase 4.5:** critic scores per candidate + confidence ratings + conflict flags

**Phase 5 (if applicable):** ADR path + commit message suggestion; conflict resolutions noted

**Phase 6 (if Phase 5 ran):** docs-sync reconciliation (conflicts resolved or none)

## Reconciliation (signal-first)

```
ARCHITECTURE IMPROVEMENT — <repo>

Pre-flight:      RAG <available|unavailable>; prior assessment <date|none>; <N> deferred items loaded; <M> prior ADRs checked
Coupling:        hotspots=N cycles=M fan-in.max=X fan-out.max=Y → <FINDING> [OK] DONE
Orphans:         files=N exports=M deps=K dangling=L → <FINDING> [OK] DONE
Deepening:       candidates=N approved=K for grilling → <FINDING> [OK] DONE
Domain:          CONTEXT.md=<untouched> new-terms=N identified → <FINDING> [OK] DONE
Critic:          confidence scores applied | (skipped: <reason>) → [OK] DONE | [BLOCKED] SKIPPED
Decisions:       ADR=<path> (if approved) | (none due to critic) | (none) → [OK] DONE | [BLOCKED] DECLINED | [BLOCKED] SKIPPED
Sync:            conflicts=N (if applicable) | (skipped) → [OK] DONE | [BLOCKED] SKIPPED

Snapshot:        <relevant memory/handoff file, or (none)>
Open watch:      (none) | re-run if Phase 3 candidates were deferred or critic flagged low confidence
Next move:       <reference user to /refactor-pipeline for critic-approved candidates, or /handoff for checkpoint>
```

If >3 non-critical findings beyond the top line, note "Ask for full audit report" and gate bulk detail to reference file or user request.

## Key invariants

- **Phase 0 RAG pre-flight always runs first:** check prior assessments (< 30 days) and load existing ADRs before any discovery.
- **All discovery agents are read-only:** Phases 1–4 use `agentType: "Explore"` to prevent accidental mutations.
- **Critic gate gates Phase 5 decisions:** Phase 4.5 challenges candidates before ADR writing; no decisions without critic review.
- **Cross-check prior ADRs:** Phase 5 does not re-propose changes already decided; conflicts trigger updates, not new decisions.
- **No CONTEXT.md writes in Phase 4:** domain language is identified and fed to Phase 5 ADR; CONTEXT.md updated lazily when ADR is needed.
- **No code changes:** this composite is analysis + recommendations. Code refactoring is gated to `/refactor-pipeline`.

## Dispatcher ≠ executor boundary

This composite is **analysis + recommendations**. It does not:
- Delete files (Phases 1–2 report only)
- Refactor code (Phase 3 gathers candidates, grills, suggests; does not implement)
- Rewrite CONTEXT.md or LANGUAGE.md (Phase 4 updates only when terms crystallize)
- Commit or execute code changes (Phase 5 stages ADRs; user or `/refactor-pipeline` executes)

User gates all code mutations via `/refactor-pipeline` (which orchestrates deeper phases: refactor-plan → three-man-team → fix-the-suite → adr-write). See `standards/agent-routing.md §dispatcher-executor-boundary`.

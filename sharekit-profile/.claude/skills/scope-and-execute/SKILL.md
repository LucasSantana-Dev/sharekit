---
name: scope-and-execute
description: |
  Composite skill (analysis → plan → execute → merge).
  
  **Use when:**
  - "Fix X area" / "implement Y end-to-end" — understand → plan → execute → merge in one workflow
  - "Look at this repo and figure out what to do" — full intake + full delivery
  - Work spans multiple files or services (avoid planning-only limbo)
  - Estimated >1h of effort
  
  Chains `adt-repo-intake`/`ecosystem-health` → `context-pack` → `plan` → `dispatch`/`loop` → `ship` → ADR/memory.
user-invocable: true
auto-invoke: open-ended-feature-or-fix-requests
metadata:
  owner: global-agents
  tier: contextual
---

# Scope and Execute

Full arc: understand → plan → execute → merge. Eliminates "should I /plan or /loop?" decisioning.

## Phase 1: Analysis

**Done when:** Scope brief delivered — files in scope, contracts, dependencies, and risk flags identified.

- **New repo / unfamiliar code:** invoke `adt-repo-intake`
- **Multi-repo / workspace scope:** invoke `ecosystem-health`
- **Resume active task:** skip Phase 1 (prior analysis cached)
- **Query prior decisions first:** `rag_query(query="<repo> scope/plan/decisions", top=5, scope_types=["plans","handoffs"])`
  - If hits: load from results, skip redundant analysis
  - If miss: proceed to adt-repo-intake / ecosystem-health

**Stop condition:** If scope >1 week estimated → surface "Scope too large" blocker, recommend phases.

## Phase 2: Context Loading

**Done when:** Relevant code, standards, prior ADRs loaded with token budget noted.

- Invoke `context-pack` (or note if `auto-context-pack` already fired on this prompt)
- Cap at 2k tokens
- Output: token count + loaded artifact types (standards/ADRs/code)

## Phase 3: Planning

**Done when:** Phased plan written to `.claude/plans/<task>.md` with validation per phase.

- Skip if scope is genuinely 1–2 files with obvious single-edit target
- Invoke `plan` (outputs numbered phases with testability per phase)
- If plan rejected by user → halt, surface feedback, loop to Phase 3 next turn

## Phase 4: Execution

**Done when:** All commits landed on branch; files changed match plan scope.

- **Parallel independent tracks:** invoke `dispatch` (see CLAUDE.md parallel-execution-mandatory §)
- **Sequential inspect→act→verify:** invoke `loop`
- **Complex 3+ phase, multi-concern work:** invoke `three-man-team`
- Implement against Phase 3 plan

## Phase 5: Pre-merge Readiness

**Done when:** Verdict MERGE obtained; all blockers resolved or documented.

- Invoke `pr-merge-readiness` or `merge-confidently`
- **Stop condition:** If verdict is FIX → surface blocker, do NOT push through
- **Auto-merge hard rule:** Never merge without Phase 5 verdict

## Phase 6: Capture & Memory

**Done when:** ADR and memory artifacts committed (if non-trivial decision).

- If meaningful decision made: invoke `adr-write` (references standards/decision-discipline.md §)
- Invoke `knowledge-loop` to sync durable context to memory + RAG
- Cross-link: note related skills in handoff

## Reconciliation

Output scaffold at start and full summary at end:
```
SCOPE AND EXECUTE — <task>
  Phase 1 Analysis:      <files>, <key dependencies> [OK] / [STOP] <blocker>
  Phase 2 Context:       <token count>, <artifacts> [OK] / —
  Phase 3 Plan:          <plan path>, <N phases> [OK] / [STOP] <blocker>
  Phase 4 Execute:       <M commits>, <files changed> [OK] / [STOP] <blocker>
  Phase 5 Ship:          <PR#>, <merge SHA> [OK] / [STOP] <blocker>
  Phase 6 Capture:       <ADR path>, <memory paths> [OK] / —
  ---
  Snapshot:              <handoff path> | (complete + shipped)
  Open watch:            (none) | <e.g., production health>
```

**Phase 1–6 MUST run in sequence.** Halt at each blocker; do not skip phases.

## Failure / Stop Conditions

| Condition | Action |
|-----------|--------|
| Analysis → scope >1 week | Halt; recommend breaking to phases |
| Plan rejected (user feedback) | Halt; restart Phase 3 next turn |
| Pre-merge verdict ≠ MERGE | Halt; surface blocker, do not push |
| Missing external drive mount | Halt; surface, fall back to grep + claude-mem (see skill-quality-spec.md) |

## References

- CLAUDE.md — parallel-execution-mandatory, dispatcher-executor-boundary, idempotency
- standards/decision-discipline.md — ADR timing, when to capture
- standards/workflow.md — composite-contract, phase-sequencing
- skills: `adt-repo-intake`, `ecosystem-health`, `context-pack`, `plan`, `dispatch`, `loop`, `three-man-team`, `pr-merge-readiness`, `ship`, `adr-write`, `knowledge-loop`

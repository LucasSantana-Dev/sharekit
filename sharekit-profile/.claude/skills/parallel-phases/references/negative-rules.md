# Negative Rules (Mandatory)

Hard constraints enforced by the composite and sub-Agent instructions. Violations cause
blocker escalation or reconciliation failure.

## Core rules

### 1. Do NOT fan-out write-Agents over same file/branch in same wave

**Rule:** If two tasks in the same wave declare writes to overlapping files, they must
NOT both execute in that wave.

**Enforcement:** Conflict-guard algorithm (Phase 2) detects overlaps and either demotes
one task to the next wave (default) or allocates worktrees (with `--worktrees` flag).

**If violated:** (should not happen) Reconciliation reports the conflict under `CONFLICTS`
field and keeps the smaller-task-id's version. The larger-id is demoted to a fix-wave.

**Why:** Git merges + rebase under concurrent writes on the same file cause data loss.

---

### 2. Do NOT skip per-wave reconcile

**Rule:** Every wave's agents must all return BEFORE the next wave dispatches.
Fire-and-forget is forbidden.

**Enforcement:** Composite waits for all Agent calls in a wave to return (blocking await).
Only after reconciliation completes does it dispatch the next wave.

**If violated:** (architecture violation) Handoff file captures incident; reconciliation
stops.

**Why:** Waves have dependencies. Task T2 may depend on T1's artifact. Skipping reconcile
loses T1's output.

---

### 3. Do NOT advance past a failed phase gate

**Rule:** If a phase gate (npm test, cargo check, pytest) fails after a phase's final
wave, the composite halts and does NOT dispatch the next phase.

**Enforcement:** Composite captures gate exit code, logs errors, writes handoff, and
stops with `(failed: gate-fail)` in reconciliation.

**If violated:** (should not happen with composite logic) Reconciliation explicitly marks
the failure; user must re-invoke to continue.

**Why:** A failed gate indicates the phase introduced a regression. The next phase may
depend on correctness of the previous one.

---

### 4. Do NOT inherit parent session chat history into sub-Agent prompts

**Rule:** Each sub-Agent receives ONLY the task context (from `wave-prompt.md` template)
+ task-specific metadata. It does NOT receive the parent orchestrator's full chat history.

**Enforcement:** Wave dispatch renders prompt from template + task data only. No parent
history injected.

**If violated:** Sub-agents become biased by parent context (e.g., a code decision made
earlier), leading to inconsistent implementations.

**Why:** Sub-agents must work independently. If they need context from another task's
work, they return `NEEDS_CONTEXT` and ask the orchestrator.

---

### 5. Do NOT auto-merge PRs created by sub-agents

**Rule:** Sub-agents may push a branch and open a PR. They do NOT merge.

**Enforcement:** Wave-prompt.md instructs agents: "Do NOT merge PRs. Pushing a branch
and opening a PR is fine; merging is reserved for `/merge-confidently`."

**If violated:** Composite logs the violation in reconciliation; the PR remains open for
human review.

**Why:** PRs created by agents may need human review before merging, especially in
multi-phase plans.

---

### 6. Do NOT pass secrets/tokens/credentials in Agent prompts

**Rule:** If a task needs authentication (AWS keys, GitHub token, API secret), instruct
the agent to read from environment variables or system keychain, NOT from the prompt.

**Enforcement:** Wave-prompt.md contains instruction: "If you need a secret, read from
env/keychain."

**If violated:** Secret lands in agent transcript (visible in chat); escalate as security
incident.

**Why:** Agent transcripts are not always private. Secrets in prompts leak.

---

### 7. Do NOT add `Co-Authored-By: Claude …` or `🤖 Generated …` trailers

**Rule:** Commits authored by sub-agents must NOT include Claude co-author trailers.
Similarly, PRs/issues must NOT include "Generated with Claude Code" badges.

**Enforcement:** Wave-prompt.md override at `references/wave-prompt.md` disables the
harness's default co-author behavior. The override is embedded in every sub-Agent prompt.

**If violated:** Commit messages / PR bodies contain the trailer anyway → sub-agent
ignored the override (architecture issue; escalate).

**Why:** Per user's CLAUDE.md: commits/PRs are authored by the human operator (Lucas
Santana). The assistant is a tool, not a contributor of record.

---

### 8. Branch naming: `feature/`, `fix/`, or `chore/` prefixes only

**Rule:** Sub-agents create branches with conventional prefixes: `feature/*`, `fix/*`,
`chore/*`. Never `codex/*`, `wip/*`, or arbitrary names.

**Enforcement:** Wave-prompt.md instruction: "Branch names use feature/, fix/, or
chore/ prefixes only."

**If violated:** Composite logs branch violation in reconciliation; recommends
re-running the task with a corrected branch name.

**Why:** Conventional naming allows CI/CD gates and release pipelines to recognize
agent-created branches.

---

### 9. Do NOT touch files outside the write scope

**Rule:** Sub-agents may read any file in `scope_in`. They may ONLY write to files in
`scope_out`. Writing to files outside `scope_out` is a violation.

**Enforcement:** Wave-prompt.md warns: "Do NOT touch files outside the write scope.
Other sub-agents are editing in parallel; overlap will be rejected at reconcile."

**If violated:** Composite detects overlap in artifact declarations and escalates the
conflict. The violating task is demoted or marked with `DONE_WITH_CONCERNS`.

**Why:** Parallel writes to shared files cause merge conflicts and data loss.

---

### 10. Discover dependencies on other tasks; do NOT speculate

**Rule:** If a sub-agent discovers it cannot complete the task without another task's
output, it returns `NEEDS_CONTEXT` with the missing detail. It does NOT stub/speculate.

**Enforcement:** Wave-prompt.md: "If you discover a dependency on another task's work,
return NEEDS_CONTEXT — do not speculate or stub."

**If violated:** Agent delivers incomplete or wrong output; cascading failures.

**Why:** Unannounced dependencies hide until deployment / integration testing.

---

### 11. Do NOT produce non-deterministic wave layouts

**Rule:** Same plan input must always produce the same wave output. Non-determinism sources to avoid:
- HashMap/Set iteration order (use sorted arrays)
- Random tie-breaking in conflict resolution (use task id, lexicographic)
- Timestamps or UUIDs in scope identifiers
- Unordered task ingestion from --from-issues (sort by issue number first)

**Enforcement:** Wave layout algorithm must be pure (deterministic given input). Any
randomness or unordered iteration is a violation.

**If violated:** A run that works once may fail on retry because wave assignments shifted.
Debugging becomes impossible without a stable baseline.

**Why:** Non-deterministic layouts cause irreproducible conflicts. Reproducibility is
essential for debugging parallel failures.

---

### 12. Do NOT dispatch wave agents without an observability checkpoint

**Rule:** Before dispatching each wave, log:
- Task count in this wave
- Assigned specialists and model tiers
- Expected max fan-out (concurrent Agent calls)
- Any tasks demoted by conflict-guard (with reason)

**Enforcement:** Composite prints checkpoint before Agent dispatch. Checkpoint is
captured in wave reconciliation artifact.

**If violated:** Silent dispatch makes post-mortem analysis impossible. When a wave
produces unexpected results, you have no record of what was sent.

**Why:** The observability checkpoint costs ~50 tokens; a missing audit trail can cost
hours of debugging. Without it, you cannot distinguish "the plan was wrong" from
"the agents executed the plan incorrectly."

---

### 13. Do NOT skip the critic gate because the plan "looks simple"

**Rule:** The Phase 2.5 critic gate is the cheapest quality gate in the pipeline — a
single read-only Explore agent that takes ~30 seconds. It catches:
- Implicit file conflicts the scope declarations missed
- Underestimated tasks that will hit NEEDS_CONTEXT mid-wave
- Phase ordering assumptions that don't hold

Common rationalizations for skipping:
- "This plan is only 3 tasks" → Simple plans have the same failure modes; gate cost is flat
- "I already reviewed the assignments" → You are not adversarial; the critic is
- "We're in a hurry" → A blocked wave costs far more time than a 30-second critic pass

**Enforcement:** Composite does NOT offer a skip-critic flag. The gate always runs.

**If violated:** Hidden conflicts surface mid-wave, blocking reconciliation. Worse:
tasks complete with NEEDS_CONTEXT, forcing re-dispatch.

**Why:** The critic's perspective is adversarial — it looks for holes you missed. The
cost of a false negative (a hidden conflict discovered at wave dispatch) far exceeds
the cost of running the gate.

---

## Summary

All 13 rules are enforced by one or more of:
1. **Composite algorithm** (conflict-guard, DAG analysis, wave reconcile, deterministic layout)
2. **Wave-prompt.md override** (sub-Agent instruction block)
3. **Reconciliation checks** (artifact overlap, scope violations, conflicting edits)
4. **Observability protocol** (checkpoint logging before wave dispatch)
5. **Critic gate** (Phase 2.5 read-only review, not optional)

Violations are surfaced explicitly in reconciliation or as blockers. There are no silent
fallbacks.

---

## Sources

These rules are derived from:
- **Determinism (Rule 11):** LMCache architecture (KV cache prefix stability), codebase-memory-mcp (stable Cypher query results)
- **Observability (Rule 12):** OpenMontage checkpoint protocol, agentsview session analytics patterns
- **Critic gate (Rule 13):** agent-skills anti-rationalization tables (addyosmani/agent-skills)
- **Conflict guard (Rule 1):** parallel-phases production runs (2026-05, 2026-06)
- **Core rules 2-10:** parallel-phases v1 architecture, wave reconciliation contract

---
name: parallel-phases
description: |
  Composite skill — execute a phased plan with multiple independent tasks per phase
  by fanning out one Agent per task per wave, reconciling per wave, gating between
  phases, and emitting a phase × outcome report.
  
  Triggers: "execute this plan", "work through these phases", "dispatch agents per task",
  "swarm over this backlog", "parallelize this plan", "fan out per task".
  
  Replaces manual sequential task execution, ad-hoc parallel-investigate + write, and
  hand-rolled phase tables.
user-invocable: true
auto-invoke: phased-plan-execution + multi-task-per-phase + "execute this plan" + "work through these phases" + "dispatch agents per task" + "swarm over"
argument-hint: '[plan-path] | --from-issues "<gh-query>" | --from-prompt [--worktrees] [--dry-run]'
triggers:
  - execute this plan
  - work through these phases
  - dispatch agents per task
  - swarm over this backlog
  - parallelize this plan
  - fan out per task
metadata:
  owner: global-agents
  tier: contextual
---

# Parallel Phases

The composite for "I have phases and tasks laid out; dispatch smart subagents and
bring back a phase × outcome report."

**Replaces:**
- Manual sequential walk through `.claude/plans/backlog-YYYY-MM-DD.md`
- `subagent-driven-development` when N tasks in a phase are independent
- Ad-hoc `parallel-investigate` + manual writes
- Hand-rolled phase tables at end of session

**Auto-invoke when ALL apply:**
- Plan source visible: `.claude/plans/*.md` argument, GitHub issue set, or phases+tasks in prompt
- ≥3 tasks total OR ≥2 tasks in any single phase
- Tasks are write-work (code edits, issue closure, releases, PR merges) — NOT pure investigation

**User phrases:**
- "execute this plan / backlog"
- "work through these phases"
- "swarm over these issues / tasks"
- "parallelize this plan"

**Chains from:** `scope-and-execute`, `refactor-pipeline`, `orchestrate` when ≥3 parallel tasks.

---

## Workflow

### Phase 0 — RAG pre-flight (composite logic only)

Query the knowledge graph for similar plan runs within the last 24 hours before starting.

Run: `graphify query "parallel-phases run similar-plan" --budget 300`

If result exists and covers the same plan → surface cached run summary to user, ask "Re-run this plan with fresh execution, or use the cached result?" If user confirms fresh run, proceed; if defers to cache, exit.

If no recent match found → proceed to Phase 1.

**Why this exists:** Parallel-phases is expensive (≥1 minute per run). Caching similar runs prevents duplicating work; 24h threshold balances freshness vs. cost.

**Done when:** either fresh run confirmed OR no cached result found (proceed to Phase 1).

---

### Phase 1 — Ingest (composite logic only)

Parse plan source into `phases[]` array with task metadata: id, summary, scope_in/out,
depends_on, specialist, model_tier, acceptance criteria.

**Sources:** markdown file (## Phase / ### Task), `--from-issues "<query>"` (gh + label grouping),
`--from-prompt` (inline extraction).

**Scope inference:** if `scope_files_*` missing, dispatch ONE Explore agent per phase
(90s time-box) to infer file scope; don't infer for >1 phase concurrently.

**Done when:** structured `phases[]` array printed for user review AND user has confirmed (or 10s passed without objection).

---

### Phase 2 — DAG analysis (composite logic only)

Run Kahn's algorithm over `depends_on` to assign tasks to waves. Conflict-guard within
each wave: if two tasks declare overlapping `scope_files_in ∪ scope_files_out`, demote
the later task to the next wave (or allocate worktree if `--worktrees` set).

Cap fan-out at ≤8 per wave (Anthropic tool-use block tolerance); split into sub-waves
if needed.

Print wave layout. If `--dry-run`, stop here and exit.

**Done when:** wave layout printed for user review AND user has confirmed (or 10s passed without objection); `--dry-run` exits.

---

### Phase 2.5 — Critic gate (composite logic only)

After Phase 2 wave layout printed, dispatch ONE `Explore` agent (read-only, never edits) to adversarially review the wave assignments.

**Critic prompt:** "Challenge these wave assignments: What tasks could deadlock? What file overlaps were missed? What task underestimates scope? Give a verdict: safe to proceed, or critical issues found?"

**If critic finds ≥1 critical issue:** revise wave layout to address, then re-run Phase 2 and this gate.

**If critic finds only minor concerns:** log them in the wave layout printout and proceed to Phase 3.

**Why this exists:** Wave assignment is easy to get wrong — missing file overlaps, underestimated scope, implicit deadlocks. An adversarial read-only review catches these before dispatch, avoiding mid-phase failures that are far more expensive to fix.

**Done when:** critic returns verdict AND critical issues (if any) are resolved.

---

### Phase 3 — Pre-snapshot (composite logic only)

Invoke `/repo-state-snapshot --label parallel-phases-start`. Capture:
- Current SHA, branch
- Open issues/PRs count
- Latest release tag
- Draft releases

Feeds Phase 6's state-change section.

**Done when:** snapshot written AND baseline captured (logged to user).

---

### Phase 4 — Per-phase execution

**For each phase:**

**For each wave:**

**a. Wave dispatch** — Single Agent tool-use block with one `Agent()` call per task.
Render prompt from `wave-prompt.md` template with task context. All calls fire
concurrently in the same assistant message.

**b. Wave reconcile** — When ALL agents return: map each to
`{task_id, status, artifacts, conflicts, next_action}`.

Status handling:
- `DONE` → mark complete, advance
- `DONE_WITH_CONCERNS` → record; advance unless concerns are about correctness
- `NEEDS_CONTEXT` → re-dispatch ONCE with missing context. If returns NEEDS_CONTEXT again, mark BLOCKED
- `BLOCKED` → stop the phase, write handoff, do NOT dispatch next wave

On conflict (two DONE agents touched same file): keep smaller-task-id's change,
demote other to fix-wave at phase end.

Print one-line wave summary: `Wave k: <N/M> done, <K> concerns, <J> blocked`.

**c. Phase gate** — After phase's final wave, run repo's verify command (auto-detect):
- `package.json` → `npm run typecheck && npm test --silent`
- `Cargo.toml` → `cargo check && cargo test --quiet`
- `pyproject.toml` + pytest → `pytest -q`
- None → skip, log "(no gate detected)"

On red: stop, write handoff, do not advance to next phase.

**Done when:** all wave agents reconciled AND phase gate passes (if present, logged) OR phase gate is absent AND user confirmed (or 10s passed).

---

### Phase 5 — Post-snapshot (composite logic only)

Invoke `/repo-state-snapshot --label parallel-phases-end --diff parallel-phases-start`.
Compute state change. Feeds Phase 6.

**Done when:** snapshot captured AND diff computed (logged to user).

---

### Phase 6 — Reconciliation (composite logic only)

Emit final report (see `reconcile-template.md`). Includes: phase × task × result table,
state change (issues/PRs/releases), deferred tasks, blocked tasks, gate pass rate,
stop conditions, handoff path, open watches.

**Every declared phase appears.** Skipped phases marked `(skipped: <reason>)`.
Failed phases marked `(failed: <reason>)`.

**Done when:** reconciliation report printed + plan file updated (if writable) AND user confirmed receipt (or 10s passed).

---

## Common Rationalizations

Why these rationalizations fail — and the guard that exists because they do:

| Rationalization | Reality | Guard |
|---|---|---|
| "These two tasks barely overlap, it'll be fine" | File-level conflicts are silent and corrupt state; later waves inherit corruption | conflict-guard demotes on scope_files overlap; `--worktrees` isolates if needed |
| "I'll skip the phase gate this once to save time" | A red gate means broken code; skipping hides the breakage from the next phase and wastes time debugging later | gates are mandatory; on red, phase stops and handoff is written |
| "The critic is being too cautious about this wave" | Critic is adversarial by design — exists to catch cases YOU missed; dismissing the verdict risks mid-phase deadlock | Phase 2.5 blocks until critical issues resolved; minor concerns are logged but don't block |
| "The plan is simple enough to skip Phase 0 RAG" | Skip-if-fresh is a 300-token query; re-running a completed plan costs minutes + resources | Phase 0 gates with cached result; user confirms fresh run; no cost to check |

---

## Stop Conditions

See `references/stop-conditions.md` for full mapping.

**Summary:**
- BLOCKED in any wave → stop phase, write handoff, do NOT advance
- Same task demoted twice by conflict-guard → escalate to user (dep-graph wrong)
- Phase gate fails → stop, surface logs in reconcile, do NOT advance
- Context budget >75% → emit handoff, stop after current wave
- NEEDS_CONTEXT loop (same task asks twice) → mark BLOCKED, stop phase

---

## Negative Rules (Mandatory)

See `standards/` rules cited below + `references/negative-rules.md` for full detail.

**Key:**
- Do NOT fan-out write-Agents over same file/branch in same wave (conflict-guard / `--worktrees` exist for this)
- Do NOT skip per-wave reconcile (each wave agents must all return before next wave dispatches)
- Do NOT advance past failed phase gate
- Do NOT inherit parent chat history into sub-Agent prompts
- Do NOT auto-merge PRs (that's `/merge-confidently`'s job; wave agents push branch + open PR)
- Do NOT pass secrets/tokens in Agent prompts (read from env/keychain)
- Do NOT add `Co-Authored-By: Claude …` or ` Generated …` trailers (wave-prompt.md override is in place)

See `standards/workflow.md` (parallel-execution rule), `CLAUDE.md` hard rules (no auto-PR-merge, co-author override).

---

## Configuration

Optional `~/.claude/skills/parallel-phases/config.json` or repo-local
`.claude/parallel-phases.json`:

```json
{
  "default_worktrees": false,
  "fan_out_cap": 8,
  "phase_gate": {
    "auto_detect": true,
    "override_command": null
  },
  "specialist_defaults": {
    "impl": "general-purpose",
    "review": "code-reviewer",
    "tests": "test-engineer",
    "security": "security-reviewer",
    "git": "git-master",
    "debug": "debugger",
    "explore": "Explore"
  },
  "model_tier_defaults": {
    "mechanical": "haiku",
    "integration": "sonnet",
    "architecture": "opus"
  }
}
```

---

## Plan File Format

Markdown files with phases + tasks. See `references/plan-format.md` for full schema and examples.

**Quick:** markdown with `## Phase N — <name>` headers, followed by task bullets/subheadings.
Each task declares specialist, model, scope_in/out, depends_on, acceptance criteria.
Missing fields default per config.

---

## Outputs / Evidence

- Wave layout (printed Phase 2)
- Per-wave summary lines (printed Phase 4)
- Pre/post snapshots (JSON at `~/.claude/state/snapshots/<repo>/`)
- Phase-gate logs (surfaced on failure)
- Final reconciliation block (Phase 6; see `reconcile-template.md`)
- Updated plan file with task statuses marked (if source was writable)
- Handoff file (on BLOCKED / gate fail)

---

## Integration

**Pairs with:**
- `/repo-state-snapshot` (used internally Phases 3 + 5)
- `/plan-to-issues` (convert plan tasks to GH issues for tracking, then `--from-issues` later)
- `/verify-before-done` (optional stricter post-phase gate)

**Replaces:**
- Sequential walk-through of phased backlogs
- Ad-hoc `parallel-investigate` + manual write phases

**Related skills:**
- `parallel-investigate` — READ-only fan-out (use when no writes)
- `dispatch` — low-level remote agent-box jobs (ssh workflows)
- `three-man-team` — ONE feature (architect/builder/reviewer)
- `subagent-driven-development` (plugin) — sequential same-session execution
- `loop` — sequential when tasks have shared state
- `orchestrate` — meta-coordinator; routes to this skill when ≥3 independent tasks

---

## References

- `references/wave-mechanics.md` — Detailed wave assignment, conflict-guard algorithm, fan-out rules
- `references/output-patterns.md` — Wave summary format, reconciliation structure, examples
- `references/stop-conditions.md` — Stop/failure condition mapping + recovery paths
- `references/plan-format.md` — Markdown schema, YAML frontmatter, task metadata
- `references/negative-rules.md` — Full enforcement rules + rationale
- `wave-prompt.md` — Sub-Agent prompt template (task context rendering, specialist customization, return format)
- `reconcile-template.md` — Final report format (Handlebars-style, dry-run variant, partial-execution variant)

---

## Troubleshooting

**"Phase gate failed. What does this mean?"**
→ A test, type check, or build command failed after a phase completed. Check the logs in
the reconciliation report; the phase did NOT advance. Fix the failure (likely a task did
something unexpected), then re-dispatch the failed phase or the next one via a fresh
`/parallel-phases` call pointing to the plan file with phase status updated.

**"Same task demoted twice. Is the plan wrong?"**
→ Yes. The conflict-guard demoted a task once; if it demoted the same task again in a
later wave, the `depends_on` graph likely has a cycle or is over-constrained. Review the
task's deps and scope; escalate to the user with the dep graph for confirmation.

**"A wave agent returned NEEDS_CONTEXT. What happened?"**
→ The agent discovered an undeclared dependency on another task's work. The composite
re-dispatches the agent ONCE with the missing context inline. If it returns NEEDS_CONTEXT
again, the task is marked BLOCKED and the phase stops. Surface the blocker in the reconciliation
report; resolve the dependency (e.g., confirm with the user, modify the plan), then retry.

---

*Canonical source:* `<HOME>/.claude/skills/parallel-phases`

*Last updated:* 2026-06-22 (bloat reduction + quality spec alignment)

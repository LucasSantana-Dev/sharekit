# Stop Conditions & Recovery

Enumeration of all stop/failure conditions, their triggers, recovery paths, and how the
composite records them in reconciliation.

## BLOCKED in any wave

**Trigger:** Sub-agent returns `STATUS: BLOCKED` with reason in `BLOCKER` field.

**Composite behavior:**
1. Stop the current phase (do NOT dispatch remaining waves)
2. Write handoff at `~/.claude/handoffs/<project>/latest.md` with:
   - Current phase + wave
   - Blocked task ID + reason
   - Suggested resolution (from `NEXT_ACTION`)
   - Uncommitted changes list
   - Current branch
3. Do NOT advance to next phase
4. Emit reconciliation with `(BLOCKED: <reason>)` in the stopped phase row

**Recovery:**
- User resolves the blocker (e.g., design decision, clarification, fix underlying issue)
- Re-invoke `/parallel-phases <plan-path>` with updated plan
- Composite resumes at the blocked phase

**Reconciliation entry:**
```
| P3 — Split modules | T5: extract jwt verify | BLOCKED — rs256 vs hs256 unclear |
```

---

## Same task demoted twice by conflict-guard

**Trigger:** Wave assignment demotes the same task in two successive waves.

**Meaning:** The `depends_on` graph is circular or over-constrained.

**Composite behavior:**
1. Halt wave dispatch immediately
2. Write handoff with: dep graph dump, demotion history, task in question
3. Escalate to user with: "Task {{id}} was demoted twice. The dependency graph may be circular. Review {{task.depends_on}} and the file scopes of tasks that demote it."
4. Do NOT advance to next phase

**Recovery:**
- User audits `depends_on` graph in the plan file
- Resolve cycle or re-scope conflicting file access
- Re-invoke `/parallel-phases`

**Reconciliation entry:**
```
Stop conditions tripped: same-task-demoted-twice
Blocker: Task T4 demoted twice (P2 Wave 1, P2 Wave 2) — circular dependency suspected
```

---

## Phase gate fails

**Trigger:** Verify command (npm test, cargo check, pytest, etc.) exits non-zero after
phase's final wave completes.

**Composite behavior:**
1. Stop the current phase
2. Capture stderr + stdout to `~/.claude/state/snapshots/<repo>/gate-fail-<phase>.log`
3. Write handoff with: phase, gate command, exit code, relevant log lines
4. Do NOT advance to next phase
5. Emit reconciliation with gate logs highlighted in "Stop conditions"

**Recovery:**
- Review gate logs (surfaced in reconciliation or via handoff)
- Fix the underlying issue (likely a task did something unexpected)
- Re-invoke phase or next phase with plan updated

**Reconciliation entry:**
```
Phase gates passed: 2/3
Stop conditions tripped: phase-gate-fail (P2 — npm test exited 1)
Snapshot: ~/.claude/handoffs/parallel-phases/latest.md
```

Example log surface:
```
[Phase gate — P2 failed]
Command: npm test --silent
Exit code: 1

Error output:
  tests/auth.test.ts:42:19 — TypeError: cannot read property 'verify' of undefined
```

---

## Context budget >75%

**Trigger:** Orchestrator detects remaining token budget ≤25% of session limit.

**Composite behavior:**
1. Emit handoff at `~/.claude/handoffs/<project>/latest.md` with:
   - Completed phases + tasks (state table)
   - Next uncompleted phase (where to resume)
   - Partial snapshots (pre-snapshot + current post-snapshot)
2. Stop execution (do NOT dispatch next wave)
3. Emit partial reconciliation marking the phase as `(incomplete — context budget)`

**Recovery:**
- Resume in a new session with `/parallel-phases <plan-path>` at the saved phase

**Reconciliation entry:**
```
PARALLEL PHASES — backlog.md (PARTIAL — context budget exceeded)

[completed phases + tasks]

Phase gates passed: 3/5
Stop conditions tripped: context-budget-exceeded
Snapshot: ~/.claude/handoffs/parallel-phases/latest.md
Open watch: Resume at P4 after context recovery
```

---

## NEEDS_CONTEXT loop (same task asks twice)

**Trigger:** Sub-agent returns `STATUS: NEEDS_CONTEXT` in wave k; orchestrator re-dispatches
with context; agent returns `NEEDS_CONTEXT` again in the same phase.

**Composite behavior:**
1. Mark task as `BLOCKED` with reason `NEEDS_CONTEXT-loop`
2. Stop the phase (do NOT dispatch remaining waves)
3. Write handoff with: task, original need, re-dispatch attempt, second need
4. Emit reconciliation with the task marked `BLOCKED`

**Recovery:**
- User examines what was missing both times
- Likely needs deeper investigation or a design decision before task can proceed
- Re-invoke with plan clarified or decision made

**Reconciliation entry:**
```
| P2 — Implement | T3: Add cache layer | BLOCKED — NEEDS_CONTEXT (missing cache size limit decision after 1 re-dispatch) |
```

---

## Summary Table

| Condition | Trigger | Stops phase? | Stops composite? | Handoff? | Recovery |
| --- | --- | --- | --- | --- | --- |
| BLOCKED in wave | Sub-agent returns BLOCKED | ✅ | (depends on user) | ✅ | Resolve + re-invoke |
| Same task demoted 2× | Conflict-guard logic | ✅ | ✅ | ✅ | Fix dep graph, re-invoke |
| Phase gate fails | Verify command non-zero | ✅ | (depends on user) | ✅ | Fix, re-invoke phase |
| Context budget >75% | Token limit approaching | ✅ | ✅ | ✅ | Resume in new session |
| NEEDS_CONTEXT loop | Agent asks twice same phase | ✅ | (depends on user) | ✅ | Clarify, re-invoke |

---

## Handoff File Structure

All stop conditions write to `~/.claude/handoffs/<project>/latest.md`:

```markdown
# Handoff — {{plan_title}}

**Session:** {{session_id}}  
**Stopped at:** {{phase.id}} {{wave}}  
**Reason:** {{stop_condition}}

## Completed tasks

{{table of completed tasks + outcomes}}

## Current state

- Branch: {{current_branch}}
- SHA: {{current_sha}}
- Uncommitted changes: {{file list or "none"}}
- Open issues: {{count}}
- Open PRs: {{count}}

## Blocker

{{Short statement + suggested resolution path}}

## Next step

{{One line — what to do next to unblock or continue}}

---

*Saved at:* {{timestamp}}  
*Plan source:* {{plan_path}}
```

Resume with: `/parallel-phases <plan-path>` with updated plan file if needed.

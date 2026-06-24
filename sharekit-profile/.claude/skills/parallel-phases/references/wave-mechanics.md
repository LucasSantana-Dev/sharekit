# Wave Mechanics

Detailed algorithms and rules for wave assignment, conflict detection, and fan-out capping.

## Wave Assignment (Kahn's Algorithm)

Given a set of tasks with `depends_on` edges:

1. **Sort tasks by id** (lexicographic order) BEFORE applying Kahn's algorithm. Use task id as the tie-breaker when multiple tasks have zero in-degree in the same step.
2. **Wave 0:** All tasks with empty `depends_on` (in sorted id order)
3. **Wave k+1:** All tasks whose `depends_on` are satisfied (all deps in waves 0..k)
4. **Stop:** When all tasks assigned

**Determinism guarantee:** Same plan input → same wave layout. Non-deterministic assignment (HashMap iteration order, random tie-breaking) is a hard bug — it causes intermittent conflicts that are impossible to reproduce. Always sort before assigning.

**Complexity:** O(V+E) where V = task count and E = dependency edges. For typical plans (N≤30 tasks), this is under 1ms. Never skip deterministic sorting for "simple" or "small" plans — determinism costs nothing.

Example:
```
T1: depends_on=[]           → Wave 0
T2: depends_on=[]           → Wave 0 (same wave as T1; tie-broken by sort order)
T3: depends_on=[T1]         → Wave 1
T4: depends_on=[T2, T3]     → Wave 2
```

## Conflict Guard (Same-Wave File Overlap)

Within each wave, identify tasks whose `scope_files_in ∪ scope_files_out` overlap.

**Overlap detection (exact paths and glob patterns):**
- Tasks overlap if they both touch the same exact file
- Tasks overlap if one task's exact path matches another task's glob pattern
  - Example: Task A declares `scope_files_out: ['src/**/*.ts']` and Task B declares `scope_files_out: ['src/index.ts']` → **overlap**, demote B
  - Example: Task A declares `scope_files_in: ['src/auth/**']` and Task B declares `scope_files_out: ['src/auth/login.ts']` → **overlap**, demote B
- **Rule:** When in doubt, treat as conflict. A false-positive demotion costs one extra wave; a false-negative conflict corrupts state silently.

**Default behavior (no `--worktrees`):**
- Find overlapping pair: (T_i, T_j) with i < j
- Demote T_j to Wave k+1
- Re-check for new overlaps; iterate until no overlaps remain

**With `--worktrees` flag:**
- Allocate one worktree per task: `${WORKTREES_ROOT}/<task-id>-<N>/`
- No demotion; tasks work in isolation
- Orchestrator merges worktrees post-wave (watch for rebase conflicts)

**Demotion limit:** If the same task is demoted twice, stop and escalate to the user.
This indicates a circular or over-constrained dependency graph.

## Common Conflict-Guard Rationalizations

| Rationalization | Reality |
|---|---|
| "These tasks almost never touch the same lines" | Conflict-guard is file-level, not line-level. Same file = conflict, regardless of which lines. Line-level detection requires merge-simulation tools (too expensive). File-level is deterministic and conservative. |
| "I'll manually review and it looks safe" | Manual review misses merge-time races. The conflict-guard is deterministic and reproducible; human review is not. If two tasks write to the same file, the later one's changes are silent-dropped or require explicit rebase reconciliation. |
| "The plan is small, I'll skip conflict checking" | Conflict detection is O(N²) on task count; for N≤30 it is <1ms. There is no cost to skipping. Always run it. |
| "These tasks are in different directories" | Glob patterns can overlap across directory boundaries. `src/**/*.ts` overlaps with `src/index.ts` even though the former looks "broad" and the latter "specific". Check explicitly. |

## Fan-out Cap

Anthropic tool-use blocks allow >8 concurrent Agent calls, but readability suffers.

**Rule:** If any wave has >8 tasks after conflict-guard, split into sub-waves:
- Sub-wave 0: tasks 1–8
- Sub-wave 1: tasks 9–16
- etc.

Sub-waves fire sequentially (wait for sub-wave k before dispatching k+1).

## Example Wave Layout

```
Phase 1 — Land v0.24.0
  Wave 0:  T1 [git-master, sonnet]
  Wave 1:  T2 [code-reviewer, sonnet]  (depends_on: T1)

Phase 2 — Close stale issues
  Wave 0:  T3, T4, T5  [general-purpose × 3, haiku]  (fan-out cap: 3 ≤ 8)
  Wave 1:  T6  [git-master, sonnet]  (demoted: overlap with T5 on .github/)

Phase 3 — Security audit
  Wave 0:  T7–T14  (8 tasks, at cap)
  Wave 1:  T15–T22  (8 tasks, fan-out split)
```

## Conflict Resolution (Post-Wave)

When two agents complete the same wave and both declare changes to the same file:

1. **Keep the smaller-task-id's version** (e.g., T3's change over T4's)
2. **Demote the larger-id to a fix-wave** at the end of the phase
3. **Log the conflict** in reconciliation under "artifacts"
4. **Notify the demoted agent** so it can check what was kept and reconcile if needed

Example:
```
Wave 0 agents completed:
  T3: DONE, artifacts=[src/auth.ts]
  T4: DONE, artifacts=[src/auth.ts]  (conflict — same file)
  
Action: Keep T3's version, demote T4 to fix-wave at end of phase.
Record: "T4 demoted due to file conflict with T3"
```

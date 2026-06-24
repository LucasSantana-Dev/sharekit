# Workflow

## Default sequence

1. Detect scope.
2. Read local guidance.
3. Check what is already in flight.
4. Choose the highest-value safe next action.
5. **Decompose**: if the work has ≥2 independent units, dispatch them as parallel agents with worktrees (see below) — do NOT execute them sequentially in the main context.
6. Execute the smallest coherent step (or fan out).
7. Verify with repo-native checks.
8. Merge or ship only when ready.
9. Leave a checkpoint.

## Branching

- Use `feature/`, `fix/`, `refactor/`, `chore/`, `docs/`, `ci/`, or `release/` prefixes.
- Never push directly to `main`.
- Prefer small, reviewable PRs.

## Merge rule

Never merge until all required checks are green or a failure is proven unrelated.
Do not use admin overrides or bypass branch protection to hide unresolved delivery problems.

## Parallel execution (MANDATORY)

When work decomposes into independent units, sequential execution in the main context is a contract violation. Dispatch in parallel.

### When parallel execution is REQUIRED

A unit-of-work is "independent" if its inputs do not depend on another unit's output. Triggers:

- **Multi-repo / multi-PR sweeps** — auditing, fixing, or updating N repos or N PRs.
- **Fan-out investigations** — answering the same question across N files / services / branches.
- **Batch edits** — applying the same change to N files where each edit is self-contained.
- **Cross-cutting research** — independent doc lookups, codebase searches, or external API queries.
- **Composite skill phases** with ≥3 independent tasks in a single phase (use `/parallel-phases`).
- **Pre-implementation analysis** — running `audit-deep`, `ecosystem-health`, `repo-state-snapshot` together for the same repo.

### When parallel is NOT required

- Single-unit work (one bug, one file, one decision).
- Trivial scope: <3 file reads OR <2 edits total.
- Strict sequential dependencies (output of A is input to B).
- Work where every unit needs the same in-context state already loaded.

### Dispatch mechanics

1. **Single tool-use block**: send all `Agent()` calls in ONE assistant message. Multiple messages = serial = violation.
2. **One worktree per repo-touching agent**: when ≥2 parallel agents will read or write the same repo, each gets its own git worktree at `${WORKTREES_ROOT}/<task>-<agent-n>/`. Use `EnterWorktree` (per-session isolation) or `git worktree add` directly. Do not point multiple agents at the same checkout — index lockfile contention and branch-state races silently corrupt work.
3. **Pick the right agent type**:
   - `Explore` for read-only search/lookup
   - `general-purpose` for multi-step research
   - `code-reviewer` / `critic` / `security-reviewer` for review fan-out
   - `test-engineer` for test work
   - `debugger` / `tracer` for parallel root-cause hypotheses
   - Specialized agents (`forge-patterns-expert`, `mcp-gateway-specialist`, etc.) for their domains
4. **Brief each agent fully**: agents start cold. Self-contained prompts only — they cannot see prior conversation.
5. **Reconcile**: after parallel agents return, the main context summarizes findings and decides next step. Do not pass agent output verbatim to the user — synthesize.

### Worktree hygiene

- Naming: `<short-task>-<n>` (e.g. `auth-refactor-1`, `auth-refactor-2`).
- Location: `${WORKTREES_ROOT}/` (NEVER `~/.claude/worktrees/` or internal-disk paths — see CLAUDE.md storage policy).
- After parallel agents finish: `git worktree remove` the ones whose work was merged or abandoned. Keep only worktrees with in-flight changes.
- If `${EXTERNAL_HD}` is unmounted, halt and tell the user rather than falling back to internal disk.

### Refusal pattern

If you catch yourself about to execute the second of N independent units sequentially in the main context: stop, re-dispatch all remaining units as parallel `Agent()` calls in a single tool-use block, and tell the user you corrected the approach. Do not silently continue serial execution.

### Anti-patterns

- [FAIL] Three Read() calls on three files in three separate assistant turns when reading them in parallel would do.
- [FAIL] Auditing 6 repos by `cd`-ing into each one sequentially. Use `Agent()` × 6 with worktrees.
- [FAIL] Running `/test-health`, `/config-drift-detect`, `/coverage-gap` in series when they're independent diagnostics. Fan out.
- [FAIL] Two parallel agents pointed at the same `${DEV_ROOT}/<repo>` checkout. Worktree each.
- [FAIL] Asking the user "should I do these in parallel?" when the rule already mandates it — just do it.

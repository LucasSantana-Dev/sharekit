# Plan File Format

Markdown schema for phase + task definitions that `/parallel-phases` ingests.

## Structure

```markdown
# Plan title (optional frontmatter in YAML block)

Optional YAML frontmatter (see below).

## Phase 1 — <name>

### T1 — <task summary>
- specialist: <agent-type>
- model: <tier>
- scope_in: [<file-glob>, ...]
- scope_out: [<file-glob>, ...]
- depends_on: [<task-id>, ...]
- acceptance: <criteria or multiline>

### T2 — <task summary>
- specialist: git-master
- depends_on: [T1]
- acceptance: PR merged, CI green

## Phase 2 — <name>
...
```

## Fields

| Field | Type | Required? | Default | Notes |
| --- | --- | --- | --- | --- |
| `specialist` | string | no | From config.json `specialist_defaults.impl` | Agent type: `general-purpose`, `code-reviewer`, `git-master`, `test-engineer`, `debugger`, `Explore`, `security-reviewer` |
| `model` | string | no | From config.json `model_tier_defaults.integration` | Tier: `haiku`, `sonnet`, `opus` |
| `scope_in` | list | no | Empty → inferred via Explore agent | Files the agent MAY read |
| `scope_out` | list | no | Empty → inferred | Files the agent MAY write; must not overlap in same wave |
| `depends_on` | list | no | Empty → Wave 0 | Task IDs this task waits for (Kahn's algorithm) |
| `acceptance` | string | no | (from task summary) | Completion criteria; pasted into agent prompt |

## Frontmatter (optional YAML block)

```yaml
---
title: Release v1.2.3 Plan
description: Land critical security fixes and feature enhancements
worktrees: false           # true → allocate worktree per task
dry_run: false             # true → stop after DAG analysis
gate_override: null        # Override auto-detected phase gate command
---
```

## Parsing Rules

- Phase header: `## Phase N — <name>` or `## <name>` (phase ID inferred from order)
- Task header: `### T1 — <summary>`, `### T1:`, `### Task 1:`, or `- [ ] T1 — <summary>` (all accepted)
- Task field: `- specialist: X` (key-value pairs)
- Missing phase ID → auto-assigned `P<N>`
- Missing task ID → auto-assigned `T<N>` within phase
- Phase/task order defines execution order (earlier = higher priority in same wave)

## Examples

### Example 1: Simple sequential release

```markdown
# Release v0.24.0

## Phase 1 — Land PRs

### T1 — Rebase PR #182 onto main
- specialist: git-master
- scope_out: [.github/]
- acceptance: PR #182 rebased, CI green, merged

### T2 — Review #183 pre-release
- specialist: code-reviewer
- depends_on: [T1]
- scope_in: [src/, README.md]
- acceptance: Approved or changes requested (record decision)

## Phase 2 — Tag release

### T3 — Update CHANGELOG
- specialist: general-purpose
- depends_on: [T2]
- scope_out: [CHANGELOG.md]
- acceptance: v0.24.0 entry added + committed

### T4 — Tag and publish
- specialist: git-master
- depends_on: [T3]
- acceptance: Tag v0.24.0 pushed, GitHub release published
```

### Example 2: Parallel tasks with file conflicts guarded

```markdown
# Refactor auth module

## Phase 1 — Extract types + errors

### T1 — Extract auth types
- specialist: general-purpose
- scope_out: [src/auth/types.ts]
- acceptance: types.ts created, no breaking changes

### T2 — Extract auth errors
- specialist: general-purpose
- scope_out: [src/auth/errors.ts]
- acceptance: errors.ts created, errors exported from index

## Phase 2 — Update consumers

### T3 — Update session.ts imports
- specialist: code-reviewer
- depends_on: [T1, T2]
- scope_in: [src/auth/types.ts, src/auth/errors.ts]
- scope_out: [src/auth/session.ts]
- acceptance: session.ts imports correct, tests green

### T4 — Update server.ts imports
- specialist: code-reviewer
- depends_on: [T1, T2]
- scope_in: [src/auth/types.ts, src/auth/errors.ts]
- scope_out: [src/server.ts]
- acceptance: server.ts imports correct, tests green
```

In Phase 2, T3 and T4 will be assigned to the same wave (both depend on T1+T2).
Conflict-guard sees that T3 and T4 both write to different files (no overlap) → both
can run in Wave 0.

### Example 3: Inferred scope + shorthand

```markdown
# Backlog 2026-05-14

## Phase 1 — Close stale issues

- [ ] T1 — Close #145 (outdated action version pins)
- [ ] T2 — Close #138 (locale removal completed)

## Phase 2 — Publish drafts

- [ ] T3 — Publish v0.18.0 Draft

(No specialist/model declared → defaults apply. scope_in/out inferred by Explore agent.)
```

Composite will dispatch one Explore agent to infer scope for all tasks in each phase
(time-boxed to 90s per phase).

## Updating after execution

After execution, the composite updates the markdown with status:

```markdown
### T1 — Rebase PR #182 onto main  ✅ DONE
- specialist: git-master
...

### T2 — Review #183  ✅ DONE_WITH_CONCERNS
- specialist: code-reviewer
- decision: "Approved with note: consider immutability for DTO"
...

### T3 — Close stale  🚫 BLOCKED
- specialist: general-purpose
- blocker: "Premise invalid — action @v6 pins exist in current CI"
```

Status markers: `✅ DONE`, `⚠️ DONE_WITH_CONCERNS`, `🚧 NEEDS_CONTEXT`, `🚫 BLOCKED`.

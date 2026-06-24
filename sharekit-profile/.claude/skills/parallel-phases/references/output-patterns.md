# Output Patterns

Format templates for wave summaries, reconciliation blocks, and dry-run output.

## Wave Summary Line (Phase 4)

Printed after each wave reconciles:

```
Wave k: <N/M> done, <K> concerns, <J> blocked
```

Example:
```
Wave 0: 5/5 done, 0 concerns, 0 blocked
Wave 1: 3/4 done, 1 concerns, 0 blocked
Wave 2: 1/2 done, 0 concerns, 1 blocked
```

## Dry-Run Output (Phase 2 only)

If `--dry-run` flag set, after DAG analysis print:

```
PARALLEL PHASES — {{plan_title}} (DRY RUN)

Wave layout

{{#each phases}}
{{phase.id}} — {{phase.name}}
{{#each waves}}
  Wave {{wave.index}}: {{tasks | comma-separated [id specialist model_tier]}}
{{/each}}
{{/each}}

Total tasks: {{N}}
Parallel waves: {{M}}
Estimated concurrent fan-out (max wave): {{max_wave_size}}
Worktree allocation: {{#if use_worktrees}}{{count}}{{else}}none (default){{/if}}
Phase gates: {{list of auto-detect or override commands}}
```

Example:
```
PARALLEL PHASES — backlog-2026-05-14.md (DRY RUN)

Wave layout

P1 — Land v0.24.0
  Wave 0: T1 [git-master, sonnet]
  Wave 1: T2 [code-reviewer, sonnet]

P2 — Close stale issues
  Wave 0: T3, T4, T5 [general-purpose × 2, code-reviewer × 1; haiku]

Total tasks: 5
Parallel waves: 2
Estimated concurrent fan-out (max wave): 3
Worktree allocation: none (default)
Phase gates: P1: (auto-detect), P2: (auto-detect)
```

## Reconciliation Block (Phase 6)

Final report format (full template in `reconcile-template.md`). Structure:

```
PARALLEL PHASES — {{plan_title}}

Done in this session

| Phase | Task | Result |
| ----- | ---- | ------ |
| P1 — Land v0.24.0 | T1: Rebase PR | PR #182 rebased onto main + merged; released v0.24.0 |
| P2 — Close issues | T2: Close #145 | Closed (premise outdated; action @v6 pins exist) |
...

State change
- Open issues: 27 → 24 (closed: #138, #145, #147)
- Open PRs:    1 → 0
- Latest release: v0.23.0 → v0.24.0
- Drafts: (none)

{{#if deferred}}
Deferred to future sessions
- T7 (P3): Providers taxonomy, #154-#163 — needs schema design call
{{/if}}

{{#if blocked}}
Blocked
- T5 (P3): extract jwt verify — rs256 vs hs256 default unclear
  Next: confirm with user
{{/if}}

Phase gates passed:    5/5 ✅
Stop conditions tripped: none
Snapshot:              ~/.claude/handoffs/parallel-phases/latest.md
Open watch:            (none)
```

**Partial execution (composite stopped mid-flight):**
```
PARALLEL PHASES — backlog.md (PARTIAL — stopped at P3 wave 1)
Reason: BLOCKED — T5 (extract jwt) needs rs256 vs hs256 decision

[rest of template — only completed tasks shown]

Phase gates passed:    2/3 ✅ / 🚫
Stop conditions tripped: BLOCKED-in-wave
```

## Task Outcome One-Liner

Derived from sub-agent's `NEXT_ACTION` field (past tense) or task's `acceptance` if agent
reported just `DONE` without elaboration.

Examples:
- "PR #182 rebased onto main + merged"
- "Closed (premise invalid; both @v6 pins exist)"
- "BLOCKED — needs schema design call before #154"
- "DONE_WITH_CONCERNS — repro steps in ~/.claude/notes/…"

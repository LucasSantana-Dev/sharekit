# Reconcile template

Used by `/parallel-phases` Phase 6 to emit the final report. Style matches the
"All tasks completed. Final report" output in the user's reference screenshot.

## Required template

```
PARALLEL PHASES — {{plan_title | basename(plan_path) | "unnamed-plan"}}

Done in this session

| Phase | Task | Result |
| ----- | ---- | ------ |
{{#each completed_tasks}}
| {{phase.id}} — {{phase.name}} | {{task.id}}: {{task.summary}} | {{task.outcome_one_liner}} |
{{/each}}

State change
- Open issues: {{snapshot.before.open_issues}} → {{snapshot.after.open_issues}}{{#if snapshot.diff.closed_issues}} (closed: {{snapshot.diff.closed_issues | join(", #")}}){{/if}}
- Open PRs:    {{snapshot.before.open_prs}} → {{snapshot.after.open_prs}}
- Latest release: {{snapshot.before.latest_release}} → {{snapshot.after.latest_release}}
- Drafts: {{snapshot.after.drafts_state}}
{{#if uncommitted_changes}}
- Uncommitted: {{uncommitted_changes}} files
{{/if}}

{{#if decisions}}
Decisions made this run
{{#each decisions}}
- {{decision.description}}
  Considered: {{decision.alternatives | join(" / ")}}
  Chose: {{decision.chosen}} — {{decision.rationale}}
{{/each}}
{{/if}}

{{#if deferred_tasks}}
Deferred to future sessions
{{#each deferred_tasks}}
- {{task.id}} ({{phase.id}}): {{task.summary}} — {{task.deferred_reason}}
{{/each}}
{{/if}}

{{#if blocked_tasks}}
Blocked
{{#each blocked_tasks}}
- {{task.id}} ({{phase.id}}): {{task.summary}} — {{task.blocker}}
  Next: {{task.suggested_resolution}}
{{/each}}
{{/if}}

Phase gates passed:    {{gates_passed}}/{{gates_total}}
{{#each gate_results}}
- {{phase.id}} ({{gate_command}}): {{result}}
  ```{{output_snippet}}```
{{/each}}
Stop conditions tripped: {{stop_conditions | join(", ") | default("none")}}
Snapshot:              {{handoff_path | default("(none — task ongoing)")}}
Open watch:            {{open_watch | default("(none)")}}
```

## Variants

### Dry-run output (Phase 2 only — does not include execution sections)

```
PARALLEL PHASES — {{plan_title}} (DRY RUN)

Wave layout

{{#each phases}}
{{phase.id}} — {{phase.name}}
{{#each waves}}
  Wave {{wave.index}}: {{tasks | map(t => t.id + " [" + t.specialist + ", " + t.model_tier + "]") | join(", ")}}
{{/each}}
{{/each}}

Total tasks: {{total_tasks}}
Parallel waves: {{total_waves}}
Estimated concurrent fan-out (max wave): {{max_wave_size}}
Worktree allocation: {{#if use_worktrees}}{{worktree_count}}{{else}}none (default){{/if}}
Phase gates: {{#each phases}}{{phase.id}}: {{phase.gate_command | default("(auto-detect)")}}{{#unless @last}}, {{/unless}}{{/each}}
```

### Partial execution output (composite stopped mid-flight)

Same template as required, but add a banner at the top:

```
PARALLEL PHASES — {{plan_title}} (PARTIAL — stopped at {{stopped_at.phase_id}} {{stopped_at.wave}})
Reason: {{stop_reason}}
```

The "Phase gates passed" line should read `{{gates_passed}}/{{gates_attempted}}` to
make the partial state visible.

## Render examples

### Example 1 — Full success (from the screenshot intent)

```
PARALLEL PHASES — backlog-2026-05-14.md

Done in this session

| Phase | Task | Result |
| ----- | ---- | ------ |
| P1 — Land v0.24.0 | T1: Rebase PR #182 onto main | PR #182 rebased onto main + merged; release auto-tagged as v0.24.0 |
| P2 — Close stale issues | T2: Close #145 | Premise invalid — actions/checkout@v6.0.2 & setup-node@v6.4.0 both exist; recent PRs all green with @v6 pins. Issue closed. |
| P2 — Close stale issues | T3: Close #138 | Premise outdated post-PR #165: pt-BR locale was removed; localeBase = base (not prefixed); zero /pt-br/* pages built. Closed; #137/#139/#140/#141 received re-triage comments. |
| P2 — Close stale issues | T4: Publish v0.18.0 Draft | Published. v0.23.0 restored as Latest after the date-flip. |
| P5 — Close #147 | T5: Close #147 | Closed — already resolved by #181 (sync) + #183 (catalog:llms in workspace:validate). |
| Plan files | T6: Add backlog-2026-05-14.md | PR #184 merged: .claude/plans/backlog-2026-05-14.md added, 2026-05-06 marked superseded. |

State change
- Open issues: 27 → 24 (closed: #138, #145, #147)
- Open PRs:    1 → 0
- Latest release: v0.23.0 → v0.24.0
- Drafts: v0.18.0 Draft → published

Decisions made this run
- Wave sequencing for P2–P5
  Considered: single-wave merge-all / dual-wave (blocking → opportunistic) / sequential per phase
  Chose: single-wave merge-all — all 5 tasks have non-overlapping file scopes; P2 did not block P3–P5
- Skip pre-commit snapshot for release gate
  Considered: snapshot before tag / skip (repo clean) / snapshot after tag
  Chose: skip — repo has no staged changes; git status clean post-merge

Deferred to future sessions
- T7 (P3): Providers taxonomy, #154-#163, 10 issues — needs schema design call before #154
- T8 (P4): Tutorials/i18n — paused pending pt-BR re-triage answers + content-strategy intake for #144
- T9 (P5 rolling): #142, #143, #146, #149, #151, #152, #153 — opportunistic, each its own PR

Phase gates passed:    5/5
- P1 (npm run test): PASS
  ```All tests passed (847 tests, 3.2s)
  Test Suites: 12 passed, 12 total
  Snapshots: 0 total```
- P2 (npm run lint): PASS
  ```✓ 0 issues found
  1234 files linted```
- P3 (npm run build): PASS
  ```dist/ built successfully (890 KB)
  No warnings.```
- P4 (git status --porcelain): PASS
  ```git status: clean```
- P5 (npm run test-integration): PASS
  ```All integration tests passed (47 tests, 1.8s)```
Stop conditions tripped: none
Snapshot:              (none — task ongoing)
Open watch:            (none)
```

### Example 2 — Partial (BLOCKED in Phase 3)

```
PARALLEL PHASES — refactor-auth-module.md (PARTIAL — stopped at P3 wave 1)
Reason: BLOCKED — T5 (extract jwt verify) needs decision on rs256 vs hs256 default

Done in this session

| Phase | Task | Result |
| ----- | ---- | ------ |
| P1 — Audit | T1: list call sites | DONE — 47 call sites mapped to ~/.claude/notes/auth-callsites.md |
| P2 — Scaffold | T2: extract types | DONE — src/auth/types.ts created |
| P2 — Scaffold | T3: extract errors | DONE — src/auth/errors.ts created |
| P3 — Split modules | T4: extract session manager | DONE — src/auth/session.ts |
| P3 — Split modules | T5: extract jwt verify | BLOCKED — rs256 vs hs256 default unclear |

State change
- Open issues: 12 → 12
- Open PRs:    3 → 4 (opened: feature/auth-types-split)
- Latest release: v2.1.4 → v2.1.4
- Drafts: none

Decisions made this run
- Extraction order for P2–P3
  Considered: types→errors→session→jwt / errors→types→session→jwt / parallel split per file
  Chose: types→errors→session→jwt — session depends on types; jwt depends on types+errors
- Gate threshold for partial halt
  Considered: halt on gate fail / halt on blocker only / halt on both
  Chose: halt on blocker only — P2 gate passed; P3 gate not yet run

Blocked
- T5 (P3): extract jwt verify — rs256 vs hs256 default unclear
  Next: confirm with user; current `verify()` calls 4 production scopes with mixed alg

Phase gates passed:    2/3
- P1 (npm test src/auth): PASS
  ```PASS src/auth/
  4 specs, 4 passed (1.2s)```
- P2 (npm test src/auth): PASS
  ```PASS src/auth/types.ts, src/auth/errors.ts
  8 specs, 8 passed (1.5s)```
- P3 (npm test src/auth): NOT RUN
  ```(halted before phase gate execution)```
Stop conditions tripped: BLOCKED-in-wave
Snapshot:              ~/.claude/handoffs/auth-refactor/latest.md
Open watch:            (none)
```

## Notes for skill implementer

- The template uses Handlebars-style `{{…}}` placeholders for readability. The skill
  emits plain markdown; no real templating engine required.
- Always emit every section. Empty sections become `(none)` rows rather than being
  omitted (silent omission breaks the composite contract).
- `outcome_one_liner` for each task comes from the sub-agent's `NEXT_ACTION` field
  with a verb tweak (past tense), or from the task's `acceptance` if the agent
  reported just `DONE` without elaboration.
- `Open watch` is populated from any `(deferred-until <date>)` tags in task results
  or from explicit `--watch` user flags. Empty if none.
- `result` in phase gate entries is a single-word status derived from the gate
  command's exit code: `PASS` (exit 0), `FAIL` (non-zero exit), `NOT RUN` (gate
  skipped before execution — e.g., wave was blocked), `PARTIAL` (gate ran but
  output was ambiguous / non-zero on subset). Do not use free-text; the reconcile
  viewer keys on these exact tokens.
- `output_snippet` for gate results is the first 3 non-empty lines of stdout/stderr,
  truncated to 200 chars. For `NOT RUN` gates, use `(halted before execution)` as
  the placeholder — no command was run, so no output exists.
- **Decisions Made** must always be populated by the orchestrator — never left empty.
  If execution followed the default path with no forks, add one entry explaining why:
  e.g., "Wave sequencing: single-wave chosen — all tasks had non-overlapping scopes."
  An empty `decisions` array is a contract violation; the audit trail exists precisely
  to document non-obvious choices, including the choice to take the default path.
- **Decisions Made** is populated by the orchestrator (not wave agents). Log every fork in execution:
  - Why one wave was chosen over another (e.g., single-wave vs. multi-wave, blocking vs. non-blocking)
  - Why a task was skipped or deferred
  - Why gate output was acceptable (e.g., pre-gate snapshot skipped because repo is clean)
  - Each decision must record Considered alternatives, Chose (the final decision), and Rationale
  - This is the audit trail for execution divergence from the plan.
- **output_snippet** for gate results: first 3 non-empty lines of stdout/stderr from the gate command.
  Truncate at 200 characters if longer. Preserve command exit code or status indicator (PASS / FAIL / NOT RUN)
  in the `result` field so readers can scan status at a glance.

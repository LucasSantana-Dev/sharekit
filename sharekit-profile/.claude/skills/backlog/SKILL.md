---
name: backlog
description: Composite - end-to-end backlog builder for a single repo. Analyzes the repo (audit-deep + ecosystem-health context + repo-state-snapshot evidence) in parallel, ROI-ranks findings (severity × urgency / effort), proposes them in chat for confirmation, generates full specs via adt-specs-spec-new for category=feature items, generates a plan file in plan-to-issues format, creates GitHub issues via plan-to-issues (deduped against existing open issues), and adds them to the global "Active Backlog" Project board with severity/effort/repo fields. Replaces running audit-deep + adt-specs-spec-new + plan-to-issues + manual board updates separately.
user-invocable: true
auto-invoke: build a backlog, generate a backlog, find gaps, find opportunities, refactoring opportunities, what should i work on, what is missing in this repo, audit and plan, comprehensive backlog, project audit and plan
metadata:
  owner: global-agents
  tier: contextual
---

# /backlog

End-to-end backlog builder for a single repo. Turns "what's wrong or missing
here?" into a curated, ROI-ranked, deduped set of GitHub issues on a Project
board — with full specs for new features and a propose-then-confirm gate
before any GitHub write.

Replaces running these separately:
- `/audit-deep` (discover findings)
- `/repo-state-snapshot` (capture current state)
- `/ecosystem-health` (cross-repo context, when applicable)
- `/adt-specs-spec-new` (write feature specs)
- `/plan-to-issues` (create GH issues from plan)
- manual `gh project item-add` per card

## When this fires

User phrases (matched by `~/.claude/hooks/composite-router.sh`):
- "build a backlog for this repo"
- "generate a backlog"
- "find gaps in this project"
- "find refactoring opportunities"
- "what should I work on"
- "what's missing in this repo"
- "audit and plan"
- "comprehensive backlog"
- "project audit and plan"

Auto-queued by:
- `/onboard-new-repo` (after initial repo intake, suggests `/backlog` as the
  "ok, now what?" follow-up)

Auto-queues at end:
- `/next-priority` (so the user knows what to start from the freshly-ranked board)

## Workflow — 8-phase composite

**Precondition:** active repo (cwd), authenticated `gh` CLI.

## Preamble — RAG pre-flight

Before generating a new backlog, query recent backlog runs for this repo:

```bash
graphify query "backlog <repo-name> findings issues" --budget 300
```

- If result shows a backlog run for the same repo within 3 days at the same commit range → surface it, ask user to confirm whether to run fresh or review existing items.
- If no recent match → proceed to Phase 1.

**Done when:** cached backlog surfaced or no match found (proceed to Phase 1).

---

### Phase 1 — Discover (parallel, read-only)

Invokes **3 discovery skills in parallel** (single message, multiple tool calls):
1. `audit-deep` → findings ranked by severity
2. `ecosystem-health --focus <repo>` → (conditional, only if repo is in known ecosystem) comparative status
3. `repo-state-snapshot --label backlog-<YYYY-MM-DD>` → factual branch/PR/issue snapshot

Also runs inline shell script `~/.claude/skills/backlog/scripts/discover.sh` in parallel to collect:
- Open issue corpus (for dedup)
- 90-day commit activity
- Code markers (TODO/FIXME/HACK/XXX, capped 200)

**Stop condition:** If not in git repo → abort. Reconcile: `Discover: (failed: not a git repo)`.

**Output feeds:** structured findings list + dedup corpus + evidence pool to Phase 2.

**Done when:** audit-deep, ecosystem-health, and repo-state-snapshot outputs received; discover.sh script completes; dedup corpus available.

See `references/workflow.md § Phase 1` for discovery source mapping and marker extraction.

### Phase 2 — Categorize, dedup, rank (read-only)

Pure composite logic: normalize findings into schema (title, category, severity, effort, evidence, acceptance criteria, dedup_key).

**Categorization:** see `references/workflow.md § Phase 2 — Source Mapping` for audit-deep skill → category rules.

**Effort:** rule-based on category + scope (xs=<1h, s=1-4h, m=1-2d, l=>2d).

**Dedup:** run `scripts/dedup.sh` against open issues. Verdict per finding: skip (exact match), duplicate-of (fuzzy title ≥0.85 Levenshtein), or new.

**Ranking:** ROI formula (see `references/workflow.md § Phase 2 — ROI Score`): `(severity_weight × urgency) / effort_weight`. Sort descending. Cap at `max_findings_per_run` (default 25, configurable).

**Output:** ranked, deduped findings array to Phase 3.

**Done when:** dedup script runs and reports verdict per finding; findings array printed with N items, each with title, category, severity, effort, ROI score, and evidence link.

### Phase 3 — Propose (interactive gate)

Print ranked table (fields: # | ROI | Title | Category | Severity | Effort | Evidence) to chat.

**Gated prompt:** ask user which rows to approve. Accepts "1,3,5-8", "all", "none", "cat:feature", "sev:high+", "top:N", plus dup handling: "keep dup" / "skip dup" / "comment dup".

**Block until response.** No GitHub writes happen before this gate.

Parse approval, build approved set, partition by handling (new-issue, comment-on-existing, skip).

**Done when:** user submits approval response; approved set printed with count and handling partition.

See `references/output-patterns.md § Proposal Table` for format details.

### Critic gate (after approved findings confirmed)

Dispatch ONE `Explore` agentType critic — read-only, never edits — with:

> "Challenge these approved backlog items: Which are duplicates of existing open issues? Which are over-scoped (should be 2–3 smaller items)? Which severity ratings are off? What important class of issue (test coverage, dead code, security, performance) is missing from this batch?"

- If critic identifies ≥1 duplicate, mis-sized, or missing class → revise approved set before Phase 4.
- Minor concerns → log in run summary, proceed to Phase 4.

**Done when:** critic verdict returned; duplicates removed from approved set, missing classes considered and added or none found.

### Phase 4 — Spec generation (features only, conditional)

For each approved finding where `category == feature`:
1. Slug title → kebab-case, max 50 chars
2. Invoke `adt-specs-spec-new` via Bash (wraps Python script)
3. Capture returned spec folder
4. Append finding content (title → Goal, evidence → Context, suggested_approach → Approach, acceptance_criteria → Verification)
5. Stash slug → spec_path mapping for Phase 6

**Skip condition:** if no features approved → `Spec: (skipped: no features approved)`.

**Done when:** each feature spec folder created and listed with slug; mapping of feature.title → spec_path printed.

### Phase 5 — Write plan file (read-only)

Generate `.claude/backlog/<YYYY-MM-DD>.md` (or `-1`, `-2` if same-day re-run). Header from `templates/plan-header.md`, then task list grouped by phase (Phase 1 = critical+high, Phase 2 = medium, Phase 3 = low).

**Done when:** plan file written to disk; file path printed; task count per phase visible in file.

See `references/output-patterns.md § Plan File Structure` for template.

### Phase 6 — Create issues + labels (GitHub write, post-approval)

**Step 6a:** idempotent label creation (cat/sev/effort labels + backlog-skill).

**Step 6b:** invoke `/plan-to-issues` to create issues from plan file.

**Step 6c:** post-process each issue: add labels, prepend spec link if feature, append dedup footer.

Handle `comment dup` choices: leave comment on existing issue instead of creating new one.

**Stop condition:** if `gh auth status` fails → `Issues: (failed: gh not authenticated — run gh auth login)`. Plan file preserved.

**Done when:** each issue created or comment posted; issue URLs and status printed; spec link prepended to feature issues; dedup footer appended.

See `references/workflow.md § Phase 6` for label colors and full command details.

### Phase 7 — Add to Project board (GitHub write, post-approval)

**Step 7a:** resolve target board. If missing, ask user: "Create one now? (y/N)". On `y`, create and save to `.claude/backlog-config.json`. On `N`, skip Phase 7.

**Step 7b:** ensure Priority/Effort/Repo fields exist on board.

**Step 7c:** add each approved issue as a card (ROI-descending order).

**Stop condition:** if board missing AND user declines → `Board: (skipped: user declined creation)`. Issues stay created.

**Done when:** board URL printed; N cards added in ROI-descending order; Repo field value set on each card.

### Phase 8 — Snapshot, memory, queue (read-only)

**Step 8a:** append run summary to plan file (created/skipped/failed counts, board URL, spec paths).

**Step 8b:** save run memory at `~/.claude/projects/*/memory/backlog_<repo-slug>_<YYYY-MM-DD>.md`. Append pointer to `MEMORY.md` (first run per repo only; subsequent runs update).

**Step 8c:** declare `/next-priority` queueing (not silently invoked; per composite-contract).

**Done when:** memory file written; MEMORY.md pointer added (first run) or updated (subsequent runs); `/next-priority` queuing message printed.

## Reconciliation block

Every run ends with this block (verbatim shape, all phases present):

```
BACKLOG — <owner>/<repo>
  Discover:   <N findings> (skills: audit-deep, ecosystem-health, repo-state-snapshot)
  Rank:       <M ranked from N> (<K skipped: existing-issue dedup>)
  Propose:    <U approved by user, V rejected>
  Spec:       <F feature specs generated | (skipped: no features approved)>
  Plan:       .claude/backlog/<YYYY-MM-DD>.md
  Issues:     <list of #N URLs | (failed: <reason>)>
  Board:      <board URL with N cards added | (skipped: <reason>)>
  Snapshot:   ~/.claude/projects/*/memory/backlog_<repo>_<date>.md
  Queued:     /next-priority
  Open watch: <future-dated follow-up for any feature with ramp/cleanup date | (none)>
```

Skipped phases: `(skipped: <reason>)`. Failed phases: `(failed: <reason>)` — chain continues.

## Configuration

Per-repo config: `.claude/backlog-config.json` (all fields optional, defaults applied if absent).

See `references/config-schema.md` for full schema, field reference, and defaults.

## Stop conditions & negative rules

See `references/stop-conditions.md` for:
- When to abort (not git repo, no auth, empty backlog, user rejects all, etc.)
- Reconciliation rules (every phase has a line, never silent skip)
- Negative rules (no cross-repo, no specs for non-features, read-only for app code, etc.)

## Key invariants

- **3-skill parallel discovery:** audit-deep, ecosystem-health, repo-state-snapshot run concurrently in Phase 1.
- **Single-repo scope:** `/ecosystem-health` is the multi-repo entry point. If user asks for cross-repo backlog, redirect.
- **User approval gate in Phase 3:** no GitHub writes before explicit approval.
- **Dedup before write:** Phase 2 dedup runs before plan; Phase 6 only implements approved set.
- **Durable plan file:** written before issue creation, survives mid-run interruption (can resume via manual `/plan-to-issues`).
- **Read-only for app code:** only writes plan, spec, config, label, and memory files.
- **Project board creation requires explicit user `y`:** no silent auto-create (composite-contract's no-silent-bail-out).
- **No re-invoke audit-deep mid-run:** Phase 1 runs once; Phase 2 reuses its output memory file.

## Related skills & standards

- `audit-deep` — primary findings source. See `standards/skill-auto-invoke.md` for auto-chain triggers.
- `repo-state-snapshot` — factual branch/PR/issue metadata capture.
- `ecosystem-health` — cross-repo comparative analysis (conditional; invoke only for known ecosystems).
- `adt-specs-spec-new` — feature spec generation from template (Phase 4).
- `plan-to-issues` — converts plan file to GitHub issues (Phase 6).
- `next-priority` — picks highest-value item from backlog (Phase 8 queue).
- `composite-contract.md` — composite skill contracts (no silent bail-out, phase names immutable).
- `standards/parallel-execution.md` — parallel tool dispatch guidance (Phase 1).
- `references/memory-integration.md` — Phase 2.5 memory-check pattern, backlog snapshot staling, `/recall` integration.

## Glossary

| Term | Definition |
|---|---|
| **ROI** | Severity-weighted urgency divided by effort. Ranks findings for prioritization. |
| **Dedup key** | Unique identifier (audit-deep:<root>:<scope> or code-marker:<file>:<line>) used to match against existing open issues. |
| **Ecosystem** | Set of related repos (e.g., vsantana-organization, forgekit). Triggers ecosystem-health conditional. |
| **Active Backlog** | User-scoped GitHub Project board (@me) holding issues across all repos, with Repo field for source distinction. |
| **Spec** | Feature specification (category=feature only) generated in docs/specs/<date>-<slug>/ by adt-specs-spec-new. |

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "These findings are obvious — I don't need the critic check" | The most obvious-seeming items are most likely to be duplicates of existing open issues. Critic catches what fast reading misses. |
| "I'll skip the RAG pre-flight — the last backlog was a while ago" | 3 days and no new commits = same codebase = same findings. Pre-flight costs 300 tokens and surfaces stale work. |
| "This item is too small to track" | Small items are fastest to fix and create the most cognitive debt when left untracked. Tracked small wins compound. |
| "I'll batch these 5 related issues into one" | Batched issues block parallelization. Separate what can be worked independently; link related ones via references. |
| "The critic will just slow me down" | Critic catches 1–2 duplicates per run on average (validated in memory). False positives rare; false negatives are silent debt. |

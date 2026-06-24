---
name: repo-state-snapshot
description: Take a labeled snapshot of repo state (sha, open issue count, open PR count, latest release, drafts, uncommitted files) and optionally diff against a prior snapshot. Used by /parallel-phases for before/after reconciliation, and by ad-hoc workflows that want "what changed in this session" deltas.
user-invocable: true
auto-invoke: composite-internal + "snapshot repo state" + "what changed since X"
argument-hint: '--label <name> [--diff <prior-label>] [--dir <path>] [--quiet]'
triggers:
  - snapshot repo state
  - what changed in this session
  - state diff
  - repo state snapshot
metadata:
  owner: global-agents
  tier: contextual
  canonical_source: ~/.claude/skills/repo-state-snapshot
---

# Repo State Snapshot

One-shot snapshot of repo state. Two modes:
1. **`--label <name>`** — write a labeled snapshot to disk.
2. **`--diff <prior-label>`** — write a new snapshot AND print the human-readable diff
   against the named prior. Used at the end of a workflow to show what changed.

## When this fires

Most commonly invoked internally by other composites:
- `/parallel-phases` Phase 3 (pre-snapshot) and Phase 5 (post-snapshot with diff)
- `/release-cut` to compute "what released this version"
- `/branch-hygiene` to track local-branch-count changes
- `/audit-deep` to track week-over-week project health

User can also invoke directly when they want to capture state before risky work.

## Inputs

- `--label <name>` — required. Identifier for this snapshot.
  Convention: `<workflow>-<phase>` like `parallel-phases-start` or `release-cut-pre`.
- `--diff <prior-label>` — optional. Print human-readable delta against that prior
  snapshot AFTER writing the new one. The prior must exist in the same repo's
  snapshot dir.
- `--dir <path>` — optional. Repo directory; defaults to current working dir.
- `--quiet` — only emit JSON path; suppress the human-readable summary.

## Captured fields

```json
{
  "label": "parallel-phases-start",
  "timestamp": "2026-05-14T18:32:01Z",
  "repo": {
    "name": "vsantana-org/lucky",
    "dir": "${DEV_ROOT}/Lucky",
    "branch": "feature/guild-config",
    "head_sha": "a4d1aae",
    "head_subject": "wip: schema design"
  },
  "git": {
    "uncommitted_files": 3,
    "untracked_files": 1,
    "ahead": 2,
    "behind": 0
  },
  "issues": {
    "open_count": 27,
    "open_numbers": [138, 145, 147, 154, ...]
  },
  "prs": {
    "open_count": 1,
    "open_numbers": [182]
  },
  "releases": {
    "latest_tag": "v0.23.0",
    "latest_published_at": "2026-05-10T14:00:00Z",
    "drafts": ["v0.18.0 Draft"]
  }
}
```

## Workflow

### Step 1 — Resolve repo

- `cd <--dir or .>`
- `git rev-parse --show-toplevel` to confirm we're in a repo (error if not).
- `git remote get-url origin` → strip to `owner/name`. Cache.

### Step 2 — Gather data

In parallel where possible:

```bash
# git state
git rev-parse HEAD                       # head_sha
git log -1 --format=%s                   # head_subject
git rev-parse --abbrev-ref HEAD          # branch
git status --porcelain | wc -l           # uncommitted+untracked (split below)
git status --porcelain | grep -c '^??'   # untracked only (then subtract)
git rev-list --left-right --count HEAD...@{u} 2>/dev/null  # ahead/behind

# gh state (gracefully degrade if gh unavailable or unauthenticated)
gh issue list --state open --json number --limit 200 --jq 'length'
gh issue list --state open --json number --limit 200 --jq '[.[].number]'
gh pr list --state open --json number --limit 100 --jq 'length'
gh pr list --state open --json number --limit 100 --jq '[.[].number]'

# release state
gh release list --limit 20 --json tagName,publishedAt,isDraft
# parse: latest_tag = first non-draft tagName; drafts = filter isDraft=true
```

Each gh call has a timeout of 10s. On timeout/error, mark that field `null` in the
JSON and surface a warning in the human-readable output.

### Step 3 — Write snapshot

Save to `~/.claude/state/snapshots/<owner>__<name>/<label>.json` (slashes in repo
name replaced with `__`).

If the file already exists, atomic-rename the prior to `<label>.json.prev` so a
diff is still possible after one re-snapshot — but don't keep more than one
`.prev` (the next overwrite will discard older ones).

### Step 4 — Diff (if `--diff <prior>` set)

Load the prior. Compute deltas:
- `head_sha`: list commit subjects between prior and current (via
  `git log <prior_sha>..<current_sha> --format='%h %s'`, capped at 20 lines)
- `branch`: simple before → after
- `uncommitted_files`: numeric delta
- `open_issues`: count delta + which numbers were closed (in prior but not now)
  and which were opened (in now but not prior)
- `open_prs`: same
- `latest_tag`: before → after
- `drafts`: added/removed list

### Step 5 — Print summary

Default (unless `--quiet`):

```
REPO STATE SNAPSHOT — <owner>/<name>

Label: <new-label>     <timestamp>
Saved: ~/.claude/state/snapshots/<owner>__<name>/<new-label>.json

Current state
  Branch:        <branch> (<ahead>↑ <behind>↓)
  HEAD:          <sha-short> <subject>
  Uncommitted:   <N> files
  Untracked:     <N> files
  Open issues:   <N>
  Open PRs:      <N>
  Latest release: <tag> (<age>)
  Drafts:        <list or "none">
```

When `--diff <prior>` is set, append a delta block:

```
Diff vs. <prior-label>
  HEAD: <prior-sha> → <current-sha>
  Commits since (newest first):
    a4d1aae wip: schema design
    8f3b2c1 feat: add guild config command
    ...
  Branch: <prior-branch> → <current-branch> (if changed)
  Open issues: 27 → 24 (closed: #138, #145, #147; opened: none)
  Open PRs:    1 → 0 (closed/merged: #182; opened: none)
  Latest release: v0.23.0 → v0.24.0
  Drafts: v0.18.0 Draft → published
  Uncommitted files: 3 → 0
```

## Stop conditions

- Not a git repo → exit with usage error
- `gh` unauthenticated → continue with `null` for gh fields and `(skipped: not authenticated)` in summary
- `--diff <prior>` but prior file doesn't exist → emit new snapshot, skip the diff block, warn "no prior snapshot at <path>"

## Negative rules

- Do NOT write outside `~/.claude/state/snapshots/`.
- Do NOT log issue/PR titles or bodies — only numbers. (Privacy + log volume.)
- Do NOT auth as a different user; respect existing `gh auth`.
- Do NOT delete prior snapshots (only the implicit `.prev` overwrite in Step 3 is allowed).

## Outputs / Evidence

- JSON file path (always)
- Human-readable summary (unless `--quiet`)
- Diff block (when `--diff` set and prior exists)

## Configuration

Optional `~/.claude/skills/repo-state-snapshot/config.json`:

```json
{
  "snapshot_dir": "~/.claude/state/snapshots",
  "gh_timeout_seconds": 10,
  "max_open_numbers_logged": 200,
  "diff_commit_log_cap": 20
}
```

## Related skills

- `/parallel-phases` — primary consumer (Phase 3 + Phase 5)
- `/pr-snapshot` — broader PR-queue snapshot (this skill is narrower, just counts + numbers)
- `/next-priority` — uses snapshot data to rank priorities
- `git-master` agent — used internally for git operations

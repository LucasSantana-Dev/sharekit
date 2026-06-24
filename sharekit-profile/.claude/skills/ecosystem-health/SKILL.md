---
name: ecosystem-health
description: Scan a workspace or monorepo and return a raw health snapshot of repos,
  packages, and current operational state. Use when the user wants a quick ecosystem
  status view rather than a ranked priority decision.
argument-hint: '[focus <repo>]'
metadata:
  owner: global-agents
  tier: stateful
  canonical_source: ~/.agents/skills/ecosystem-health
---

# Ecosystem Health — Lightweight Status Dashboard

Show the state of all workspace repos in one compact view. Uses zero subagents — just direct shell calls for raw status.

## Repo Detection

Auto-detect repos from workspace configuration:

```bash
# Detect workspace repos
python3 -c "
import json, os, subprocess, glob

root = subprocess.run(['git', 'rev-parse', '--show-toplevel'], capture_output=True, text=True).stdout.strip()
repos = []

# Check package.json workspaces
pkg_path = os.path.join(root, 'package.json')
if os.path.exists(pkg_path):
    with open(pkg_path) as f:
        ws = json.load(f).get('workspaces', [])
    if isinstance(ws, dict): ws = ws.get('packages', [])
    for pattern in ws:
        for path in glob.glob(os.path.join(root, pattern)):
            if os.path.isdir(path):
                repos.append(path)

# Fallback: sibling git repos in parent dir
if not repos:
    parent = os.path.dirname(root)
    for entry in sorted(os.listdir(parent)):
        full = os.path.join(parent, entry)
        if os.path.isdir(os.path.join(full, '.git')):
            repos.append(full)

for r in repos:
    print(r)
"
```

## Execution

Run parallel shell calls per repo:

```bash
cd <path> && echo "=== <name> ===" && \
  git describe --tags --abbrev=0 2>/dev/null || echo "no tags" && \
  git branch --show-current && \
  git status --short | head -5 && \
  REPO_SLUG=$(git remote get-url origin 2>/dev/null | sed 's/.*github.com[:/]\(.*\)\.git/\1/' | sed 's/.*github.com[:/]\(.*\)/\1/') && \
  [ -n "$REPO_SLUG" ] && gh pr list --repo "$REPO_SLUG" --state open --limit 3 2>/dev/null && \
  [ -n "$REPO_SLUG" ] && gh issue list --repo "$REPO_SLUG" --state open --limit 3 2>/dev/null
```

## Output Format

```
┌─ ECOSYSTEM HEALTH ───────────────────────────────┐
│                                                    │
│ project-a     v1.2.0  main  [OK] clean   0 PR  1 issue │
│ project-b     v0.5.1  main  [OK] clean   0 PR  0 issues │
│ project-c     v0.3.0  main  [WARN] dirty   1 PR  2 issues │
│                                                    │
│ Legend: [OK] clean  [WARN] dirty   not-on-main         │
└────────────────────────────────────────────────────┘
```

## Rules

- NO subagents — all direct shell calls
- NO scoring or recommendations (use `next-priority` for that)
- Parallel execution for speed
- If a repo path doesn't exist locally, show as `⬜ not cloned`

## Memory Hooks

- Read memory before acting when queue state, repo history, or prior operational decisions affect correctness.
- Write back only durable conventions, confirmed outcomes, or workflow state worth reusing later.

## Failure / Stop Conditions

- Stop if key prerequisites are missing or the request changes scope enough that the current workflow no longer fits.

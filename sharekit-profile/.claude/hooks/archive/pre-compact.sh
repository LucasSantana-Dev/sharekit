#!/usr/bin/env bash
set -euo pipefail
WORKDIR="${CLAUDE_PROJECT_DIR:-$PWD}"
HANDOFF_BASE="$HOME/.claude/handoffs"
mkdir -p "$HANDOFF_BASE"
project_slug() {
  local remote
  remote=$(cd "$WORKDIR" 2>/dev/null && git remote get-url origin 2>/dev/null || true)
  if [ -n "$remote" ]; then
    printf '%s\n' "$remote" | sed 's|.*[:/]\([^/]*/[^/]*\)\.git$|\1|;s|.*[:/]\([^/]*/[^/]*\)$|\1|' | tr '/' '-' | tr '[:upper:]' '[:lower:]'
  else
    basename "$WORKDIR" | tr '[:upper:]' '[:lower:]'
  fi
}
PROJECT=$(project_slug)
DIR="$HANDOFF_BASE/$PROJECT"
mkdir -p "$DIR"
STAMP=$(date +%Y-%m-%d-%H-%M)
FILE="$DIR/pre-compact-$STAMP.md"
LATEST="$DIR/latest.md"
BRANCH=$(cd "$WORKDIR" 2>/dev/null && git branch --show-current 2>/dev/null || echo unknown)
PLAN=$(ls -t "$WORKDIR"/.agents/plans/*.md "$WORKDIR"/.claude/plans/*.md 2>/dev/null | head -1 || true)
NEXT=$(grep -nE '^### Phase|^## Phase|^- \[ \]' "$PLAN" 2>/dev/null | head -5 || true)
cat > "$FILE" <<EOT
# Pre-Compact Snapshot

## Objective
Resume the current task from the latest active plan or handoff.

## Active scope
- Repo: $PROJECT
- Branch: $BRANCH
- Worktree: $WORKDIR

## Active plan
$PLAN

## Next visible steps
$NEXT

## Git summary
$(cd "$WORKDIR" 2>/dev/null && git status --short 2>/dev/null | head -20)
EOT
cp "$FILE" "$LATEST"
cp "$FILE" "$HANDOFF_BASE/latest.md"
echo "Saved snapshot → $FILE"

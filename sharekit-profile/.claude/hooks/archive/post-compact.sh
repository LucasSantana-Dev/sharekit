#!/usr/bin/env bash
set -euo pipefail
WORKDIR="${CLAUDE_PROJECT_DIR:-$PWD}"
HANDOFF_BASE="$HOME/.claude/handoffs"
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
FILE="$HANDOFF_BASE/$PROJECT/latest.md"
if [ -f "$FILE" ]; then head -40 "$FILE"; exit 0; fi
GLOBAL="$HANDOFF_BASE/latest.md"
if [ -f "$GLOBAL" ]; then head -40 "$GLOBAL"; else echo "Context compacted. No handoff found; inspect the active plan."; fi

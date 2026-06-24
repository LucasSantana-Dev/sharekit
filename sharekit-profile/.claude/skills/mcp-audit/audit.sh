#!/usr/bin/env bash
# mcp-audit: scan Claude Code session JSONLs for MCP tool usage.
# Read-only. Outputs markdown to stdout.
set -euo pipefail

DAYS="${1:-30}"
PROJECTS_DIR="$HOME/.claude/projects"
SINCE_EPOCH=$(date -v-"${DAYS}"d +%s 2>/dev/null || date -d "${DAYS} days ago" +%s)

if [ ! -d "$PROJECTS_DIR" ]; then
  echo "no projects dir at $PROJECTS_DIR"
  exit 1
fi

TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT

while IFS= read -r f; do
  mt=$(stat -f %m "$f" 2>/dev/null || stat -c %Y "$f" 2>/dev/null || echo 0)
  [ "$mt" -ge "$SINCE_EPOCH" ] || continue
  jq -r 'select(.type == "assistant") | .message.content[]? | select(.type == "tool_use") | .name' "$f" 2>/dev/null \
    | grep -E '^mcp__' \
    | awk -F'__' '{server=$2; tool=""; for(i=3;i<=NF;i++){tool=tool (i>3?"__":"") $i}; print server "\t" tool}' \
    >> "$TMP" || true
done < <(find "$PROJECTS_DIR" -name "*.jsonl" -type f)

echo "# MCP usage audit — last ${DAYS} days"
echo
echo "Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo
echo "## By server"
echo
echo "| Calls | Server |"
echo "|---|---|"
cut -f1 "$TMP" | sort | uniq -c | sort -rn | awk '{printf "| %d | %s |\n", $1, $2}'
echo
echo "## Top 20 tools"
echo
echo "| Calls | Server | Tool |"
echo "|---|---|---|"
sort "$TMP" | uniq -c | sort -rn | head -20 \
  | awk '{n=$1; $1=""; sub(/^ /,""); printf "| %d | %s |\n", n, $0}' \
  | sed 's/\t/ | /'
echo
echo "## Zero-use connected servers"
echo
USED=$(cut -f1 "$TMP" | sort -u)
CONNECTED=$(claude mcp list 2>/dev/null \
  | grep 'Connected' \
  | sed 's/:.*$//' \
  | sed 's/^[[:space:]]*//' \
  | sed 's/^claude\.ai /claude_ai_/' \
  | sed 's/^plugin:[^:]*:/plugin_/' \
  | tr ' ' '_' | tr 'A-Z' 'a-z' | sort -u)
if [ -z "$CONNECTED" ]; then
  echo "_(could not list connected servers)_"
else
  zero=$(comm -23 <(echo "$CONNECTED") <(echo "$USED" | tr 'A-Z' 'a-z') 2>/dev/null)
  if [ -z "$zero" ]; then
    echo "_(none — every connected server saw at least 1 call)_"
  else
    echo "$zero" | sed 's/^/- /'
  fi
fi
echo
echo "## Single-use servers (1–3 calls)"
echo
single=$(cut -f1 "$TMP" | sort | uniq -c | awk '$1 >= 1 && $1 <= 3 {printf "- %s (%d calls)\n", $2, $1}')
if [ -z "$single" ]; then
  echo "_(none)_"
else
  echo "$single"
fi
echo
echo "---"
echo "_Counts tool invocations only — not tokens, not wall time. A single high-value call may outweigh 100 low-value ones._"

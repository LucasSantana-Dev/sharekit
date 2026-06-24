#!/usr/bin/env bash
# tool-bloat-guard.sh — PostToolUse hook. Nudges the assistant to summarize
# rather than echo when tool output is large. Hooks can't truncate the tool
# response (harness already added it to context), but a strong systemMessage
# steers the assistant away from re-displaying or re-reading the content.
#
# Tiers:
#   10-25KB   → soft nudge ("summarize, don't echo")
#   25-100KB  → strong nudge ("don't re-read this; reference by file:line")
#   100KB+    → urgent ("/compact when ≥50% full")
#
# Tracks cumulative-per-session bloat in state file.

set -euo pipefail

# Drain stdin and extract response length
INPUT=$(cat 2>/dev/null || true)
BYTES=$(printf '%s' "$INPUT" | jq -r '.tool_response.content // "" | tostring | length' 2>/dev/null || echo 0)
TOOL=$(printf '%s' "$INPUT" | jq -r '.tool_name // "tool"' 2>/dev/null)

# Skip tiny outputs (most of them)
[ "$BYTES" -lt 10000 ] && exit 0

# Cumulative per-session tracking (not gated by SID — fail soft)
SID="${CLAUDE_CODE_SESSION_ID:-default}"
STATE_DIR="$HOME/.claude/state/tool-bloat"
mkdir -p "$STATE_DIR"
STATE_FILE="$STATE_DIR/$SID"
TOTAL=$(cat "$STATE_FILE" 2>/dev/null || echo 0)
TOTAL=$((TOTAL + BYTES))
echo "$TOTAL" > "$STATE_FILE"

KB=$((BYTES / 1000))
TOTAL_KB=$((TOTAL / 1000))

if [ "$BYTES" -ge 100000 ]; then
  TIER="urgent"
  MSG="🚨 Very large ${TOOL} output (${KB} KB). Session bloat: ${TOTAL_KB} KB cumulative. **Summarize in 1-2 lines; do NOT echo or quote large chunks. Reference by file:line.** Consider /compact if context ≥50%."
elif [ "$BYTES" -ge 25000 ]; then
  TIER="strong"
  MSG="⚠️ Large ${TOOL} output (${KB} KB). Session bloat: ${TOTAL_KB} KB. Do not re-read this file/run this command — reference it by location. Summarize ≤3 lines in any response."
else
  # 10-25KB
  TIER="soft"
  MSG="📊 ${TOOL} returned ${KB} KB. Summarize in your response — do not echo full output back to the user."
fi

jq -n --arg m "$MSG" '{"systemMessage": $m}' 2>/dev/null || \
  python3 -c "import json,sys; print(json.dumps({'systemMessage': sys.argv[1]}))" "$MSG"

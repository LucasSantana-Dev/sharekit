#!/usr/bin/env bash
# caveman-inject.sh — UserPromptSubmit hook. If caveman mode is ON for this
# session, inject a terse-output system message. Silent when OFF.

set -euo pipefail
SID="${CLAUDE_CODE_SESSION_ID:-}"
[ -z "$SID" ] && exit 0

STATE_FILE="$HOME/.claude/state/caveman/$SID"
[ -f "$STATE_FILE" ] || exit 0
[ "$(cat "$STATE_FILE" 2>/dev/null)" = "on" ] || exit 0

# Drain stdin (we don't need the prompt for this hook)
cat >/dev/null 2>&1 || true

MSG='🪨 caveman mode ON. Apply for this response:
- No preamble ("Let me…", "I'\''ll…", "Sure!", "Great question") — answer directly.
- No recap of the user'\''s request.
- No closing fluff ("Let me know if…", "Hope that helps").
- Bullets over prose; each bullet ≤12 words.
- Code-only when asked to code; explain ONLY if asked.
- Tool outputs: summarize 1 line, do not echo.
- Skip table-of-contents; do the work, do not pre-announce phases.
- Status updates ≤1 line.
- If answer needs >15 lines, ask before expanding.
Toggle off with `/caveman off` when depth or recap is wanted.'

jq -n --arg m "$MSG" '{"systemMessage": $m}' 2>/dev/null || \
  python3 -c "import json,sys; print(json.dumps({'systemMessage': sys.argv[1]}))" "$MSG"

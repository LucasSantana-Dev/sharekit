#!/usr/bin/env bash
# model-tier-router.sh — suggest /model sonnet for routine prompts and
# /model opus for depth-requiring prompts, per ADR
# 2026-05-13-model-tier-strategy.md.
#
# Heuristic (hooks can't change the model — only advise):
#   - Detect current session model from latest assistant turn in JSONL.
#   - Classify the incoming prompt as DEPTH or ROUTINE.
#   - If DEPTH AND on sonnet/haiku → suggest /model opus.
#   - If ROUTINE AND on opus → suggest /model sonnet.
#   - Fire at most once per direction per session (state file).
#
# DEPTH triggers (matches composites + critic-style work):
#   research-and-decide | critic | audit-deep | three-man-team |
#   architecture | security review | root cause | trade-?off
#
# ROUTINE is the default — anything else that doesn't hit DEPTH triggers.

set -euo pipefail

SID="${CLAUDE_CODE_SESSION_ID:-}"
[ -z "$SID" ] && exit 0

INPUT=$(cat 2>/dev/null || true)
PROMPT=$(python3 -c 'import json,sys
try:
 d=json.loads(sys.stdin.read() or "{}")
 print(d.get("prompt") or d.get("user_prompt") or "")
except Exception:
 print("")' <<< "$INPUT")

# Skip trivial prompts — slash commands and short utterances aren't worth advising on
[ ${#PROMPT} -lt 30 ] && exit 0

STATE_DIR="$HOME/.claude/state/model-tier-router"
mkdir -p "$STATE_DIR"
STATE_FILE="$STATE_DIR/$SID"

# Locate session JSONL
JSONL=$(find "$HOME/.claude/projects" -maxdepth 2 -name "${SID}.jsonl" -type f 2>/dev/null | head -1)
[ -z "$JSONL" ] && exit 0

# Detect current model from last assistant turn — read file in Python (portable,
# no SIGPIPE from tac|head). Tails last 400 lines to keep it fast on long sessions.
CURRENT_MODEL=$(python3 - "$JSONL" <<'PY' 2>/dev/null || true
import json, sys
path = sys.argv[1]
try:
    with open(path) as f:
        lines = f.readlines()
except Exception:
    sys.exit(0)
for line in reversed(lines[-400:]):
    try:
        d = json.loads(line)
    except Exception:
        continue
    if d.get("type") == "assistant":
        m = (d.get("message", {}).get("model") or "").lower()
        if "opus" in m:   print("opus");   break
        if "haiku" in m:  print("haiku");  break
        if "sonnet" in m: print("sonnet"); break
PY
)
[ -z "$CURRENT_MODEL" ] && CURRENT_MODEL="opus"  # default assumption

# Classify prompt
DEPTH_RE='research[- ]and[- ]decide|critic|audit[- ]deep|three[- ]man[- ]team|architecture decision|security review|root cause|trade[- ]?off|evaluate (the )?(option|alternative|approach)|design (the|a) (system|architecture)|ADR|incident|postmortem|escalat|multi[- ]agent'
if printf '%s' "$PROMPT" | grep -qiE "$DEPTH_RE"; then
  CATEGORY="depth"
else
  CATEGORY="routine"
fi

# Decide if we should fire
FIRED=""
[ -f "$STATE_FILE" ] && FIRED=$(cat "$STATE_FILE")

ADVICE=""
if [ "$CATEGORY" = "depth" ] && [ "$CURRENT_MODEL" != "opus" ] && ! echo "$FIRED" | grep -q "depth-up"; then
  ADVICE=" Depth-requiring prompt detected on **$CURRENT_MODEL**. Per ADR 2026-05-13-model-tier-strategy, consider \`/model claude-opus-4-7\` for this work (composite skills, architecture, critic, ADRs). Fires once per session."
  FIRED="$FIRED depth-up"
elif [ "$CATEGORY" = "routine" ] && [ "$CURRENT_MODEL" = "opus" ] && ! echo "$FIRED" | grep -q "routine-down"; then
  ADVICE=" Routine prompt on **opus**. Per ADR 2026-05-13-model-tier-strategy, the Opus/Sonnet split projects ~75% cost reduction. Consider \`/model claude-sonnet-4-6\` for glue/CI/PR work — composites will still escalate to Opus as needed via Agent. Fires once per session."
  FIRED="$FIRED routine-down"
fi

[ -z "$ADVICE" ] && exit 0

echo "$FIRED" > "$STATE_FILE"

jq -n --arg m "$ADVICE" '{"systemMessage": $m}' 2>/dev/null || \
  python3 -c "import json,sys; print(json.dumps({'systemMessage': sys.argv[1]}))" "$ADVICE"

#!/usr/bin/env bash
# handoff-cadence-alert.sh — emit a systemMessage when session crosses
# any token-opt threshold from ADR 2026-05-13-session-handoff-cadence.md.
#
# Thresholds (any one fires the soft alert):
#   - 3000 turns (assistant messages)
#   - $1000 estimated cost (PRICING from token-audit/audit.py)
#   - cache hit rate <90% (only after 200 turns to avoid early-session noise)
#
# Fires at most once per session per threshold — tracked in state dir.
# Self-throttles to once every 30s of wall-clock to avoid per-prompt cost.

set -euo pipefail

SID="${CLAUDE_CODE_SESSION_ID:-}"
[ -z "$SID" ] && exit 0

STATE_DIR="$HOME/.claude/state/handoff-alerts"
mkdir -p "$STATE_DIR"
STATE_FILE="$STATE_DIR/$SID.json"
LAST_RUN="$STATE_DIR/$SID.lastrun"

# Throttle: skip if checked within last 30s (avoids re-scanning JSONL on every prompt)
NOW=$(date +%s)
if [ -f "$LAST_RUN" ]; then
  PREV=$(cat "$LAST_RUN" 2>/dev/null || echo 0)
  if [ "$((NOW - PREV))" -lt 30 ]; then
    exit 0
  fi
fi
echo "$NOW" > "$LAST_RUN"

# Locate session JSONL — walk all project dirs since CWD encoding can be tricky
JSONL=$(find "$HOME/.claude/projects" -maxdepth 2 -name "${SID}.jsonl" -type f 2>/dev/null | head -1)
[ -z "$JSONL" ] || [ ! -f "$JSONL" ] && exit 0

# Compute metrics
RESULT=$(python3 <<PY 2>/dev/null
import json, os, sys
PRICING = {
    "sonnet": {"input": 3.00, "cache_write": 3.75, "cache_read": 0.30, "output": 15.00},
    "haiku":  {"input": 0.80, "cache_write": 1.00, "cache_read": 0.08, "output": 4.00},
    "opus":   {"input": 15.0, "cache_write": 18.75,"cache_read": 1.50, "output": 75.00},
}
def model_key(m):
    m = (m or "").lower()
    if "haiku" in m: return "haiku"
    if "opus" in m: return "opus"
    return "sonnet"

turns = 0
cost = 0.0
cache_read = 0
cache_write = 0
with open("$JSONL") as f:
    for line in f:
        try:
            d = json.loads(line)
        except Exception:
            continue
        if d.get("type") != "assistant":
            continue
        msg = d.get("message", {})
        u = msg.get("usage", {})
        if not u:
            continue
        turns += 1
        mk = model_key(msg.get("model"))
        p = PRICING.get(mk, PRICING["sonnet"])
        cost += (
            u.get("input_tokens", 0) * p["input"] +
            u.get("cache_creation_input_tokens", 0) * p["cache_write"] +
            u.get("cache_read_input_tokens", 0) * p["cache_read"] +
            u.get("output_tokens", 0) * p["output"]
        ) / 1_000_000
        cache_read += u.get("cache_read_input_tokens", 0)
        cache_write += u.get("cache_creation_input_tokens", 0)

cache_total = cache_read + cache_write
cache_hit = (cache_read / cache_total) if cache_total > 0 else 1.0
print(json.dumps({"turns": turns, "cost": cost, "cache_hit": cache_hit}))
PY
)
[ -z "$RESULT" ] && exit 0

# Parse current vs previously-fired thresholds
TURNS=$(echo "$RESULT" | python3 -c "import json,sys;print(json.load(sys.stdin)['turns'])" 2>/dev/null || echo 0)
COST=$(echo "$RESULT" | python3 -c "import json,sys;print(f\"{json.load(sys.stdin)['cost']:.2f}\")" 2>/dev/null || echo 0)
CACHE=$(echo "$RESULT" | python3 -c "import json,sys;print(f\"{json.load(sys.stdin)['cache_hit']:.3f}\")" 2>/dev/null || echo 1)

# Load fired-threshold state
FIRED=""
if [ -f "$STATE_FILE" ]; then
  FIRED=$(cat "$STATE_FILE")
fi

ALERTS=""
# Threshold: turns >= 3000 (fires once)
if [ "$TURNS" -ge 3000 ] && ! echo "$FIRED" | grep -q '"turns"'; then
  ALERTS="${ALERTS}- **${TURNS} turns** (>=3000): diminishing-returns band per ADR.\n"
  FIRED="$FIRED turns"
fi
# Threshold: cost >= $1000
if python3 -c "import sys; sys.exit(0 if float('$COST') >= 1000 else 1)" 2>/dev/null && ! echo "$FIRED" | grep -q '"cost"'; then
  ALERTS="${ALERTS}- **\$${COST} estimated cost** (>=\$1000): consider \`/handoff\` before extending.\n"
  FIRED="$FIRED cost"
fi
# Threshold: cache hit <90% AND turns>=200 (avoid noise on bootstrap)
if [ "$TURNS" -ge 200 ] && python3 -c "import sys; sys.exit(0 if float('$CACHE') < 0.90 else 1)" 2>/dev/null && ! echo "$FIRED" | grep -q '"cache"'; then
  CACHE_PCT=$(python3 -c "print(f'{float(\"$CACHE\")*100:.1f}')")
  ALERTS="${ALERTS}- **Cache hit ${CACHE_PCT}%** (<90%): context churn signal.\n"
  FIRED="$FIRED cache"
fi

[ -z "$ALERTS" ] && exit 0

# Persist fired state
echo "{\"turns\":\"$TURNS\",\"cost\":\"$COST\",\"cache\":\"$CACHE\",\"fired\":\"$FIRED\"}" > "$STATE_FILE"

# Emit systemMessage
MSG=$(printf '⏰ Handoff-cadence soft alert\n\n%b\nPer ADR 2026-05-13-session-handoff-cadence.md, suggest running `/handoff` to durable-save state and start a fresh session. Not mandatory — surface this once so the user can decide.' "$ALERTS")

jq -n --arg m "$MSG" '{"systemMessage": $m}' 2>/dev/null || {
  # Fallback if jq missing
  python3 -c "import json,sys; print(json.dumps({'systemMessage': sys.argv[1]}))" "$MSG"
}

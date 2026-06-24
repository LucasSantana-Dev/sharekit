#!/bin/bash

# Token Usage Monitoring Hook
# Monitors and reports on token usage patterns

echo "📊 Token usage monitoring..."

# Get session info
SESSION_INFO=$(cat)
SESSION_ID=$(echo "$SESSION_INFO" | jq -r '.sessionId // "unknown"')

# Get current token metrics
TOKEN_USAGE=$(claude-stats --token-usage 2>/dev/null || echo "0")
CONTEXT_SIZE=$(claude-stats --context-size 2>/dev/null || echo "0")
SESSION_TURNS=$(claude-stats --session-turns 2>/dev/null || echo "0")

echo "📈 Current Session Metrics:"
echo "   Tokens used: $TOKEN_USAGE"
echo "   Context size: $CONTEXT_SIZE"
echo "   Session turns: $SESSION_TURNS"

# Calculate efficiency
if [ "$SESSION_TURNS" -gt 0 ]; then
    TOKENS_PER_TURN=$((TOKEN_USAGE / SESSION_TURNS))
    echo "   Tokens per turn: $TOKENS_PER_TURN"
fi

# Store metrics for analysis
METRICS_DIR="$HOME/.claude/metrics"
mkdir -p "$METRICS_DIR"

METRICS_FILE="$METRICS_DIR/token_usage_$(date +%Y%m%d).json"
TIMESTAMP=$(date -Iseconds)

# Create or update metrics file
if [ ! -f "$METRICS_FILE" ]; then
    echo '{"sessions": []}' > "$METRICS_FILE"
fi

# Add current session metrics
tmp_file=$(mktemp)
jq --arg timestamp "$TIMESTAMP" \
   --arg session_id "$SESSION_ID" \
   --arg token_usage "$TOKEN_USAGE" \
   --arg context_size "$CONTEXT_SIZE" \
   --arg session_turns "$SESSION_TURNS" \
   '.sessions += [{
     "timestamp": $timestamp,
     "sessionId": $session_id,
     "tokenUsage": ($token_usage | tonumber),
     "contextSize": ($context_size | tonumber),
     "sessionTurns": ($session_turns | tonumber)
   }]' "$METRICS_FILE" > "$tmp_file" && mv "$tmp_file" "$METRICS_FILE"

# Analyze patterns from last 7 days
echo "📊 7-Day Usage Analysis:"
SEVEN_DAYS_AGO=$(date -d '7 days ago' -Iseconds 2>/dev/null || date -v-7d -Iseconds)

TOTAL_TOKENS=$(jq --arg since "$SEVEN_DAYS_AGO" \
  '.sessions | map(select(.timestamp >= $since)) | map(.tokenUsage) | add // 0' \
  "$METRICS_FILE")

TOTAL_SESSIONS=$(jq --arg since "$SEVEN_DAYS_AGO" \
  '.sessions | map(select(.timestamp >= $since)) | length' \
  "$METRICS_FILE")

AVG_TOKENS_PER_SESSION=0
if [ "$TOTAL_SESSIONS" -gt 0 ]; then
    AVG_TOKENS_PER_SESSION=$((TOTAL_TOKENS / TOTAL_SESSIONS))
fi

echo "   Total tokens (7 days): $TOTAL_TOKENS"
echo "   Total sessions (7 days): $TOTAL_SESSIONS"
echo "   Average per session: $AVG_TOKENS_PER_SESSION"

# Provide optimization recommendations
echo "💡 Optimization Recommendations:"

if [ "$TOKENS_PER_TURN" -gt 5000 ]; then
    echo "   ⚠️  High tokens per turn ($TOKENS_PER_TURN). Consider:"
    echo "      - Using @file references more frequently"
    echo "      - Compacting context with /compact"
    echo "      - Focusing on specific tasks with /focus"
fi

if [ "$CONTEXT_SIZE" -gt 180000 ]; then
    echo "   ⚠️  Large context size ($CONTEXT_SIZE). Consider:"
    echo "      - Clearing context with /clear"
    echo "      - Removing irrelevant files"
    echo "      - Using more compact references"
fi

if [ "$AVG_TOKENS_PER_SESSION" -gt 50000 ]; then
    echo "   ⚠️  High average session usage ($AVG_TOKENS_PER_SESSION). Consider:"
    echo "      - Breaking tasks into smaller sessions"
    echo "      - Using context optimization more frequently"
fi

# Clean old metrics (keep 30 days)
find "$METRICS_DIR" -name "token_usage_*.json" -mtime +30 -delete 2>/dev/null || true

echo "✅ Token usage monitoring complete"

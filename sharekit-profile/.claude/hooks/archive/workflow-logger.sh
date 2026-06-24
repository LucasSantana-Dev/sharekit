#!/bin/bash
# Workflow logging hook for Claude Code
# Tracks workflow events and productivity metrics

set -euo pipefail

EVENT_TYPE="$1"
shift
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
SESSION_ID="$2"
shift

LOG_FILE="$HOME/.claude/logs/workflow-$(date +%Y%m%d).log"
mkdir -p "$(dirname "$LOG_FILE")"

echo "📊 Workflow Event: $EVENT_TYPE"
echo "📅 Timestamp: $TIMESTAMP"
echo "🆔 Session ID: $SESSION_ID"

# Log specific event details
case "$EVENT_TYPE" in
    "SessionStart")
        echo "🚀 Session started"
        echo "📊 Project: $(pwd)"
        echo "🔧 Context optimization: $(jq -r '.productivity.contextOptimization.enabled // false' "$HOME/.claude/settings.json" 2>/dev/null && echo "Enabled" || echo "Disabled")"
        echo "🔧 Token optimization: $(jq -r '.tokenOptimization.enableContextCompression // false' "$HOME/.claude/settings.json" 2>/dev/null && echo "Enabled" || echo "Disabled")"
        ;;
    "UserPromptSubmit")
        echo "📝 User prompt submitted"
        echo "📝 Prompt: ${USER_PROMPT:0:50}..."
        echo "🔍 Context injection: $(jq -r '.productivity.contextInjection.enabled // false' "$HOME/.claude/settings.json" 2>/dev/null && echo "Enabled" || echo "Disabled")"
        ;;
    "PreToolUse")
        echo "🔧 Tool use: $3"
        echo "📝 Tool: ${3:0:50}..."
        echo "🔍 Security check: $(jq -r '.hooks.PreToolUse[0].command | grep -q "security" "$HOME/.claude/settings.json" 2>/dev/null && echo "Enabled" || echo "Disabled")"
        ;;
    "PostToolUse")
        echo "📝 Tool completed: $3"
        echo "📝 Tool: ${3:0:50}..."
        echo "🔨 Auto-format: $(jq -r '.hooks.PostToolUse[0].command | grep -q "auto-format" "$HOME/.claude/settings.json" 2>/dev/null && echo "Enabled" || echo "Disabled")"
        ;;
    "PostToolUseFailure")
        echo "❌ Tool failed: $3"
        echo "📝 Tool: ${3:0:50}..."
        echo "🔨 Error handling: $(jq -r '.hooks.PostToolUseFailure.enabled // false' "$HOME/.claude/settings.json" 2>/dev/null && echo "Enabled" || echo "Disabled")"
        ;;
    "SessionEnd")
        echo "🏁 Session ended"
        echo "📊 Session duration: $(date -d "$SESSION_START_TIME" +%Y-%m-%d %H:%M:%S")"
        echo "📊 Total tokens used: $(cat "$HOME/.claude/logs/token-usage.log" 2>/dev/null | awk '{sum += $2} END {print sum/NR} }' || echo "0")"
        echo "📊 Context efficiency: $(cat "$HOME/.claude/logs/context-efficiency.log" 2>/dev/null | awk '{sum += $2} END {print sum/NR} }' || echo "0")"
        echo "📊 Agent calls: $(cat "$HOME/.claude/logs/agent-usage.log" 2>/dev/null | awk '{sum += $2} END {print sum/NR} }' || echo "0")"
        ;;
    *)
        echo "📝 Unknown event: $EVENT_TYPE"
        ;;
esac

# Log productivity metrics
echo "📊 Productivity Metrics:"
echo "   Automation effectiveness: $(grep -c "automation" "$LOG_FILE" | wc -l)"
echo "   Quality gate passes: $(grep -c "quality-gate" "$LOG_FILE" | wc -l)"
echo "   Security validations: $(grep -c "security" "$LOG_FILE" | wc -l)"

# Log resource usage
echo "🔌 Resource Usage:"
echo "   MCP calls: $(cat "$HOME/.claude/logs/mcp-usage.log" 2>/dev/null | awk '{sum += $2} END {print sum/NR} }' || echo "0")"
echo "   File reads: $(grep -c "Read.*file" "$LOG_FILE" | wc -l)"
echo "   Agent delegations: $(grep -c "agent.*delegation" "$LOG_FILE" | wc -l)"

# Log optimization results
echo "🎯 Optimization Results:"
echo "   Token reduction: $(grep "token.*reduction" "$LOG_FILE" | wc -l || echo "0")%"
echo "   Context efficiency gain: $(grep "context.*efficiency.*gain" "$LOG_FILE" | wc -l || echo "0%")%"
echo "   Productivity gain: $(grep "productivity.*gain" "$LOG_FILE" | wc -l || echo "0%")%"

exit 0
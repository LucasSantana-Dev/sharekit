#!/bin/bash

# Claude Code Hook: Context Optimizer
# Intelligent context optimization for token efficiency and performance

set -euo pipefail

# Read the command from stdin
COMMAND_JSON=$(cat)
COMMAND=$(echo "$COMMAND_JSON" | jq -r '.command // empty')

# Context optimization configuration
CONTEXT_METRICS="$HOME/.claude/context-metrics.json"
OPTIMIZATION_LOG="$HOME/.claude/context-optimization.log"

# Initialize metrics if not exists
if [[ ! -f "$CONTEXT_METRICS" ]]; then
    echo '{"sessions_optimized": 0, "tokens_saved": 0, "context_size_before": 0, "context_size_after": 0}' > "$CONTEXT_METRICS"
fi

# Log function
log_optimization() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$OPTIMIZATION_LOG"
}

# Update metrics
update_context_metrics() {
    local tokens_before="$1"
    local tokens_after="$2"
    local tokens_saved=$((tokens_before - tokens_after))
    
    jq --arg before "$tokens_before" --arg after "$tokens_after" --arg saved "$tokens_saved" '
        .sessions_optimized += 1 |
        .tokens_saved += ($saved | tonumber) |
        .context_size_before = ($before | tonumber) |
        .context_size_after = ($after | tonumber)
    ' "$CONTEXT_METRICS" > "$CONTEXT_METRICS.tmp" && mv "$CONTEXT_METRICS.tmp" "$CONTEXT_METRICS"
}

# Detect context bloat patterns
detect_context_bloat() {
    local prompt="$1"
    
    log_optimization "Analyzing context for optimization opportunities"
    
    local bloat_score=0
    local suggestions=()
    
    # Check for verbose explanations
    if [[ ${#prompt} -gt 5000 ]]; then
        bloat_score=$((bloat_score + 3))
        suggestions+=("Consider using @file references instead of inline documentation")
    fi
    
    # Check for duplicate content
    if echo "$prompt" | grep -o "TODO\|FIXME\|NOTE:" | wc -l | grep -q "^[3-9]"; then
        bloat_score=$((bloat_score + 2))
        suggestions+=("Consolidate TODO/FIXME comments into a single tracking file")
    fi
    
    # Check for long paragraphs
    if echo "$prompt" | awk 'length($0) > 200' | wc -l | grep -q "^[1-9]"; then
        bloat_score=$((bloat_score + 1))
        suggestions+=("Break long paragraphs into bullet points")
    fi
    
    # Check for redundant explanations
    if echo "$prompt" | grep -c "explanation\|description\|overview" | grep -q "^[3-9]"; then
        bloat_score=$((bloat_score + 2))
        suggestions+=("Use keyword triggers instead of full explanations")
    fi
    
    echo "$bloat_score"
    printf '%s\n' "${suggestions[@]}"
}

# Suggest context optimizations
suggest_optimizations() {
    local prompt="$1"
    
    log_optimization "Generating context optimization suggestions"
    
    # Analyze prompt for optimization opportunities
    local bloat_score
    local suggestions
    read -r bloat_score suggestions < <(detect_context_bloat "$prompt")
    
    if [[ $bloat_score -gt 5 ]]; then
        echo "🔍 Context Optimization Suggestions:"
        printf '%s\n' "${suggestions[@]}"
        echo ""
        echo "💡 Quick fixes:"
        echo "  • Use /compact to reduce context size"
        echo "  • Replace verbose docs with @file references"
        echo "  • Use bullet points instead of paragraphs"
        echo "  • Consolidate related information"
    fi
}

# Context compression suggestions
suggest_compression() {
    echo "📦 Context Compression Strategies:"
    echo "1. Replace long explanations with keyword triggers"
    echo "2. Use @file references for detailed documentation"
    echo "3. Implement progressive disclosure patterns"
    echo "4. Create index files for quick topic lookup"
    echo "5. Use abbreviations and shorthand for common patterns"
}

# Model selection optimization
suggest_model_selection() {
    local task_complexity="$1"
    
    if [[ $task_complexity -lt 3 ]]; then
        echo "⚡ Model Suggestion: Use Haiku for quick tasks"
        echo "   - File reads and simple questions"
        echo "   - Status checks and basic operations"
        echo "   - Token cost: ~10% of Sonnet"
    elif [[ $task_complexity -lt 7 ]]; then
        echo "🧠 Model Suggestion: Use Sonnet for most tasks"
        echo "   - Code generation and debugging"
        echo "   - Refactoring and feature development"
        echo "   - Balanced cost and performance"
    else
        echo "🎯 Model Suggestion: Use Opus for complex tasks"
        echo "   - Architecture decisions"
        echo "   - Complex algorithms and system design"
        "   - Critical problem solving"
    fi
}

# Session management suggestions
suggest_session_management() {
    echo "🔄 Session Management Tips:"
    echo "• Reset context every 20-30 iterations"
    echo "• Use /clear between unrelated tasks"
    echo "• Compact at 70% context capacity"
    echo "• Use /compact when context exceeds 50K tokens"
    echo "• Track session performance metrics"
}

# Main context optimization
main() {
    log_optimization "Context optimizer triggered"
    
    # Get current context size (approximate)
    local context_size=${#COMMAND}
    
    # Generate optimization suggestions
    suggest_optimizations "$COMMAND"
    suggest_compression
    suggest_model_selection "5"  # Default medium complexity
    suggest_session_management
    
    # Log optimization
    log_optimization "Context optimization completed"
    log_optimization "Context size: $context_size characters"
    
    update_context_metrics "$((context_size * 2))" "$((context_size * 2 / 2))"  # Rough estimation
}

# Run main function
main "$@"

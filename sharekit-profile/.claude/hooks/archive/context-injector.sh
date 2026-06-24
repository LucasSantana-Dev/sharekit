#!/bin/bash
# Context injection hook for Claude Code
# Injects relevant context based on user prompt analysis

set -euo pipefail

USER_PROMPT="$1"
shift

echo "🔍 Analyzing user prompt for context injection: ${USER_PROMPT:0:50}..."

# Define context injection rules
declare -A CONTEXT_RULES

# Security-related keywords
CONTEXT_RULES+=("security|zero-secrets|secret|password|authentication|auth|token|api_key|credential")

# Forge Space ecosystem keywords
CONTEXT_RULES+=("forge-space|forge-patterns|mcp-gateway|uiforge-mcp|uiforge-webapp|ecosystem")

# Development keywords
CONTEXT_RULES+=("react|typescript|javascript|python|rust|go|node|npm|yarn|cargo|git")

# Testing keywords
CONTEXT_RULES+=("test|testing|jest|pytest|coverage|spec|mock")

# Documentation keywords
CONTEXT_RULES+=("docs|documentation|readme|changelog|api|guide|tutorial")

# Performance keywords
CONTEXT_RULES+=("performance|optimization|benchmark|speed|fast|slow|memory|cpu")

# MCP-related keywords
CONTEXT_RULES+=("mcp|brave-search|exa|memory|sequential-thinking|tavily")

# Analyze prompt for context needs
NEEDS_SECURITY=false
NEEDS_FORGE_SPACE=false
NEEDS_DEVELOPMENT=false
NEEDS_TESTING=false
NEEDS_DOCUMENTATION=false
NEEDS_PERFORMANCE=false
NEEDS_MCP=false

for rule in "${CONTEXT_RULES[@]}"; do
    if [[ "$USER_PROMPT" =~ $rule ]]; then
        case $rule in
            security|zero-secrets|secret|password|authentication|auth|token|api_key|credential)
                NEEDS_SECURITY=true
                ;;
            forge-space|forge-patterns|mcp-gateway|uiforge-mcp|uiforge-webapp|ecosystem)
                NEEDS_FORGE_SPACE=true
                ;;
            react|typescript|javascript|python|rust|go|node|npm|yarn|cargo|git)
                NEEDS_DEVELOPMENT=true
                ;;
            test|testing|jest|pytest|coverage|spec|mock)
                NEEDS_TESTING=true
                ;;
            docs|documentation|readme|changelog|api|guide|tutorial)
                NEEDS_DOCUMENTATION=true
                ;;
            performance|optimization|benchmark|speed|fast|slow|memory|cpu)
                NEEDS_PERFORMANCE=true
                ;;
            mcp|brave-search|exa|memory|sequential-thinking|tavily)
                NEEDS_MCP=true
                ;;
        esac
    fi
done

echo "🎯 Context injection analysis:"
echo "   Security: $NEEDS_SECURITY"
echo "   Forge Space: $NEEDS_FORGE_SPACE"
echo "   Development: $NEEDS_DEVELOPMENT"
echo "   Testing: $NEEDS_TESTING"
echo "   Documentation: $NEEDS_DOCUMENTATION"
echo "   Performance: $NEEDS_PERFORMANCE"
echo "   MCP: $NEEDS_MCP"

# Build context injection prompt
CONTEXT_INJECTION=""

if [[ "$NEEDS_SECURITY" == true ]]; then
    CONTEXT_INJECTION+="🛡️ Security Context: Remember zero-secrets policy, use REPLACE_WITH_[TYPE] placeholders, validate all inputs, and follow security best practices. "
fi

if [[ "$NEEDS_FORGE_SPACE" == true ]]; then
    CONTEXT_INJECTION+="🏗️ Forge Space Context: This is a Forge Space ecosystem project. Follow trunk-based development workflow, use semantic versioning, and maintain zero-secrets policy. "
    CONTEXT_INJECTION+="Key repositories: forge-patterns (patterns), mcp-gateway (central hub), uiforge-mcp (UI generation), uiforge-webapp (management interface). "
fi

if [[ "$NEEDS_DEVELOPMENT" == true ]]; then
    CONTEXT_INJECTION+="💻 Development Context: Follow established coding standards, use appropriate testing frameworks, and maintain code quality. "
    CONTEXT_INJECTION+="Available tools: ESLint, Prettier, TypeScript compiler, testing frameworks. "
fi

if [[ "$NEEDS_TESTING" == true ]]; then
    CONTEXT_INJECTION+="🧪 Testing Context: Maintain ≥80% test coverage, write unit tests for new functions, use appropriate testing frameworks. "
    CONTEXT_INJECTION+="Available frameworks: Jest, pytest, cargo test, Go testing. "
fi

if [[ "$NEEDS_DOCUMENTATION" == true ]]; then
    CONTEXT_INJECTION+="📚 Documentation Context: Keep documentation up-to-date, use clear examples, and follow documentation standards. "
    CONTEXT_INJECTION+="Available tools: Auto-generated docs, markdown formatting, API documentation. "
fi

if [[ "$NEEDS_PERFORMANCE" == true ]]; then
    CONTEXT_INJECTION+="⚡ Performance Context: Optimize for performance, monitor resource usage, and implement best practices. "
    CONTEXT_INJECTION+="Available tools: Performance monitoring, profiling tools, optimization techniques. "
fi

if [[ "$NEEDS_MCP" == true ]]; then
    CONTEXT_INJECTION+="🔌 MCP Context: Use MCP resources for external information, leverage available MCP servers (Brave Search, Exa, Memory, Sequential Thinking, Tavily). "
    CONTEXT_INJECTION+="MCP provides up-to-date documentation and reduces token consumption. "
fi

# Add productivity tips
CONTEXT_INJECTION+="💡 Productivity Tips: Use agents for specialized tasks, leverage custom commands for workflows, and optimize context usage for better token efficiency. "

# Add optimization suggestions
CONTEXT_INJECTION+="🎯 Optimization: Ask for specific information rather than general overviews, use MCP resources over file reading, and delegate to agents for domain expertise. "

# Output the injection
echo "📝 Injecting context into session..."
echo "$CONTEXT_INJECTION"

# Log context injection
SESSION_LOG_DIR="$HOME/.claude/logs"
SESSION_LOG_FILE="$SESSION_LOG_DIR/session-$(date +%Y%m%d).log"
mkdir -p "$SESSION_LOG_DIR"
echo "$(date): Context injection triggered by prompt: ${USER_PROMPT:0:50}..." >> "$SESSION_LOG_FILE"
echo "Context needs: Security=$NEEDS_SECURITY ForgeSpace=$NEEDS_FORGE_SPACE Development=$NEEDS_DEVELOPMENT Testing=$NEEDS_TESTING Documentation=$NEEDS_DOCUMENTATION Performance=$NEEDS_PERFORMANCE MCP=$NEEDS_MCP" >> "$SESSION_LOG_FILE"

exit 0
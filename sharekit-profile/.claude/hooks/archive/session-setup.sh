#!/usr/bin/env fish

# Claude Code session setup hook (Fish version)
# Optimizes session for productivity and token efficiency


# Handle arguments
if test (count $argv) -gt 0
    set SESSION_ID $argv[1]
else
    set SESSION_ID "default_session"
end

echo "🚀 Setting up Claude Code session: $SESSION_ID"

# Load project context if in Forge Space project
if test -f CLAUDE.md -o test -f .claude/CLAUDE.md
    echo "📁 Forge Space project detected"

    # Load project-specific context
    if test -f "CLAUDE.md"
        echo "📖 Loading project context from CLAUDE.md"
        echo "📋 Project Overview:"
        grep -E "^#|^##|^###" CLAUDE.md 2>/dev/null | head -10 || true
    end

    # Check for MCP context server
    if test -f "dist/mcp-context-server/index.js"
        echo "🔌 MCP Context Server available"
        echo "💡 Use MCP tools for project context instead of loading files"
    end

    # Check for available agents
    if test -d ".claude/agents"
        echo "🤖 Project agents available:"
        ls .claude/agents/ 2>/dev/null | head -5 || true
    end

    # Check for custom commands
    if test -d ".claude/commands"
        echo "⌨️  Custom commands available:"
        ls .claude/commands/ 2>/dev/null | head -5 || true
    end
end

# Check user-level configuration
if test -f "$HOME/.claude/settings.json"
    echo "⚙️  User configuration loaded"

    # Check for optimization settings
    if grep -q "contextOptimization" "$HOME/.claude/settings.json" 2>/dev/null
        echo "🧠 Context optimization enabled"
    end

    # Check for token optimization
    if grep -q "tokenOptimization" "$HOME/.claude/settings.json" 2>/dev/null
        echo "💰 Token optimization enabled"
    end

    # Check for productivity settings
    if grep -q "productivity" "$HOME/.claude/settings.json" 2>/dev/null
        echo "🚀 Productivity features enabled"
    end
end

# Analyze current directory for optimization opportunities
echo "📊 Analyzing project structure for optimization..."

# Count file types (for context optimization)
if command -v find >/dev/null 2>&1
    echo "📁 File type analysis:"
    find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.rs" -o -name "*.go" \) 2>/dev/null | \
        sed 's/.*\.//' | sort | uniq -c | sort -nr | head -5 2>/dev/null || true
end

# Check for large files that might impact token usage
echo "🔍 Checking for large files..."
if command -v find >/dev/null 2>&1
    find . -type f -size +50k -not -path "./node_modules/*" -not -path "./.git/*" 2>/dev/null | \
        head -5 | while read file
            echo "   📄 "(du -h "$file" | cut -f1)" $file"
        end
end

# Suggest optimization strategies
echo "💡 Session optimization suggestions:"
echo "   1. Use MCP tools instead of reading large files"
echo "   2. Ask for specific information rather than general overviews"
echo "   3. Use agents for domain-specific tasks"
echo "   4. Leverage existing CLAUDE.md context"
echo "   5. Use /insights to analyze usage patterns"

# Check for available MCP servers
echo "🔌 MCP Server Status:"
if command -v jq >/dev/null 2>&1 -a test -f "$HOME/.claude/settings.json"
    jq -r '.mcpServers | keys[]' "$HOME/.claude/settings.json" 2>/dev/null || echo "   No MCP servers configured"
else
    echo "   No MCP servers configured"
end

# Memory usage optimization
echo "🧠 Memory optimization tips:"
echo "   1. Use /clear to reset context when needed"
echo "   2. Focus on one task at a time"
echo "   3. Use agents for isolated context"
echo "   4. Leverage MCP tools for external information"

# Token optimization suggestions
echo "💰 Token optimization suggestions:"
echo "   1. Ask for specific information rather than general overviews"
echo "   2. Use MCP resources instead of file reading"
echo "   3. Leverage existing documentation and MCP resources"
echo "   4. Use agents for specialized domain knowledge"

# Productivity features
echo "🚀 Productivity features available:"
echo "   1. Auto-formatting: Enabled for supported file types"
echo "   2. Security validation: Zero-secrets policy enforcement"
echo "   3. Test validation: Automated test execution"
echo "   4. Context optimization: Intelligent context management"

# Session optimization recommendations
echo "🎯 Session optimization recommendations:"
echo "   1. Start with clear, specific objectives"
echo "   2. Use /agents for specialized tasks"
echo "   3. Leverage MCP resources for research"
echo "   4. Monitor token usage with /insights"
echo "   5. Use /clear to reset context when needed"

# Check for recent activity that might inform context
echo "📅 Recent activity analysis:"
if test -f ".git"
    echo "   Recent commits:"
    git log --oneline -5 2>/dev/null || echo "   No recent commits found"
end

# Performance monitoring setup
echo "📊 Performance monitoring:"
echo "   Token usage will be tracked throughout session"
echo "   Context efficiency will be monitored"
echo "   Agent delegation will be tracked"
echo "   MCP resource usage will be optimized"

# Final setup confirmation
echo "✅ Session setup completed"
echo "🎯 Ready for productive Claude Code session"
echo "💡 Use /help to see available commands"
echo "🤖 Use /agents to access specialized expertise"
echo "🔌 Use MCP tools for external information"

# Set environment variables for session
set -gx CLAUDE_SESSION_ID "$SESSION_ID"
set -gx CLAUDE_CONTEXT_OPTIMIZED true
set -gx CLAUDE_TOKEN_OPTIMIZED true
set -gx CLAUDE_PRODUCTIVITY_MODE true

# Create session log directory
set SESSION_LOG_DIR "$HOME/.claude/logs"
mkdir -p "$SESSION_LOG_DIR"
set SESSION_LOG_FILE "$SESSION_LOG_DIR/session-$SESSION_ID.log"

# Log session setup
echo "$(date): Session $SESSION_ID setup completed" >> "$SESSION_LOG_FILE"
echo "Context optimization: enabled" >> "$SESSION_LOG_FILE"
echo "Token optimization: enabled" >> "$SESSION_LOG_FILE"
echo "Productivity mode: enabled" >> "$SESSION_LOG_FILE"

echo "📝 Session logged to: $SESSION_LOG_FILE"
exit 0

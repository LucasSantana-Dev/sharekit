#!/bin/bash
# Context optimization hook for Claude Code
# Reduces token consumption by optimizing context usage

set -euo pipefail

# Get current session context
SESSION_ID="$1"
shift

echo "🧠 Optimizing context for session: $SESSION_ID"

# Check if we're in a Forge Space project
if [[ -f "CLAUDE.md" ]] || [[ -f ".claude/CLAUDE.md" ]]; then
    echo "📁 Forge Space project detected"
    
    # Load project-specific context
    if [[ -f "CLAUDE.md" ]]; then
        echo "📖 Loading project context from CLAUDE.md"
        # Extract key information from CLAUDE.md
        grep -E "^#|^##|^###" CLAUDE.md | head -20 || true
    fi
    
    # Check for MCP context server
    if [[ -f "dist/mcp-context-server/index.js" ]]; then
        echo "🔌 MCP Context Server available"
        echo "💡 Use MCP tools for project context instead of loading files"
    fi
    
    # Check for existing agents
    if [[ -d ".claude/agents" ]]; then
        echo "🤖 Project agents available:"
        ls .claude/agents/ | head -5 || true
    fi
fi

# Optimize context based on file types in current directory
echo "📊 Analyzing project structure"

# Count file types
if command -v find >/dev/null 2>&1; then
    echo "📁 File type distribution:"
    find . -type f -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.rs" -o -name "*.go" | \
        sed 's/.*\.//' | sort | uniq -c | sort -nr | head -5 || true
fi

# Suggest context optimization strategies
echo "💡 Context optimization suggestions:"
echo "   1. Use MCP tools instead of reading large files"
echo "   2. Focus on specific directories rather than entire project"
echo "   3. Use agents for domain-specific tasks"
echo "   4. Leverage existing CLAUDE.md context"
echo "   5. Use /insights to analyze usage patterns"

# Check for large files that might consume tokens
echo "🔍 Checking for large files:"
if command -v find >/dev/null 2>&1; then
    find . -type f -size +100k -not -path "./node_modules/*" -not -path "./.git/*" | \
        head -5 | while read -r file; do
            echo "   📄 $(du -h "$file" | cut -f1) $file"
        done
fi

# Memory usage optimization
echo "🧠 Memory optimization tips:"
echo "   1. Use /clear to reset context when needed"
echo "   2. Focus on one task at a time"
echo "   3. Use agents for isolated context"
echo "   4. Leverage MCP tools for external information"

# Token optimization suggestions
echo "💰 Token optimization suggestions:"
echo "   1. Ask for specific information rather than general overviews"
echo "   2. Use targeted search instead of broad file reading"
echo "   3. Leverage existing documentation and MCP resources"
echo "   4. Use agents for specialized domain knowledge"

echo "✅ Context optimization completed"
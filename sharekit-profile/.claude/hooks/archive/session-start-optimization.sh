#!/bin/bash

# Session Start Context Optimization Hook
# Optimizes context when starting a new session

echo "🚀 Session start optimization..."

# Get session info
SESSION_INFO=$(cat)
SESSION_ID=$(echo "$SESSION_INFO" | jq -r '.sessionId // "unknown"')

# Check for cached context
CACHE_DIR="$HOME/.claude/cache"
PWD_HASH=$(pwd | sha256sum | cut -d' ' -f1)
CONTEXT_FILE="$CACHE_DIR/context_$PWD_HASH.json"

if [ -f "$CONTEXT_FILE" ]; then
    echo "📋 Found cached context for $(pwd)"
    
    # Load and display cached context summary
    CACHED_TIME=$(cat "$CONTEXT_FILE" | jq -r '.timestamp')
    CACHED_FILES=$(cat "$CONTEXT_FILE" | jq -r '.files | length')
    CACHED_TOKENS=$(cat "$CONTEXT_FILE" | jq -r '.token_usage')
    
    echo "📅 Last cached: $CACHED_TIME"
    echo "📁 Files: $CACHED_FILES"
    echo "🔤 Tokens: $CACHED_TOKENS"
    
    # Suggest relevant files based on cache
    echo "💡 Suggested files to load:"
    cat "$CONTEXT_FILE" | jq -r '.files[]' | head -5 | while read file; do
        if [ -f "$file" ]; then
            echo "   - @$file"
        fi
    done
else
    echo "🔍 No cached context found, analyzing project..."
    
    # Analyze project structure
    if [ -f "package.json" ]; then
        echo "📦 Detected Node.js project"
        
        # Suggest key files
        KEY_FILES=("package.json" "tsconfig.json" "README.md" "src/index.ts" "src/app.tsx")
        for file in "${KEY_FILES[@]}"; do
            if [ -f "$file" ]; then
                echo "   - @$file"
            fi
        done
    elif [ -f "pyproject.toml" ] || [ -f "requirements.txt" ]; then
        echo "🐍 Detected Python project"
        
        KEY_FILES=("pyproject.toml" "requirements.txt" "README.md" "src/main.py" "app.py")
        for file in "${KEY_FILES[@]}"; do
            if [ -f "$file" ]; then
                echo "   - @$file"
            fi
        done
    fi
fi

# Check current token usage
TOKEN_USAGE=$(claude-stats --token-usage 2>/dev/null || echo "0")
echo "🔤 Current token usage: $TOKEN_USAGE"

# Provide optimization suggestions
echo "💡 Session optimization tips:"
echo "   - Use /focus <feature> to concentrate on specific areas"
echo "   - Use @file references instead of full content"
echo "   - Use /compact when context grows large"
echo "   - Use /clear to start fresh if needed"

echo "✅ Session start optimization complete"

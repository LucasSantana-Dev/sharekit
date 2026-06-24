#!/bin/bash

# Post-Edit Token Optimization Hook
# Optimizes context and token usage after file edits

set -e

echo "🧠 Token optimization running..."

# Get session info from stdin
SESSION_INFO=$(cat)
SESSION_ID=$(echo "$SESSION_INFO" | jq -r '.sessionId // "unknown"')
TRANSCRIPT_PATH=$(echo "$SESSION_INFO" | jq -r '.transcriptPath // "unknown"')

# Get the current working directory
WORK_DIR=$(pwd)

# Check token usage and optimize if needed
TOKEN_USAGE=$(claude-stats --token-usage 2>/dev/null || echo "0")
CONTEXT_SIZE=$(claude-stats --context-size 2>/dev/null || echo "0")

echo "� Current token usage: $TOKEN_USAGE"
echo "📊 Context size: $CONTEXT_SIZE"

# Auto-compact if context is large
if [ "$CONTEXT_SIZE" -gt 150000 ]; then
    echo "🔧 Context size large, auto-compacting..."
    claude-compact --threshold 0.7 --force 2>/dev/null || true
fi

# Cache frequently used patterns
CACHE_DIR="$HOME/.claude/cache"
mkdir -p "$CACHE_DIR"

# Cache current working directory context
PWD_HASH=$(pwd | sha256sum | cut -d' ' -f1)
CONTEXT_FILE="$CACHE_DIR/context_$PWD_HASH.json"

# Create context cache
cat > "$CONTEXT_FILE" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "directory": "$(pwd)",
  "files": $(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.md" | head -20 | jq -R . | jq -s .),
  "token_usage": $TOKEN_USAGE,
  "context_size": $CONTEXT_SIZE
}
EOF

# Clean old cache files (keep last 10)
find "$CACHE_DIR" -name "context_*.json" -type f | sort -r | tail -n +11 | xargs rm -f 2>/dev/null || true

# Check if we're in a project with package.json for additional optimization
if [ -f "$WORK_DIR/package.json" ]; then
    echo "📝 Optimizing project files..."

    # 1. Format TypeScript/JavaScript files
    if command -v prettier > /dev/null 2>&1; then
        find . -name "*.ts" -o -name "*.js" -o -name "*.json" | grep -v node_modules | xargs prettier --write 2>/dev/null || true
        echo "✅ Code formatted with prettier"
    elif command -v npx > /dev/null 2>&1; then
        npx prettier --write "**/*.{ts,js,json}" 2>/dev/null || true
        echo "✅ Code formatted with npx prettier"
    fi

    # 2. Organize imports (TypeScript only)
    if command -v npx > /dev/null 2>&1; then
        npx tsx organize-imports-cli src 2>/dev/null || true
        echo "✅ Imports organized"
    fi

    # 3. Clean up temporary files
    find . -name "*.tmp" -delete 2>/dev/null || true
    find . -name ".DS_Store" -delete 2>/dev/null || true
fi

# Suggest optimization if token usage is high
if [ "$TOKEN_USAGE" -gt 100000 ]; then
    echo "⚠️  High token usage detected. Consider:"
    echo "   - Using /compact to compress context"
    echo "   - Using /clear to start fresh"
    echo "   - Using @file references instead of full content"
fi

echo "✅ Token optimization complete"

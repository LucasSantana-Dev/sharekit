#!/bin/bash

# Pre-commit validation hook for UIForge MCP
# Runs essential checks before allowing commits

set -e

echo "🔍 Running pre-commit validation..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository"
    exit 1
fi

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|js|json|md)$' || true)

if [ -z "$STAGED_FILES" ]; then
    echo "✅ No relevant files staged for validation"
    exit 0
fi

echo "📁 Validating staged files: $STAGED_FILES"

# 1. TypeScript compilation check
if echo "$STAGED_FILES" | grep -E '\.(ts|js)$' > /dev/null; then
    echo "🔧 Checking TypeScript compilation..."
    if npm run build > /dev/null 2>&1; then
        echo "✅ TypeScript compilation passed"
    else
        echo "❌ TypeScript compilation failed"
        npm run build
        exit 1
    fi
fi

# 2. Linting check
if echo "$STAGED_FILES" | grep -E '\.(ts|js)$' > /dev/null; then
    echo "🔧 Running linter..."
    if npm run lint > /dev/null 2>&1; then
        echo "✅ Linting passed"
    else
        echo "❌ Linting failed"
        npm run lint
        exit 1
    fi
fi

# 3. Security check for sensitive files
if echo "$STAGED_FILES" | grep -E '\.(json|ts|js)$' > /dev/null; then
    echo "🔒 Checking for sensitive data..."
    
    # Check for common secret patterns
    if git diff --cached --name-only | xargs grep -l "sk-\|password\|secret\|token\|api_key\|private_key" 2>/dev/null || true; then
        echo "⚠️  Potential sensitive data found. Please review:"
        git diff --cached | grep -C 2 "sk-\|password\|secret\|token\|api_key\|private_key" || true
        echo "❌ Remove sensitive data before committing"
        exit 1
    else
        echo "✅ No sensitive data detected"
    fi
fi

# 4. Test coverage check for modified source files
if echo "$STAGED_FILES" | grep -E 'src/.*\.(ts|js)$' > /dev/null; then
    echo "🧪 Running tests..."
    if npm test > /dev/null 2>&1; then
        echo "✅ Tests passed"
    else
        echo "❌ Tests failed"
        npm test
        exit 1
    fi
fi

# 5. Check for TODO/FIXME comments in production code
if echo "$STAGED_FILES" | grep -E 'src/.*\.(ts|js)$' > /dev/null; then
    TODO_COUNT=$(git diff --cached | grep -c "TODO\|FIXME" || true)
    if [ "$TODO_COUNT" -gt 0 ]; then
        echo "⚠️  Found $TODO_COUNT TODO/FIXME comments in staged changes"
        echo "Please address or add to backlog before committing"
        exit 1
    fi
fi

echo "✅ All pre-commit validations passed!"
exit 0

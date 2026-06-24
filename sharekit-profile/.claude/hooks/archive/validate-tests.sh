#!/bin/bash
# Validate tests after code changes
# Ensures test coverage and quality standards

set -euo pipefail

# Get the file that was modified
FILE_PATH="$1"
shift

# Skip test validation for certain files
SKIP_TEST=(
    "*.md"
    "*.txt"
    "*.json"
    "*.yml"
    "*.yaml"
    "*.lock"
    "*.log"
    "package-lock.json"
    "yarn.lock"
    "*.test.*"
    "*.spec.*"
    "__tests__/*"
    "test/*"
    "tests/*"
)

# Check if file should be skipped
for pattern in "${SKIP_TEST[@]}"; do
    if [[ "$FILE_PATH" == $pattern ]]; then
        echo "ℹ️  Skipping test validation for: $FILE_PATH"
        exit 0
    fi
done

# Check if file exists
if [[ ! -f "$FILE_PATH" ]]; then
    echo "ℹ️  File not found: $FILE_PATH"
    exit 0
fi

echo "🧪 Validating tests for: $FILE_PATH"

# Determine project type and run appropriate tests
if [[ -f "package.json" ]]; then
    # Node.js/JavaScript project
    echo "📦 Node.js project detected"
    
    # Check if test files exist for the modified file
    FILE_DIR=$(dirname "$FILE_PATH")
    FILE_NAME=$(basename "$FILE_PATH")
    FILE_BASE="${FILE_NAME%.*}"
    
    # Look for test files
    TEST_FILES=(
        "$FILE_DIR/$FILE_BASE.test.js"
        "$FILE_DIR/$FILE_BASE.test.ts"
        "$FILE_DIR/$FILE_BASE.spec.js"
        "$FILE_DIR/$FILE_BASE.spec.ts"
        "$FILE_DIR/${FILE_BASE}.test.js"
        "$FILE_DIR/${FILE_BASE}.test.ts"
        "$FILE_DIR/${FILE_BASE}.spec.js"
        "$FILE_DIR/${FILE_BASE}.spec.ts"
    )
    
    test_found=false
    for test_file in "${TEST_FILES[@]}"; do
        if [[ -f "$test_file" ]]; then
            echo "✅ Test file found: $test_file"
            test_found=true
            break
        fi
    done
    
    if [[ "$test_found" == false ]]; then
        echo "⚠️  No test file found for: $FILE_PATH"
        echo "💡 Consider adding tests to maintain coverage"
        echo "📝 Test file naming conventions:"
        echo "   - $FILE_BASE.test.js"
        echo "   - $FILE_BASE.test.ts"
        echo "   - $FILE_BASE.spec.js"
        echo "   - $FILE_BASE.spec.ts"
    fi
    
    # Run tests if npm test is available
    if command -v npm >/dev/null 2>&1 && npm run test --silent >/dev/null 2>&1; then
        echo "🧪 Running npm test"
        if npm test 2>/dev/null; then
            echo "✅ Tests passed"
        else
            echo "❌ Tests failed"
            echo "🚨 Please fix failing tests before committing"
            exit 2
        fi
    fi
    
    # Check test coverage if available
    if npm run test:coverage --silent >/dev/null 2>&1; then
        echo "📊 Running test coverage"
        npm run test:coverage 2>/dev/null || echo "⚠️  Coverage check failed"
    fi
    
elif [[ -f "pyproject.toml" ]] || [[ -f "setup.py" ]] || [[ -f "requirements.txt" ]]; then
    # Python project
    echo "🐍 Python project detected"
    
    # Check for pytest
    if command -v pytest >/dev/null 2>&1; then
        echo "🧪 Running pytest"
        if pytest 2>/dev/null; then
            echo "✅ Tests passed"
        else
            echo "❌ Tests failed"
            echo "🚨 Please fix failing tests before committing"
            exit 2
        fi
    fi
    
    # Check test coverage if coverage is available
    if command -v coverage >/dev/null 2>&1; then
        echo "📊 Running coverage check"
        coverage run -m pytest 2>/dev/null || echo "⚠️  Coverage check failed"
        coverage report 2>/dev/null || echo "⚠️  Coverage report failed"
    fi
    
elif [[ -f "Cargo.toml" ]]; then
    # Rust project
    echo "🦀 Rust project detected"
    
    # Run cargo test
    if command -v cargo >/dev/null 2>&1; then
        echo "🧪 Running cargo test"
        if cargo test 2>/dev/null; then
            echo "✅ Tests passed"
        else
            echo "❌ Tests failed"
            echo "🚨 Please fix failing tests before committing"
            exit 2
        fi
    fi
else
    echo "ℹ️  No recognized project type found"
    echo "💡 Manually validate tests for: $FILE_PATH"
fi

echo "🎯 Test validation completed"
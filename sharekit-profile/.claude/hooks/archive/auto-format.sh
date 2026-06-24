#!/bin/bash
# Auto-format code after Claude edits
# Ensures consistent formatting across all file types

set -euo pipefail

# Get the file that was modified
FILE_PATH="$1"
shift

# Skip formatting for certain files
SKIP_FORMAT=(
    "*.lock"
    "*.log"
    "*.min.js"
    "*.min.css"
    "*.map"
    "*.svg"
    "*.png"
    "*.jpg"
    "*.jpeg"
    "*.gif"
    "*.ico"
    "*.woff"
    "*.woff2"
    "*.ttf"
    "*.eot"
    "package-lock.json"
    "yarn.lock"
)

# Check if file should be skipped
for pattern in "${SKIP_FORMAT[@]}"; do
    if [[ "$FILE_PATH" == $pattern ]]; then
        echo "ℹ️  Skipping formatting for: $FILE_PATH"
        exit 0
    fi
done

# Check if file exists
if [[ ! -f "$FILE_PATH" ]]; then
    echo "ℹ️  File not found: $FILE_PATH"
    exit 0
fi

echo "🎨 Auto-formatting: $FILE_PATH"

# Determine file type and format accordingly
case "$FILE_PATH" in
    *.js|*.jsx|*.ts|*.tsx|*.json|*.md|*.yml|*.yaml)
        # Use Prettier for web files
        if command -v prettier >/dev/null 2>&1; then
            echo "📝 Using Prettier"
            prettier --write "$FILE_PATH" || echo "⚠️  Prettier formatting failed"
        else
            echo "❌ Prettier not found, skipping formatting"
        fi
        ;;
    *.py)
        # Use Black for Python files
        if command -v black >/dev/null 2>&1; then
            echo "🐍 Using Black"
            black "$FILE_PATH" || echo "⚠️  Black formatting failed"
        else
            echo "❌ Black not found, skipping formatting"
        fi
        ;;
    *.rs)
        # Use rustfmt for Rust files
        if command -v rustfmt >/dev/null 2>&1; then
            echo "🦀 Using rustfmt"
            rustfmt "$FILE_PATH" || echo "⚠️  rustfmt formatting failed"
        else
            echo "❌ rustfmt not found, skipping formatting"
        fi
        ;;
    *.go)
        # Use gofmt for Go files
        if command -v gofmt >/dev/null 2>&1; then
            echo "🐹 Using gofmt"
            gofmt -w "$FILE_PATH" || echo "⚠️  gofmt formatting failed"
        else
            echo "❌ gofmt not found, skipping formatting"
        fi
        ;;
    *.sh)
        # Use shfmt for shell scripts
        if command -v shfmt >/dev/null 2>&1; then
            echo "🐚 Using shfmt"
            shfmt -i -w "$FILE_PATH" || echo "⚠️  shfmt formatting failed"
        else
            echo "❌ shfmt not found, skipping formatting"
        fi
        ;;
    *.css|*.scss|*.less)
        # Use Prettier for CSS files
        if command -v prettier >/dev/null 2>&1; then
            echo "🎨 Using Prettier for CSS"
            prettier --write "$FILE_PATH" || echo "⚠️  Prettier formatting failed"
        else
            echo "❌ Prettier not found, skipping formatting"
        fi
        ;;
    *.html|*.htm)
        # Use Prettier for HTML files
        if command -v prettier >/dev/null 2>&1; then
            echo "🌐 Using Prettier for HTML"
            prettier --write "$FILE_PATH" || echo "⚠️  Prettier formatting failed"
        else
            echo "❌ Prettier not found, skipping formatting"
        fi
        ;;
    *)
        echo "ℹ️  No formatter available for: $FILE_PATH"
        ;;
esac

echo "✅ Formatting completed"

# Run linting if available
case "$FILE_PATH" in
    *.js|*.jsx|*.ts|*.tsx)
        if command -v eslint >/dev/null 2>&1; then
            echo "🔍 Running ESLint"
            eslint "$FILE_PATH" --fix || echo "⚠️  ESLint check failed"
        fi
        ;;
    *.py)
        if command -v flake8 >/dev/null 2>&1; then
            echo "🐍 Running flake8"
            flake8 "$FILE_PATH" || echo "⚠️  flake8 check failed"
        fi
        ;;
esac

echo "🎯 Quality checks completed"
#!/bin/bash
# Block destructive commands hook for Claude Code
# Prevents dangerous operations that could cause data loss

set -euo pipefail

# Get the command being executed
COMMAND="$1"
shift

# List of dangerous commands to block
DANGEROUS_COMMANDS=(
    "rm -rf"
    "rm -rf /"
    "sudo rm"
    "force push"
    "push --force"
    "git push --force"
    "git push -f"
    "drop database"
    "DROP DATABASE"
    "truncate"
    "dd if=/dev/zero"
    "mkfs"
    "format"
    ":(){ :|:& };:"
)

# Check if command contains dangerous patterns
for dangerous in "${DANGEROUS_COMMANDS[@]}"; do
    if [[ "$COMMAND" == *"$dangerous"* ]]; then
        echo "❌ BLOCKED: Dangerous command detected: $dangerous"
        echo "🛡️ This command is blocked by security hook to prevent data loss"
        echo "💡 If you really need to run this, use /permissions to temporarily allow it"
        exit 2
    fi
done

# Check for attempts to modify sensitive files
SENSITIVE_PATTERNS=(
    ".env"
    "id_rsa"
    "id_ed25519"
    "key.pem"
    "credentials"
    "secrets"
    "password"
    "token"
)

for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    if [[ "$COMMAND" == *"$pattern"* ]]; then
        echo "⚠️  WARNING: Attempting to modify sensitive file: $pattern"
        echo "🛡️ This violates zero-secrets policy"
        echo "💡 Use placeholder format: REPLACE_WITH_[TYPE]"
        exit 2
    fi
done

# Check for attempts to modify system directories
SYSTEM_DIRS=(
    "/etc/"
    "/usr/bin/"
    "/usr/local/bin/"
    "/bin/"
    "/sbin/"
)

for dir in "${SYSTEM_DIRS[@]}"; do
    if [[ "$COMMAND" == *"$dir"* ]]; then
        echo "❌ BLOCKED: Attempting to modify system directory: $dir"
        echo "🛡️ System modifications are blocked by security policy"
        exit 2
    fi
done

echo "✅ Security check passed"
exit 0
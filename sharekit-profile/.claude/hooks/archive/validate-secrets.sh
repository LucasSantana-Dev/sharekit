#!/bin/bash
# Validate secrets and enforce zero-secrets policy
# Ensures no secrets are committed or processed

set -euo pipefail

# Get the file being processed
FILE_PATH="$1"
shift

# Skip validation for certain file types
SKIP_PATTERNS=(
    "*.md"
    "*.txt"
    "*.json"
    "*.yml"
    "*.yaml"
    "*.lock"
    "*.log"
    "package-lock.json"
    "yarn.lock"
)

# Check if file should be skipped
for pattern in "${SKIP_PATTERNS[@]}"; do
    if [[ "$FILE_PATH" == $pattern ]]; then
        echo "ℹ️  Skipping secret validation for: $FILE_PATH"
        exit 0
    fi
done

# Check if file exists
if [[ ! -f "$FILE_PATH" ]]; then
    echo "ℹ️  File not found: $FILE_PATH"
    exit 0
fi

# Patterns that indicate secrets
SECRET_PATTERNS=(
    "password"
    "passwd"
    "secret"
    "key"
    "token"
    "api_key"
    "apikey"
    "private_key"
    "private_key"
    "access_token"
    "refresh_token"
    "auth_token"
    "jwt"
    "bearer"
    "credential"
    "credentials"
    "client_secret"
    "client_secret"
    "database_url"
    "db_url"
    "connection_string"
    "encrypt"
    "decrypt"
    "cipher"
    "private"
    "confidential"
    "sensitive"
)

# Placeholder patterns that are allowed
ALLOWED_PLACEHOLDERS=(
    "REPLACE_WITH_"
    "YOUR_"
    "EXAMPLE_"
    "DEMO_"
    "TEST_"
    "SAMPLE_"
    "PLACEHOLDER_"
)

echo "🔍 Scanning for secrets in: $FILE_PATH"

# Scan file for potential secrets
found_secrets=false
line_number=0

while IFS= read -r line; do
    ((line_number++))
    
    # Check each secret pattern
    for secret_pattern in "${SECRET_PATTERNS[@]}"; do
        if [[ "$line" =~ $secret_pattern ]]; then
            # Check if it's a valid placeholder
            is_placeholder=false
            for placeholder in "${ALLOWED_PLACEHOLDERS[@]}"; do
                if [[ "$line" =~ $placeholder ]]; then
                    is_placeholder=true
                    break
                fi
            done
            
            if [[ "$is_placeholder" == false ]]; then
                echo "❌ SECRET DETECTED at line $line_number: $secret_pattern"
                echo "📍 File: $FILE_PATH:$line_number"
                echo "📝 Content: $line"
                echo "🛡️ This violates the zero-secrets policy!"
                echo "💡 Use placeholder format: REPLACE_WITH_[TYPE]"
                found_secrets=true
            fi
        fi
    done
done < "$FILE_PATH"

# Check for base64 encoded secrets (common pattern)
if grep -q "^[A-Za-z0-9+/]*={0,2}$" "$FILE_PATH"; then
    echo "⚠️  WARNING: Possible base64 encoded content detected"
    echo "📍 File: $FILE_PATH"
    echo "🛡️ Please verify this is not a secret"
fi

# Check for URLs with credentials
if grep -qE "(https?://[^/]+:[^/@]+@|://[^/]+:[^/@]+@)" "$FILE_PATH"; then
    echo "❌ CREDENTIALS IN URL DETECTED"
    echo "📍 File: $FILE_PATH"
    echo "🛡️ URLs with credentials are not allowed"
    echo "💡 Use environment variables or placeholder format"
    found_secrets=true
fi

# Final result
if [[ "$found_secrets" == true ]]; then
    echo "❌ SECURITY VALIDATION FAILED"
    echo "🚨 Please remove secrets before proceeding"
    exit 2
else
    echo "✅ No secrets detected"
    echo "🛡️ Zero-secrets policy compliance verified"
    exit 0
fi
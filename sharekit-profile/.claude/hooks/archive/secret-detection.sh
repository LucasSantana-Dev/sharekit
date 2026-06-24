#!/bin/bash

# Secret detection hook for UIForge MCP
# Scans for hardcoded secrets and sensitive data

set -e

echo "🔍 Running secret detection..."

# Define secret patterns
declare -A SECRET_PATTERNS=(
    ["openai"]="sk-[a-zA-Z0-9]{48}"
    ["github"]="ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}|ghu_[a-zA-Z0-9]{36}|ghr_[a-zA-Z0-9]{36}|ghs_[a-zA-Z0-9]{36}"
    ["slack"]="xoxb-[0-9]{13}-[0-9]{14}-[a-zA-Z0-9]{24}|xoxp-[0-9]{13}-[0-9]{14}-[a-zA-Z0-9]{24}"
    ["aws"]="AKIA[0-9A-Z]{16}"
    ["email"]="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
    ["password"]="password[\"']?\s*[:=]\s*[\"']?[a-zA-Z0-9!@#$%^&*]{8,}"
    ["secret"]="secret[\"']?\s*[:=]\s*[\"']?[a-zA-Z0-9!@#$%^&*]{8,}"
    ["token"]="token[\"']?\s*[:=]\s*[\"']?[a-zA-Z0-9!@#$%^&*]{8,}"
    ["api_key"]="api_key[\"']?\s*[:=]\s*[\"']?[a-zA-Z0-9!@#$%^&*]{8,}"
    ["private_key"]="private_key[\"']?\s*[:=]\s*[\"']?[a-zA-Z0-9!@#$%^&*]{8,}"
)

# Files to scan
SCAN_DIRS=("src/" "tests/" "scripts/" "config/")
SCAN_EXTENSIONS=("ts" "js" "json" "yaml" "yml" "env" "config" "sh")

SECRETS_FOUND=false

# Scan each directory
for dir in "${SCAN_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "📁 Scanning $dir..."
        
        # Scan each file type
        for ext in "${SCAN_EXTENSIONS[@]}"; do
            find "$dir" -name "*.$ext" -type f 2>/dev/null | while read -r file; do
                # Skip node_modules and other ignored directories
                if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *".git"* ]]; then
                    continue
                fi
                
                # Check each secret pattern
                for pattern_name in "${!SECRET_PATTERNS[@]}"; do
                    pattern="${SECRET_PATTERNS[$pattern_name]}"
                    
                    if grep -E "$pattern" "$file" 2>/dev/null | head -3; then
                        echo "❌ $pattern_name secret pattern found in: $file"
                        SECRETS_FOUND=true
                    fi
                done
            done
        done
    fi
done

# Check for exposed configuration files
echo "🔍 Checking for exposed configuration files..."
EXPOSED_CONFIGS=(
    ".env"
    ".env.local"
    ".env.production"
    ".env.staging"
    "config.json"
    "secrets.json"
    "private.json"
    "api-keys.json"
    "credentials.json"
)

for config in "${EXPOSED_CONFIGS[@]}"; do
    if [ -f "$config" ]; then
        # Check if file is tracked in git
        if git ls-files | grep -q "$config" 2>/dev/null; then
            echo "❌ Configuration file $config is tracked in git"
            SECRETS_FOUND=true
        fi
    fi
done

# Check for hardcoded URLs with credentials
echo "🔍 Checking for hardcoded URLs with credentials..."
if grep -r -E "https?://[^/]*:[^/@]*@" src/ --include="*.ts" --include="*.js" --include="*.json" 2>/dev/null | head -3; then
    echo "❌ Hardcoded URLs with credentials found"
    SECRETS_FOUND=true
fi

# Check for base64 encoded secrets
echo "🔍 Checking for base64 encoded secrets..."
if grep -r -E "(sk-|ghp_|gho_|ghu_|ghr_|ghs_|xoxb-|xoxp-|AKIA)" src/ --include="*.ts" --include="*.js" --include="*.json" 2>/dev/null | grep -q "base64"; then
    echo "❌ Potential base64 encoded secrets found"
    SECRETS_FOUND=true
fi

if [ "$SECRETS_FOUND" = true ]; then
    echo ""
    echo "🚨 SECRETS DETECTED!"
    echo "Please remove or secure all sensitive data before proceeding."
    echo "Use environment variables or secret management systems instead."
    exit 1
else
    echo "✅ No secrets detected"
    exit 0
fi

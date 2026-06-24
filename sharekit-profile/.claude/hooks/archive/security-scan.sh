#!/bin/bash

# Security scanning hook for UIForge MCP
# Runs comprehensive security checks on code changes

set -e

echo "🔒 Running security scan..."

# Get the current working directory
WORK_DIR=$(pwd)

# Check if we're in a project with package.json
if [ ! -f "$WORK_DIR/package.json" ]; then
    echo "ℹ️  No package.json found, skipping security scan"
    exit 0
fi

# 1. Snyk security scan
echo "🛡️  Running Snyk security scan..."
if command -v snyk > /dev/null 2>&1; then
    if snyk test --severity-threshold=high > /dev/null 2>&1; then
        echo "✅ Snyk scan passed (no high/critical vulnerabilities)"
    else
        echo "⚠️  Snyk found vulnerabilities:"
        snyk test --severity-threshold=high
        echo "❌ Address security issues before proceeding"
        exit 1
    fi
else
    echo "⚠️  Snyk not installed, skipping dependency security scan"
fi

# 2. Check for hardcoded secrets in source code
echo "🔍 Scanning for hardcoded secrets..."
SECRET_PATTERNS=(
    "sk-[a-zA-Z0-9]{48}"
    "ghp_[a-zA-Z0-9]{36}"
    "gho_[a-zA-Z0-9]{36}"
    "ghu_[a-zA-Z0-9]{36}"
    "ghr_[a-zA-Z0-9]{36}"
    "ghs_[a-zA-Z0-9]{36}"
    "xoxb-[0-9]{13}-[0-9]{14}-[a-zA-Z0-9]{24}"
    "xoxp-[0-9]{13}-[0-9]{14}-[a-zA-Z0-9]{24}"
    "AKIA[0-9A-Z]{16}"
    "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
    "password[\"']?\s*[:=]\s*[\"']?[a-zA-Z0-9!@#$%^&*]{8,}"
    "secret[\"']?\s*[:=]\s*[\"']?[a-zA-Z0-9!@#$%^&*]{8,}"
    "token[\"']?\s*[:=]\s*[\"']?[a-zA-Z0-9!@#$%^&*]{8,}"
    "api_key[\"']?\s*[:=]\s*[\"']?[a-zA-Z0-9!@#$%^&*]{8,}"
    "private_key[\"']?\s*[:=]\s*[\"']?[a-zA-Z0-9!@#$%^&*]{8,}"
)

SECRETS_FOUND=false
for pattern in "${SECRET_PATTERNS[@]}"; do
    if grep -r -E "$pattern" src/ --include="*.ts" --include="*.js" --include="*.json" 2>/dev/null | head -5; then
        SECRETS_FOUND=true
        break
    fi
done

if [ "$SECRETS_FOUND" = true ]; then
    echo "❌ Potential secrets found in source code"
    echo "Please review and remove any hardcoded secrets"
    exit 1
else
    echo "✅ No hardcoded secrets detected"
fi

# 3. Check for insecure dependencies
echo "📦 Checking for insecure dependencies..."
if command -v npm > /dev/null 2>&1; then
    # Check for known vulnerable packages
    VULNERABLE_PACKAGES=$(npm audit --json 2>/dev/null | npx tsx -e "
import { readFileSync } from 'fs';
try {
    const audit = JSON.parse(readFileSync('/dev/stdin', 'utf8'));
    const vulns = Object.keys(audit.vulnerabilities || {});
    if (vulns.length > 0) {
        console.log(vulns.join(', '));
    }
} catch (e) {
    // Ignore errors
}
" 2>/dev/null || true)

    if [ -n "$VULNERABLE_PACKAGES" ]; then
        echo "⚠️  Vulnerable packages found: $VULNERABLE_PACKAGES"
        echo "Run 'npm audit fix' to address vulnerabilities"
    else
        echo "✅ No vulnerable packages detected"
    fi
fi

# 4. Check for insecure code patterns
echo "🔍 Scanning for insecure code patterns..."
INSECURE_PATTERNS=(
    "eval\("
    "new Function\("
    "innerHTML\s*="
    "outerHTML\s*="
    "document\.write\("
    "setTimeout\(.*string"
    "setInterval\(.*string"
    "crypto\.createHash\('md5'"
    "crypto\.createHash\('sha1'"
)

INSECURE_FOUND=false
for pattern in "${INSECURE_PATTERNS[@]}"; do
    if grep -r -E "$pattern" src/ --include="*.ts" --include="*.js" 2>/dev/null | head -3; then
        INSECURE_FOUND=true
        break
    fi
done

if [ "$INSECURE_FOUND" = true ]; then
    echo "⚠️  Potentially insecure code patterns found"
    echo "Please review and consider safer alternatives"
else
    echo "✅ No insecure code patterns detected"
fi

# 5. Check file permissions
echo "🔐 Checking file permissions..."
INSECURE_FILES=$(find . -name "*.sh" -perm /o+w 2>/dev/null || true)
if [ -n "$INSECURE_FILES" ]; then
    echo "⚠️  World-writable shell scripts found:"
    echo "$INSECURE_FILES"
    echo "Consider removing world-write permissions"
else
    echo "✅ File permissions look good"
fi

# 6. Check for exposed configuration files
echo "📄 Checking for exposed configuration..."
EXPOSED_CONFIGS=(
    ".env"
    ".env.local"
    ".env.production"
    "config.json"
    "secrets.json"
    "private.json"
)

for config in "${EXPOSED_CONFIGS[@]}"; do
    if [ -f "$config" ] && git ls-files | grep -q "$config"; then
        echo "❌ Configuration file $config is tracked in git"
        echo "Remove sensitive configuration files from version control"
        exit 1
    fi
done

echo "✅ No exposed configuration files in git"

echo "✅ Security scan completed successfully!"

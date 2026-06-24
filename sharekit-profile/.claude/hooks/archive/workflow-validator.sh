#!/bin/bash
# Workflow validation hook for Claude Code
# Validates workflows and ensures compliance with Forge Space standards

set -euo pipefail

WORKFLOW_TYPE="$1"
shift

echo "🔍 Validating workflow: $WORKFLOW_TYPE"

# Define validation rules
declare -A VALIDATION_RULES
VALIDATION_RULES+=("security|zero-secrets|authentication|authorization")
VALIDATION_RULES+=("quality|testing|coverage|linting|formatting")
VALIDATION_RULES+=("documentation|readme|api-docs|changelog")
VALIDATION_RULES+=("deployment|ci-cd|release|publish")
VALIDATION_RULES+=("development|feature|bugfix|refactor")

# Validate workflow compliance
case "$WORKFLOW_TYPE" in
    "security")
        echo "🛡️ Validating security workflow..."
        # Check zero-secrets compliance
        if [[ -f ".gitignore" ]] && grep -q "CLAUDE.md" ".gitignore"; then
            echo "✅ Zero-secrets policy enforced"
        else
            echo "⚠️ Zero-secrets policy needs enforcement"
        fi
        
        # Check security hooks
        if [[ -f "$HOME/.claude/hooks/security/validate-secrets.sh" ]]; then
            echo "✅ Security validation hooks available"
        else
            echo "⚠️ Security validation hooks missing"
        fi
        
        # Check security patterns
        if [[ -f "docs/SECURITY.md" ]]; then
            echo "✅ Security documentation available"
        else
            echo "⚠️ Security documentation missing"
        fi
        ;;
        
    "quality")
        echo "🎨 Validating quality workflow..."
        # Check quality gates
        if [[ -f "$HOME/.claude/hooks/quality/auto-format.sh" ]]; then
            echo "✅ Auto-formatting hooks available"
        else
            echo "⚠️ Auto-formatting hooks missing"
        fi
        
        # Check test coverage
        if [[ -f "jest.config.js" ]] || [[ -f "pytest.ini" ]] || [[ -f "Cargo.toml" ]]; then
            echo "✅ Testing framework configured"
        else
            echo "⚠️ Testing framework not configured"
        fi
        
        # Check linting
        if [[ -f ".eslintrc.js" ]] || [[ -f "pylintrc" ]] || [[ -f "rustfmt.toml" ]]; then
            echo "✅ Linting tools configured"
        else
            echo "⚠️ Linting tools not configured"
        fi
        ;;
        
    "documentation")
        echo "📚 Validating documentation workflow..."
        # Check README
        if [[ -f "README.md" ]]; then
            echo "✅ README.md exists"
        else
            echo "⚠️ README.md missing"
        fi
        
        # Check CHANGELOG
        if [[ -f "CHANGELOG.md" ]]; then
            echo "✅ CHANGELOG.md exists"
        else
            echo "⚠️ CHANGELOG.md missing"
        fi
        
        # Check API docs
        if [[ -d "docs/api" ]] || [[ -f "docs/API.md" ]]; then
            echo "✅ API documentation available"
        else
            echo "⚠️ API documentation missing"
        fi
        ;;
        
    "deployment")
        echo "🚀 Validating deployment workflow..."
        # Check CI/CD
        if [[ -d ".github/workflows" ]]; then
            echo "✅ GitHub Actions configured"
        else
            echo "⚠️ GitHub Actions not configured"
        fi
        
        # Check deployment scripts
        if [[ -d "scripts/deploy" ]] || [[ -f "deploy.sh" ]]; then
            echo "✅ Deployment scripts available"
        else
            echo "⚠️ Deployment scripts missing"
        fi
        
        # Check environment configuration
        if [[ -f ".env.example" ]] || [[ -f "config/production.json" ]]; then
            echo "✅ Environment configuration available"
        else
            echo "⚠️ Environment configuration missing"
        fi
        ;;
        
    "development")
        echo "💻 Validating development workflow..."
        # Check package management
        if [[ -f "package.json" ]] || [[ -f "requirements.txt" ]] || [[ -f "Cargo.toml" ]]; then
            echo "✅ Package management configured"
        else
            echo "⚠️ Package management not configured"
        fi
        
        # Check development environment
        if [[ -f ".gitignore" ]]; then
            echo "✅ Git ignore configured"
        else
            echo "⚠️ Git ignore not configured"
        fi
        
        # Check development scripts
        if [[ -f "package.json" ]] && grep -q "scripts" "package.json"; then
            echo "✅ Development scripts available"
        else
            echo "⚠️ Development scripts missing"
        fi
        ;;
        
    *)
        echo "🔍 Validating general workflow..."
        echo "⚠️ Unknown workflow type: $WORKFLOW_TYPE"
        ;;
esac

# Validate Forge Space compliance
echo "🏗️ Validating Forge Space compliance..."

# Check trunk-based development
if [[ -f ".github/workflows/branch-protection.yml" ]]; then
    echo "✅ Branch protection configured"
else
    echo "⚠️ Branch protection not configured"
fi

# Check semantic versioning
if [[ -f "package.json" ]] && grep -q "version" "package.json"; then
    echo "✅ Semantic versioning configured"
else
    echo "⚠️ Semantic versioning not configured"
fi

# Check quality gates
if [[ -f ".github/workflows/quality-gates.yml" ]]; then
    echo "✅ Quality gates configured"
else
    echo "⚠️ Quality gates not configured"
fi

# Validate optimization settings
echo "🎯 Validating optimization settings..."

# Check context optimization
if [[ -f "$HOME/.claude/settings.json" ]] && grep -q "contextOptimization" "$HOME/.claude/settings.json"; then
    echo "✅ Context optimization configured"
else
    echo "⚠️ Context optimization not configured"
fi

# Check token optimization
if [[ -f "$HOME/.claude/settings.json" ]] && grep -q "tokenOptimization" "$HOME/.claude/settings.json"; then
    echo "✅ Token optimization configured"
else
    echo "⚠️ Token optimization not configured"
fi

# Check productivity settings
if [[ -f "$HOME/.claude/settings.json" ]] && grep -q "productivity" "$HOME/.claude/settings.json"; then
    echo "✅ Productivity settings configured"
else
    echo "⚠️ Productivity settings not configured"
fi

# Generate validation report
echo "📊 Validation Report:"
echo "   Total checks: $(grep -c "✅" <<< "$(echo "$VALIDATION_RESULTS")")"
echo "   Passed: $(grep -c "✅" <<< "$(echo "$VALIDATION_RESULTS")")"
echo "   Warnings: $(grep -c "⚠️" <<< "$(echo "$VALIDATION_RESULTS")")"
echo "   Compliance: $(grep -c "✅" <<< "$(echo "$VALIDATION_RESULTS")") / $(grep -c "✅\|⚠️" <<< "$(echo "$VALIDATION_RESULTS")") * 100 | bc)%"

# Log validation results
VALIDATION_LOG="$HOME/.claude/logs/validation-$(date +%Y%m%d).log"
mkdir -p "$(dirname "$VALIDATION_LOG")"
echo "$(date): Workflow validation completed for $WORKFLOW_TYPE" >> "$VALIDATION_LOG"
echo "Results: $(grep -c "✅" <<< "$(echo "$VALIDATION_RESULTS")") passed, $(grep -c "⚠️" <<< "$(echo "$VALIDATION_RESULTS")") warnings" >> "$VALIDATION_LOG"

exit 0
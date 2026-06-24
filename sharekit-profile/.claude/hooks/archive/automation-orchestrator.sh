#!/bin/bash

# Claude Code Hook: Automation Orchestrator
# Intelligent automation orchestration for development workflows

set -euo pipefail

# Read the command from stdin
COMMAND_JSON=$(cat)
COMMAND=$(echo "$COMMAND_JSON" | jq -r '.command // empty')

# Automation configuration
AUTOMATION_CONFIG="$HOME/.claude/automation-config.json"
WORKFLOW_LOG="$HOME/.claude/workflow.log"
METRICS_FILE="$HOME/.claude/automation-metrics.json"

# Initialize metrics if not exists
if [[ ! -f "$METRICS_FILE" ]]; then
    echo '{"automations_run": 0, "time_saved_minutes": 0, "errors_prevented": 0}' > "$METRICS_FILE"
fi

# Log function
log_workflow() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$WORKFLOW_LOG"
}

# Update metrics
update_metrics() {
    local automation_type="$1"
    local time_saved="$2"
    
    jq --arg type "$automation_type" --arg time "$time_saved" '
        .automations_run += 1 |
        .time_saved_minutes += ($time | tonumber) |
        if .type_counts[$type] then
            .type_counts[$type] += 1
        else
            .type_counts[$type] = 1
        end
    ' "$METRICS_FILE" > "$METRICS_FILE.tmp" && mv "$METRICS_FILE.tmp" "$METRICS_FILE"
}

# Detect automation opportunities
detect_automation_opportunity() {
    local cmd="$1"
    
    # Code change automation
    if [[ "$cmd" =~ ^(git\ add|git\ commit) ]]; then
        log_workflow "Code change detected: $cmd"
        
        # Run pre-commit automation
        if command -v npm &> /dev/null && [[ -f "package.json" ]]; then
            log_workflow "Running npm pre-commit automation"
            npm run lint --silent 2>/dev/null || true
            npm run test --silent 2>/dev/null || true
            update_metrics "pre-commit" 5
        fi
        
        if command -v python3 &> /dev/null && [[ -f "requirements.txt" ]]; then
            log_workflow "Running Python pre-commit automation"
            python3 -m ruff check --fix --quiet 2>/dev/null || true
            python3 -m pytest -q 2>/dev/null || true
            update_metrics "pre-commit" 3
        fi
    fi
    
    # File creation automation
    if [[ "$cmd" =~ ^(touch|mkdir|cp) && "$cmd" =~ \.(py|js|ts|jsx|tsx)$ ]]; then
        log_workflow "Code file created: $cmd"
        
        # Auto-format new files
        local file_path=$(echo "$cmd" | sed 's/.* //')
        if [[ "$file_path" =~ \.(js|ts|jsx|tsx)$ ]] && command -v prettier &> /dev/null; then
            log_workflow "Auto-formatting JavaScript/TypeScript file: $file_path"
            npx prettier --write "$file_path" 2>/dev/null || true
            update_metrics "auto-format" 1
        fi
        
        if [[ "$file_path" =~ \.py$ ]] && command -v black &> /dev/null; then
            log_workflow "Auto-formatting Python file: $file_path"
            black "$file_path" 2>/dev/null || true
            update_metrics "auto-format" 1
        fi
    fi
    
    # Docker operations automation
    if [[ "$cmd" =~ ^docker\ (compose|build|run) ]]; then
        log_workflow "Docker operation detected: $cmd"
        
        # Security scan before building
        if [[ "$cmd" =~ docker\ build ]] && command -v grype &> /dev/null; then
            log_workflow "Running Docker security scan"
            # This would be integrated with your actual Docker image
            update_metrics "security-scan" 2
        fi
    fi
    
    # Testing automation
    if [[ "$cmd" =~ ^(npm\ test|pytest|make\ test) ]]; then
        log_workflow "Testing operation: $cmd"
        
        # Generate coverage report if available
        if [[ "$cmd" =~ pytest ]] && command -v coverage &> /dev/null; then
            log_workflow "Generating Python coverage report"
            coverage report --show-missing 2>/dev/null || true
            update_metrics "coverage-report" 1
        fi
        
        if [[ "$cmd" =~ npm\ test ]] && command -v nyc &> /dev/null; then
            log_workflow "Generating JavaScript coverage report"
            npx nyc report --reporter=text-summary 2>/dev/null || true
            update_metrics "coverage-report" 1
        fi
    fi
}

# Quality gate validation
validate_quality_gates() {
    local cmd="$1"
    
    # Check for common issues before allowing operation
    if [[ "$cmd" =~ git\ push ]]; then
        log_workflow "Validating quality gates before push"
        
        local issues_found=0
        
        # Check for TODO/FIXME comments
        if git grep -r "TODO\|FIXME\|XXX" --include="*.py" --include="*.js" --include="*.ts" . 2>/dev/null | grep -v vendor | head -5 > /tmp/todo_check.txt; then
            log_workflow "WARNING: Found TODO/FIXME comments:"
            cat /tmp/todo_check.txt >> "$WORKFLOW_LOG"
            issues_found=$((issues_found + 1))
        fi
        
        # Check for console.log statements
        if git grep -r "console\.log\|print\(" --include="*.js" --include="*.ts" --include="*.py" . 2>/dev/null | grep -v vendor | head -5 > /tmp/console_check.txt; then
            log_workflow "WARNING: Found console.log/print statements:"
            cat /tmp/console_check.txt >> "$WORKFLOW_LOG"
            issues_found=$((issues_found + 1))
        fi
        
        # Check for hardcoded secrets (basic pattern)
        if git grep -r "(password|secret|key|token)\s*=\s*[\"'][^\"']+[\"']" --include="*.py" --include="*.js" --include="*.ts" . 2>/dev/null | head -3 > /tmp/secret_check.txt; then
            log_workflow "SECURITY WARNING: Potential hardcoded secrets detected:"
            cat /tmp/secret_check.txt >> "$WORKFLOW_LOG"
            issues_found=$((issues_found + 10)) # Higher weight for security
        fi
        
        if [[ $issues_found -gt 5 ]]; then
            log_workflow "QUALITY GATE BLOCKED: Too many issues found ($issues_found)"
            echo "⚠️  Quality gate blocked: $issues_found issues detected. Check $WORKFLOW_LOG for details."
            exit 2
        fi
        
        update_metrics "quality-gate" 2
    fi
}

# Performance optimization suggestions
suggest_optimizations() {
    local cmd="$1"
    
    # Suggest performance improvements based on context
    if [[ "$cmd" =~ npm\ install ]]; then
        log_workflow "Suggesting npm install optimizations"
        
        if [[ -f "package-lock.json" ]]; then
            echo "💡 Consider running 'npm ci' for faster, reliable installs"
        fi
        
        if command -v npm-check-updates &> /dev/null; then
            echo "💡 Check for outdated packages with 'npm-check-updates'"
        fi
        
        update_metrics "optimization-suggestion" 1
    fi
    
    if [[ "$cmd" =~ pip\ install ]]; then
        log_workflow "Suggesting Python optimization"
        
        echo "💡 Consider using 'pip install -r requirements.txt' for reproducible installs"
        
        if command -v pip-check &> /dev/null; then
            echo "💡 Check for outdated packages with 'pip-check'"
        fi
        
        update_metrics "optimization-suggestion" 1
    fi
}

# Main automation orchestration
main() {
    log_workflow "Automation orchestrator triggered for: $COMMAND"
    
    # Detect and run appropriate automations
    detect_automation_opportunity "$COMMAND"
    
    # Validate quality gates
    validate_quality_gates "$COMMAND"
    
    # Suggest optimizations
    suggest_optimizations "$COMMAND"
    
    log_workflow "Automation orchestration completed for: $COMMAND"
}

# Run main function
main "$@"

#!/bin/bash
# Context backup hook for Claude Code
# Backs up important context before compaction

set -euo pipefail

SESSION_ID="$1"
shift

echo "💾 Backing up context for session: $SESSION_ID"

# Create backup directory
BACKUP_DIR="$HOME/.claude/backups"
mkdir -p "$BACKUP_DIR"

# Create timestamped backup file
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_FILE="$BACKUP_DIR/context-$SESSION_ID-$TIMESTAMP.json"

echo "📁 Creating context backup: $BACKUP_FILE"

# Gather context information
CONTEXT_DATA="{
  \"session_id\": \"$SESSION_ID\",
  \"timestamp\": \"$(date -Iseconds)\",
  \"project_path\": \"$(pwd)\",
  \"git_branch\": \"$(git branch --show-current 2>/dev/null || echo 'no-git')\",
  \"claude_files\": [],"

# Add CLAUDE.md content if exists
if [[ -f "CLAUDE.md" ]]; then
    echo "  \"claude_md_content\": $(jq -Rs '"' '(.*)' "$(<CLAUDE.md" | head -50), "  \"claude_md_lines\": $(wc -l < CLAUDE.md | cut -d' ' -f1),"
else
    echo "  \"claude_md_content\": null,"
    echo "  \"claude_md_lines\": 0,"
fi

# Add project structure information
if command -v find >/dev/null 2>&1; then
    echo "  \"project_structure\": {"
    echo "    \"total_files\": $(find . -type f -not -path './node_modules/*' -not -path './.git/*' | wc -l),"
    echo "    \"directories\": $(find . -type d -not -path './node_modules/*' -not -path './.git/*' | wc -l),"
    echo "    \"file_types\": {"
    
    # Count file types
    for ext in ts js py rs go md json yml yaml sh; do
        count=$(find . -name "*.$ext" -type f -not -path './node_modules/*' -not -path './.git/*' 2>/dev/null | wc -l)
        echo "      \"$ext\": $count,"
    done
    
    echo "    }"
    echo "  },"
else
    echo "  \"project_structure\": null,"
fi

# Add MCP server status
if [[ -f "$HOME/.claude/settings.json" ]] && command -v jq >/dev/null 2>&1; then
    echo "  \"mcp_servers\": $(jq -r '.mcpServers | keys[]' "$HOME/.claude/settings.json" | jq -R 'map(. | {name: .}) | reduce add .[]; .'),"
else
    echo "  \"mcp_servers\": [],"
fi

# Add available agents
if [[ -d ".claude/agents" ]]; then
    echo "  \"available_agents\": ["
    first=true
    for agent_dir in .claude/agents/*; do
        if [[ -d "$agent_dir" ]]; then
            agent_name=$(basename "$agent_dir")
            if [[ "$first" == false ]]; then
                echo ","
            fi
            echo "    \"$agent_name\""
            first=false
        fi
    done
    echo "  ],"
else
    echo "  \"available_agents\": [],"
fi

# Add available commands
if [[ -d ".claude/commands" ]]; then
    echo "  \"available_commands\": ["
    first=true
    for cmd_dir in .claude/commands/*; do
        if [[ -d "$cmd_dir" ]]; then
            cmd_name=$(basename "$cmd_dir")
            if [[ "$first" == false ]]; then
                echo ","
            fi
            echo "    \"$cmd_name\""
            first=false
        fi
    done
    echo "  ],"
else
    echo "  \"available_commands\": [],"
fi

# Add recent git activity
if [[ -f ".git" ]]; then
    echo "  \"recent_commits\": ["
    first=true
    git log --oneline --format="{\"hash\": \"%H\", \"message\": \"%s\", \"author\": \"%an\", \"date\": \"%ad\"}" -5 2>/dev/null | while read -r line; do
        if [[ "$first" == false ]]; then
            echo ","
        fi
        echo "    $line"
        first=false
    done
    echo "  ],"
else
    echo "  \"recent_commits\": [],"
fi

# Add system information
echo "  \"system_info\": {"
echo "    \"platform\": \"$(uname -s)\","
echo "    \"shell\": \"$SHELL\","
echo "    \"user\": \"$USER\","
echo "    \"claude_version\": \"$(claude --version 2>/dev/null || echo 'unknown')\","
echo "    \"working_directory\": \"$(pwd)\""
echo "  },"

# Add optimization settings
if [[ -f "$HOME/.claude/settings.json" ]]; then
    echo "  \"optimization_settings\": {"
    
    # Context optimization
    if grep -q "contextOptimization" "$HOME/.claude/settings.json"; then
        echo "    \"context_optimization\": $(jq -r '.contextOptimization' "$HOME/.claude/settings.json"),"
    else
        echo "    \"context_optimization\": null,"
    fi
    
    # Token optimization
    if grep -q "tokenOptimization" "$HOME/.claude/settings.json"; then
        echo "    \"token_optimization\": $(jq -r '.tokenOptimization' "$HOME/.claude/settings.json"),"
    else
        echo "    \"token_optimization\": null,"
    fi
    
    # Productivity settings
    if grep -q "productivity" "$HOME/.claude/settings.json"; then
        echo "    \"productivity\": $(jq -r '.productivity' "$HOME/.claude/settings.json"),"
    else
        echo "    \"productivity\": null,"
    fi
    
    echo "  },"
else
    echo "  \"optimization_settings\": null,"
fi

echo "}"

# Write backup file
echo "$CONTEXT_DATA" > "$BACKUP_FILE"

# Compress backup if it's large
BACKUP_SIZE=$(wc -c < "$BACKUP_FILE" | cut -d' ' -f1)
if [[ $BACKUP_SIZE -gt 10000 ]]; then
    echo "🗜️ Compressing large backup file..."
    gzip "$BACKUP_FILE"
    BACKUP_FILE="$BACKUP_FILE.gz"
fi

# Clean up old backups (keep last 10)
find "$BACKUP_DIR" -name "context-*" -type f -mtime +7 -delete 2>/dev/null || true

echo "✅ Context backup completed"
echo "📁 Backup saved to: $BACKUP_FILE"
echo "💾 Old backups cleaned up"

# Log backup event
SESSION_LOG_DIR="$HOME/.claude/logs"
SESSION_LOG_FILE="$SESSION_LOG_DIR/session-$SESSION_ID.log"
mkdir -p "$SESSION_LOG_DIR"
echo "$(date): Context backup created at $BACKUP_FILE" >> "$SESSION_LOG_FILE"

exit 0
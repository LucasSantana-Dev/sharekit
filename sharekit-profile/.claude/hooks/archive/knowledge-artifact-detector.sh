#!/bin/bash
# Detects writes to knowledge artifacts (ADRs, specs, context docs, plans)
# and nudges Claude to graphify the key concepts + save a memory entry.

set -euo pipefail

input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

[ -z "$file_path" ] && exit 0

# Patterns that constitute a knowledge artifact
if echo "$file_path" | grep -qE \
  '(docs/decisions/|docs/adr/|\.spec\.md$|CONTEXT\.md$|\.prd\.md$|\.claude/plans/|ADR[-_.])'; then
  printf '{"systemMessage": "⚡ Knowledge artifact written: `%s`. Call /graphify on the key concepts and write a memory entry for any non-obvious decisions."}\n' "$file_path"
fi

#!/usr/bin/env bash
# test-classifier.sh — smoke test for complexity-classifier.sh
# Usage: bash ~/.claude/hooks/test-classifier.sh
# Exits 0 if all assertions pass, 1 if any fail.

set -uo pipefail

CLASSIFIER="$HOME/.claude/hooks/complexity-classifier.sh"
COMPLEXITY_FILE="$HOME/.claude/.task-complexity"

run_classify() {
	local prompt="$1"
	rm -f "$COMPLEXITY_FILE"
	echo "{\"message\": $(python3 -c "import json,sys; print(json.dumps(sys.argv[1]))" "$prompt")}" |
		bash "$CLASSIFIER" >/dev/null 2>&1 || true
	cat "$COMPLEXITY_FILE" 2>/dev/null || echo "medium"
}

PASS=0
FAIL=0

assert() {
	local prompt="$1"
	local expected="$2"
	local actual
	actual=$(run_classify "$prompt")
	if [[ "$actual" == "$expected" ]]; then
		echo "  PASS [$expected] $prompt"
		((PASS++)) || true
	else
		echo "  FAIL [$expected != $actual] $prompt"
		((FAIL++)) || true
	fi
}

echo "=== complexity-classifier smoke test ==="

# LOW
assert "git status" "low"
assert "list all files in the src directory" "low"
assert "what is a closure" "low"
assert "tldr" "low"

# MEDIUM (no file written = default; we read "medium" from fallback)
assert "add a helper function to format dates" "medium"
assert "explain how queues work" "medium"

# HIGH
assert "implement the auth refresh flow with JWT and refresh token rotation" "high"
assert "refactor the player factory to remove the bridge pattern" "high"
assert "/plan the new onboarding feature rollout" "high"
assert "create a pull request for the cache fix" "high"

# CRITICAL
assert "deploy to production and run the database migration" "critical"
assert "rollback the last release — users are reporting data loss" "critical"
assert "rotate the API secret after the security incident" "critical"

echo ""
echo "Results: $PASS passed, $FAIL failed"
[[ "$FAIL" -eq 0 ]]

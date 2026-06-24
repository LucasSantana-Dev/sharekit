#!/usr/bin/env bash
# Test suite for auto-context-pack hook
set -e

HOOK="$HOME/.claude/hooks/auto-context-pack.sh"
PASS=0
FAIL=0

test_case() {
  local name="$1"
  local input="$2"
  local expect_output="$3"  # "yes" or "no"
  
  echo -n "Test: $name ... "
  
  output=$(echo "$input" | bash "$HOOK" 2>&1)
  
  if [ "$expect_output" = "yes" ]; then
    if [ -n "$output" ] && [[ "$output" == *"Context pack"* ]]; then
      echo "PASS"
      ((PASS++))
    else
      echo "FAIL (expected output, got none)"
      ((FAIL++))
    fi
  else  # "no"
    if [ -z "$output" ]; then
      echo "PASS"
      ((PASS++))
    else
      echo "FAIL (expected no output, got: ${output:0:50}...)"
      ((FAIL++))
    fi
  fi
}

echo "================================"
echo "auto-context-pack Hook Tests"
echo "================================"
echo ""

# Test cases that SHOULD trigger
test_case "implement task" '{"prompt": "implement foo in bar.ts"}' "yes"
test_case "refactor keyword" '{"prompt": "refactor the player factory"}' "yes"
test_case "fix bug" '{"prompt": "fix authentication issue in middleware"}' "yes"
test_case "add feature" '{"prompt": "add retry logic to fetch"}' "yes"
test_case "update config" '{"prompt": "update config parser to handle env vars"}' "yes"
test_case "debug issue" '{"prompt": "debug why tests are timing out"}' "yes"

# Test cases that should NOT trigger
test_case "greeting" '{"prompt": "hello"}' "no"
test_case "short prompt" '{"prompt": "hi there"}' "no"
test_case "no keywords" '{"prompt": "what is typescript and how does it work"}' "no"
test_case "explain only" '{"prompt": "explain the config module"}' "no"
test_case "empty prompt" '{"prompt": ""}' "no"
test_case "no JSON" '{"invalid": "json"}' "no"

echo ""
echo "================================"
echo "Results: $PASS passed, $FAIL failed"
echo "================================"

exit $FAIL

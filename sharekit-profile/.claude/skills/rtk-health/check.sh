#!/usr/bin/env bash
# rtk-health: verify no probe command returns EC=3 (ask rule) after an rtk update.
#
# Why EC=3 matters: in bypassPermissions mode, ask-rule commands are silently dropped
# rather than prompted. This means a newly-added ask rule would cause those commands to
# vanish without error — no token savings, no execution.
#
# Run after: rtk update, rtk upgrade, any change to rtk version.
# Exit: 0 = all clear, 1 = one or more EC=3 found (action required).
set -uo pipefail

RTK=$(command -v rtk 2>/dev/null || echo "")
if [ -z "$RTK" ]; then
  echo "ERROR: rtk not found in PATH" >&2
  exit 1
fi

RTK_VERSION=$("$RTK" --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
echo "rtk-health — rtk $RTK_VERSION — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo

# Probe set: commands Claude Code sessions use frequently.
# Each entry: "label|command"
PROBES=(
  # Read operations
  "find-ts|find . -name '*.ts' -type f"
  "find-py|find . -name '*.py' -type f"
  "cat-file|cat package.json"
  "grep-src|grep -rn 'TODO' src/"
  "ls-dir|ls -la ."
  "head-file|head -50 README.md"
  "wc-lines|wc -l src/index.ts"
  "stat-file|stat README.md"

  # Git read operations
  "git-log|git log --oneline -20"
  "git-diff|git diff HEAD"
  "git-status|git status"
  "git-show|git show HEAD:package.json"
  "git-blame|git blame src/index.ts"

  # Git write operations (likely EC=0 rewrites or EC=1 pass-through)
  "git-push|git push"
  "git-push-main|git push origin main"
  "git-commit|git commit -m 'test'"

  # GitHub CLI
  "gh-pr-view|gh pr view 1"
  "gh-pr-list|gh pr list --state open"
  "gh-run-list|gh run list --limit 5"
  "gh-pr-merge|gh pr merge 1 --squash"

  # npm/node
  "npm-test|npm test"
  "npm-build|npm run build"
  "npm-install|npm install"

  # Shell utilities
  "curl-get|curl -s https://api.example.com/health"
  "jq-pipe|cat data.json | jq '.key'"
)

ok=0
warn=0
warn_list=()

for probe in "${PROBES[@]}"; do
  label="${probe%%|*}"
  cmd="${probe#*|}"
  result=$(rtk rewrite "$cmd" 2>&1) && ec=0 || ec=$?

  case $ec in
    0) status="OK  (rewrite)"; ok=$((ok+1)) ;;
    1) status="OK  (passthru)"; ok=$((ok+1)) ;;
    2) status="OK  (deny)   "; ok=$((ok+1)) ;;
    3)
      status="WARN EC=3 ask-rule → silent-drop in bypassPermissions"
      warn=$((warn+1))
      warn_list+=("$label: $cmd")
      ;;
    *)
      status="WARN EC=$ec (unexpected)"
      warn=$((warn+1))
      warn_list+=("$label: $cmd [EC=$ec]")
      ;;
  esac

  printf "  %-20s %s\n" "$label" "$status"
done

echo
echo "Results: $ok OK, $warn WARN"

if [ ${#warn_list[@]} -gt 0 ]; then
  echo
  echo "ACTION REQUIRED — these commands will silently misbehave in bypassPermissions:"
  for item in "${warn_list[@]}"; do
    echo "  - $item"
  done
  echo
  echo "Fix: add a bypass for these commands in bash-prefilter.sh, OR"
  echo "     pin rtk to previous version until upstream resolves EC=3 for them."
  exit 1
fi

echo "All clear — no EC=3 ask-rules detected in rtk $RTK_VERSION."

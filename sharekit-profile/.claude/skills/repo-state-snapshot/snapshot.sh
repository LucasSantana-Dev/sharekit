#!/usr/bin/env bash
# repo-state-snapshot helper — captures one labeled snapshot.
#
# Usage:
#   snapshot.sh --label <name> [--diff <prior-label>] [--dir <path>] [--quiet]
#
# Emits the JSON file path on stdout (one line). When not --quiet, also prints
# the human-readable summary to stdout. Diff block follows when --diff is set
# and the prior snapshot exists.

set -uo pipefail

LABEL=""
DIFF_PRIOR=""
DIR=""
QUIET=0

while [ $# -gt 0 ]; do
  case "$1" in
    --label) LABEL=${2:-}; shift 2;;
    --diff)  DIFF_PRIOR=${2:-}; shift 2;;
    --dir)   DIR=${2:-}; shift 2;;
    --quiet) QUIET=1; shift;;
    -h|--help)
      sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
      exit 0;;
    *)
      echo "unknown flag: $1" >&2
      exit 2;;
  esac
done

[ -z "$LABEL" ] && { echo "--label is required" >&2; exit 2; }

# Resolve repo dir
if [ -n "$DIR" ]; then
  cd "$DIR" || { echo "cannot cd to $DIR" >&2; exit 1; }
fi

ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || {
  echo "not a git repo: $(pwd)" >&2
  exit 1
}
cd "$ROOT" || exit 1

REMOTE=$(git remote get-url origin 2>/dev/null || true)
OWNER_NAME=$(printf '%s' "$REMOTE" \
  | sed -E 's#^(git@github.com:|https://github.com/)##; s#\.git$##')
[ -z "$OWNER_NAME" ] && OWNER_NAME=$(basename "$ROOT")

SAFE_OWNER_NAME=$(printf '%s' "$OWNER_NAME" | tr '/' '_')
SNAP_DIR="$HOME/.claude/state/snapshots/$SAFE_OWNER_NAME"
mkdir -p "$SNAP_DIR"

NEW_FILE="$SNAP_DIR/$LABEL.json"
PRIOR_FILE="$SNAP_DIR/$DIFF_PRIOR.json"

# Preserve prior under .prev if overwriting same label
if [ -f "$NEW_FILE" ]; then
  mv -f "$NEW_FILE" "$NEW_FILE.prev" 2>/dev/null || true
fi

# Capture git state
HEAD_SHA=$(git rev-parse HEAD 2>/dev/null || echo "")
HEAD_SUBJECT=$(git log -1 --format=%s 2>/dev/null || echo "")
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
PORCELAIN=$(git status --porcelain 2>/dev/null || echo "")
UNCOMMITTED=$(printf '%s\n' "$PORCELAIN" | grep -cv '^??' || true)
UNTRACKED=$(printf '%s\n' "$PORCELAIN" | grep -c '^??' || true)
AHEAD_BEHIND=$(git rev-list --left-right --count "HEAD...@{u}" 2>/dev/null || echo "0	0")
AHEAD=$(printf '%s' "$AHEAD_BEHIND" | awk '{print $1}')
BEHIND=$(printf '%s' "$AHEAD_BEHIND" | awk '{print $2}')

# Capture gh state (gracefully degrade if gh unavailable/unauth)
gh_check=$(gh auth status 2>&1 >/dev/null && echo ok || echo no)

if [ "$gh_check" = "ok" ]; then
  ISSUES_JSON=$(timeout 10 gh issue list --state open --json number --limit 200 2>/dev/null || echo "[]")
  PRS_JSON=$(timeout 10 gh pr list --state open --json number --limit 100 2>/dev/null || echo "[]")
  RELEASES_JSON=$(timeout 10 gh release list --limit 20 --json tagName,publishedAt,isDraft 2>/dev/null || echo "[]")
else
  ISSUES_JSON="[]"
  PRS_JSON="[]"
  RELEASES_JSON="[]"
fi

OPEN_ISSUES_COUNT=$(printf '%s' "$ISSUES_JSON" | jq 'length' 2>/dev/null || echo 0)
OPEN_PRS_COUNT=$(printf '%s' "$PRS_JSON" | jq 'length' 2>/dev/null || echo 0)
OPEN_ISSUES_NUMS=$(printf '%s' "$ISSUES_JSON" | jq '[.[].number]' 2>/dev/null || echo "[]")
OPEN_PRS_NUMS=$(printf '%s' "$PRS_JSON" | jq '[.[].number]' 2>/dev/null || echo "[]")
LATEST_TAG=$(printf '%s' "$RELEASES_JSON" | jq -r '[.[] | select(.isDraft==false)] | .[0].tagName // ""' 2>/dev/null || echo "")
LATEST_PUBLISHED=$(printf '%s' "$RELEASES_JSON" | jq -r '[.[] | select(.isDraft==false)] | .[0].publishedAt // ""' 2>/dev/null || echo "")
DRAFTS=$(printf '%s' "$RELEASES_JSON" | jq -c '[.[] | select(.isDraft==true) | .tagName]' 2>/dev/null || echo "[]")

TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Write JSON
jq -n \
  --arg label "$LABEL" \
  --arg ts "$TS" \
  --arg repo "$OWNER_NAME" \
  --arg dir "$ROOT" \
  --arg branch "$BRANCH" \
  --arg head_sha "$HEAD_SHA" \
  --arg head_subject "$HEAD_SUBJECT" \
  --argjson uncommitted "${UNCOMMITTED:-0}" \
  --argjson untracked "${UNTRACKED:-0}" \
  --argjson ahead "${AHEAD:-0}" \
  --argjson behind "${BEHIND:-0}" \
  --argjson open_issues_count "${OPEN_ISSUES_COUNT:-0}" \
  --argjson open_prs_count "${OPEN_PRS_COUNT:-0}" \
  --argjson open_issues_nums "${OPEN_ISSUES_NUMS:-[]}" \
  --argjson open_prs_nums "${OPEN_PRS_NUMS:-[]}" \
  --arg latest_tag "$LATEST_TAG" \
  --arg latest_published "$LATEST_PUBLISHED" \
  --argjson drafts "${DRAFTS:-[]}" \
  '{
    label: $label,
    timestamp: $ts,
    repo: { name: $repo, dir: $dir, branch: $branch, head_sha: $head_sha, head_subject: $head_subject },
    git:  { uncommitted_files: $uncommitted, untracked_files: $untracked, ahead: $ahead, behind: $behind },
    issues: { open_count: $open_issues_count, open_numbers: $open_issues_nums },
    prs:    { open_count: $open_prs_count, open_numbers: $open_prs_nums },
    releases: { latest_tag: $latest_tag, latest_published_at: $latest_published, drafts: $drafts }
  }' > "$NEW_FILE"

# Always emit JSON path
echo "$NEW_FILE"

# Human-readable summary
if [ "$QUIET" -eq 0 ]; then
  cat <<EOF

REPO STATE SNAPSHOT — $OWNER_NAME

Label: $LABEL     $TS
Saved: $NEW_FILE

Current state
  Branch:        $BRANCH (${AHEAD}↑ ${BEHIND}↓)
  HEAD:          ${HEAD_SHA:0:7} $HEAD_SUBJECT
  Uncommitted:   $UNCOMMITTED files
  Untracked:     $UNTRACKED files
  Open issues:   $OPEN_ISSUES_COUNT
  Open PRs:      $OPEN_PRS_COUNT
  Latest release: ${LATEST_TAG:-"(none)"}
  Drafts:        $(echo "$DRAFTS" | jq -r 'if length == 0 then "none" else (join(", ")) end' 2>/dev/null || echo "(unknown)")
EOF

  # Diff vs prior
  if [ -n "$DIFF_PRIOR" ]; then
    if [ -f "$PRIOR_FILE" ]; then
      PRIOR_SHA=$(jq -r '.repo.head_sha' < "$PRIOR_FILE")
      PRIOR_BRANCH=$(jq -r '.repo.branch' < "$PRIOR_FILE")
      PRIOR_OPEN_ISSUES=$(jq -r '.issues.open_count' < "$PRIOR_FILE")
      PRIOR_OPEN_PRS=$(jq -r '.prs.open_count' < "$PRIOR_FILE")
      PRIOR_TAG=$(jq -r '.releases.latest_tag' < "$PRIOR_FILE")
      PRIOR_UNCOMMITTED=$(jq -r '.git.uncommitted_files' < "$PRIOR_FILE")
      PRIOR_DRAFTS=$(jq -r '.releases.drafts | if length == 0 then "none" else (join(", ")) end' < "$PRIOR_FILE")

      CLOSED_ISSUES=$(jq -nr --slurpfile a "$PRIOR_FILE" --slurpfile b "$NEW_FILE" \
        '($a[0].issues.open_numbers - $b[0].issues.open_numbers) | if length == 0 then "" else join(", #") end' 2>/dev/null || echo "")
      OPENED_ISSUES=$(jq -nr --slurpfile a "$PRIOR_FILE" --slurpfile b "$NEW_FILE" \
        '($b[0].issues.open_numbers - $a[0].issues.open_numbers) | if length == 0 then "" else join(", #") end' 2>/dev/null || echo "")
      CLOSED_PRS=$(jq -nr --slurpfile a "$PRIOR_FILE" --slurpfile b "$NEW_FILE" \
        '($a[0].prs.open_numbers - $b[0].prs.open_numbers) | if length == 0 then "" else join(", #") end' 2>/dev/null || echo "")
      OPENED_PRS=$(jq -nr --slurpfile a "$PRIOR_FILE" --slurpfile b "$NEW_FILE" \
        '($b[0].prs.open_numbers - $a[0].prs.open_numbers) | if length == 0 then "" else join(", #") end' 2>/dev/null || echo "")

      COMMITS=""
      if [ -n "$PRIOR_SHA" ] && [ -n "$HEAD_SHA" ] && [ "$PRIOR_SHA" != "$HEAD_SHA" ]; then
        COMMITS=$(git log "$PRIOR_SHA..$HEAD_SHA" --format='    %h %s' 2>/dev/null | head -20 || true)
      fi

      cat <<EOF

Diff vs. $DIFF_PRIOR
  HEAD: ${PRIOR_SHA:0:7} → ${HEAD_SHA:0:7}
EOF
      if [ -n "$COMMITS" ]; then
        echo "  Commits since (newest first):"
        printf '%s\n' "$COMMITS"
      fi
      [ "$PRIOR_BRANCH" != "$BRANCH" ] && echo "  Branch: $PRIOR_BRANCH → $BRANCH"
      echo "  Open issues: $PRIOR_OPEN_ISSUES → $OPEN_ISSUES_COUNT$([ -n "$CLOSED_ISSUES" ] && echo " (closed: #$CLOSED_ISSUES)")$([ -n "$OPENED_ISSUES" ] && echo " (opened: #$OPENED_ISSUES)")"
      echo "  Open PRs:    $PRIOR_OPEN_PRS → $OPEN_PRS_COUNT$([ -n "$CLOSED_PRS" ] && echo " (closed/merged: #$CLOSED_PRS)")$([ -n "$OPENED_PRS" ] && echo " (opened: #$OPENED_PRS)")"
      echo "  Latest release: $PRIOR_TAG → ${LATEST_TAG:-"(none)"}"
      echo "  Drafts: $PRIOR_DRAFTS → $(echo "$DRAFTS" | jq -r 'if length == 0 then "none" else (join(", ")) end' 2>/dev/null)"
      echo "  Uncommitted files: $PRIOR_UNCOMMITTED → $UNCOMMITTED"
    else
      echo
      echo "  (no prior snapshot at $PRIOR_FILE — skipping diff)"
    fi
  fi
fi

exit 0

# Branch Cleanup Commands

Phase 9 implementation — run all three sweeps to remove stale branches.

## 1. Local branches gone on remote

```bash
git fetch origin --prune
git branch -vv | awk '/: gone]/{print $1}' | xargs -r git branch -D
```

## 2. Local branches fully merged to main

```bash
for b in $(git for-each-ref --format='%(refname:short)' refs/heads); do
  case "$b" in main|master|release|develop) continue;; esac
  git merge-base --is-ancestor "$b" origin/main && git branch -D "$b"
done
```

## 3. Remote feature branches merged via squash

Matches closed PRs (last 30 days) based on branch name.

```bash
gh pr list --state merged --base release \
  --search "merged:>=$(date -u -v-30d +%Y-%m-%d)" \
  --json headRefName --jq '.[].headRefName' \
  | while read -r b; do git push origin --delete "$b" 2>/dev/null || true; done
```

## Protection list

Never delete: `main`, `master`, `release`, `develop`, or any branch matching
`release/*`, `hotfix/*`.

## Output

Log counts: `Local: <n> pruned | Remote: <m> deleted`

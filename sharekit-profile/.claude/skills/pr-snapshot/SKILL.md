---
name: pr-snapshot
description: Show status table for multiple PRs in one batch API call with color indicators
user-invocable: true
argument-hint: "<PR_NUMBERS> [--repo owner/name]"
metadata:
  owner: lucas-dev
  tier: production
---

Display a compact status table for multiple PRs in a single `gh api` call with visual indicators for check and review state.

## Prerequisites

- GitHub CLI (`gh`) is installed and authenticated
- PR numbers are provided as space-separated arguments
- Optional: `--repo owner/name` to specify a non-default repo

## Workflow

1. **Parse arguments**: Extract PR numbers and optional `--repo` flag
2. **Batch query**: Use `gh api graphql` to fetch all PR metadata in one call:
   - Title, state (OPEN/MERGED/CLOSED)
   - Check rollup status (pass/fail/pending)
   - Review state (APPROVED/CHANGES_REQUESTED/PENDING)
   - Author, updated timestamp
3. **Format table**: Return as ASCII table with columns:
   - `#PR` | `Title` | `State` | `Checks` | `Review`
4. **Colorize indicators**:
   - [OK] = Clean (all checks pass, approved)
   - [WARN] = Blocked (failed checks, changes requested, pending reviews)
   - [FAIL] = Failing (blocked or unmergeable)
5. **Return**: Compact formatted output ready for copy/paste

## Columns explained

| Column | Values | Color |
|--------|--------|-------|
| `#PR` | PR number | (plain) |
| `Title` | PR title (truncated if >50 chars) | (plain) |
| `State` | OPEN, MERGED, CLOSED | [OK] OPEN, [OK] MERGED, [FAIL] CLOSED |
| `Checks` | [OK] pass, [WARN] pending, [FAIL] fail | per status |
| `Review` | [OK] approved, [WARN] pending, [FAIL] changes | per status |

## Usage examples

```bash
# Check multiple PRs in default repo
/pr-snapshot 645 646 647

# Check PRs in a specific repo
/pr-snapshot 645 646 647 --repo <GITHUB_USER>/<REPO>

# Single PR
/pr-snapshot 645
```

## Output / Evidence

Example:

```
#PR  Title                             State  Checks  Review
---  -----------------------------------------------  ------  -------
645  Add auth refresh flow             OPEN   [OK] pass  [OK] approved
646  Fix cache invalidation            OPEN   [WARN] pending [WARN] pending
647  Bump dependencies                 OPEN   [FAIL] fail  [OK] approved
```

## Safety rules

- **Batch not sequential**: Always use GraphQL batch query, never `gh pr view` in a loop
- **Read-only**: No mutations; data retrieval only
- **Explicit repo**: If repo is ambiguous, require `--repo` flag

## Implementation hints

- Use GraphQL `query` to fetch all PRs in one call:
  ```graphql
  query {
    repository(owner: "...", name: "...") {
      pullRequests(first: N, numbers: [...]) {
        nodes {
          number
          title
          state
          commits(last: 1) { nodes { commit { statusCheckRollup } } }
          reviews(states: [APPROVED, CHANGES_REQUESTED]) { totalCount }
          ...
        }
      }
    }
  }
  ```
- Parse `statusCheckRollup` state (EXPECTED, PASS, FAIL, PENDING)
- Count reviews by state and determine "blocked" threshold
- Truncate long titles to 50 characters with ellipsis
- Align table columns with padding

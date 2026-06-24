---
name: gh-address-comments
description: "Fetch and address GitHub PR review comments: fix code, resolve threads
  authored by you, dismiss stale bot reviews. Use when: (1) comment-driven fixes on
  the current branch's PR, (2) resolving your own inline review threads, (3) unblocking
  stale CHANGES_REQUESTED from bots (not humans). Halt if PR is authored by someone
  else or has comments from other humans."
metadata:
  short-description: Fetch and fix GitHub PR review comments
  owner: global-agents
  tier: contextual
---

# PR Comment Handler

Fetch review comments on the current branch's GitHub PR, classify them, apply fixes,
and resolve threads you authored. Respects hard rule (CLAUDE.md §"hard rules"): halt
if the PR is authored by another person or has comments from other humans.

## Prereq

Done when: `gh auth status` succeeds and current branch tracks an open PR.

No parallel work — this skill addresses the current branch's PR only.

## 1) Locate and verify the PR

**Fetch current-branch PR:**
```bash
python3 ~/.claude/skills/gh-address-comments/scripts/fetch_comments.py > /tmp/pr_comments.json
jq '.pull_request' /tmp/pr_comments.json
```

Done when: PR metadata displayed (number, URL, title, state).

> RAG-first: N/A. PR review comments are live state — a fresh `gh` fetch is mandatory; there is no benefit to a memory/RAG lookup here.

**HARD STOP:** If PR author ≠ you, halt immediately. Surface: "PR authored by <author> — halting per CLAUDE.md hard rule (§178). Do not proceed."

## 2) Classify and present comments

**Extract + classify:**
```bash
jq '.review_threads[] | select(.comments[0].author.login != "you") 
    | {path, line, author: .comments[0].author.login, resolved: .isResolved, body: .comments[0].body}'  /tmp/pr_comments.json
```

Number every non-resolved thread. For each, classify: severity (major/minor/nitpick), type (a11y/security/perf/style/logic), and a one-line fix.

Done when: numbered list + user picks which to fix (or "address all non-nitpick").

**HARD STOP:** If ANY thread author ≠ you, halt immediately. Surface: "Cannot resolve <#thread> (author: <author>) — halting per CLAUDE.md hard rule (§178). Do not proceed."

## 3) Verify before fixing

For each selected thread, confirm the issue still exists:
```bash
grep -n "<pattern>" <file>
```

Done when: all selected threads inspected; skip already-fixed ones.

## 4) Apply fixes and validate

Edit files per the selected comments. For each file: lint (full directory, not just staged), format, then stage.

Done when: all selected fixes committed + pushed + CI green.

Refer: `references/lint-and-format.md` for per-language commands.

## 5) Dismiss stale bot reviews

If `gh pr checks` shows a stale `CHANGES_REQUESTED` from a bot (CodeRabbit, sonar, etc.):

```bash
gh pr view --json reviewDecision
```

If `CHANGES_REQUESTED`, extract and dismiss the bot's review (by ID). See `references/dismiss-review.md`.

Done when: review dismissed OR CI green without dismissal.

## Signal-first output

Report as you complete:
1. **PR metadata** (number, author, title).
2. **Verdict:** "Ready to address" vs. "Halt: reason".
3. **Fixed counts:** N threads resolved, M already-fixed, K skipped.
4. **Status:** commit hash + `git push` exit code (0 = success).

## Stop/fail conditions

- **PR author ≠ you:** HALT immediately, surface author name.
- **Comments from human reviewers:** HALT, surface commenter names (bots OK).
- **No git credentials:** Surface error, halt.
- **Stale fetch_comments.py:** Surface traceback; use REST fallback (step 1).
- **Lint/format failure:** Surface first error, halt at that file.

See `standards/durable-execution.md` for halt protocol.

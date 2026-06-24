---
name: wake-up
description: Compact session-bootstrap brief — answers "what was I doing, what's blocking, what's next" in ~600-900 tokens. Pulls latest handoff, top 3 RAG hits scoped to the current repo, git status one-liner, and the most recent memory note. Use at the start of a fresh session when you don't yet have context but want to be productive in one screenful, instead of paging through `context-pack` (1.8K tokens with full code excerpts) or running `resume` (interactive). Skip when the task is greenfield with no prior state, or when you already have an active handoff loaded.
triggers:
  - wake up
  - what was I doing
  - bootstrap me
  - quick start
  - get me going
  - session start
mcp_servers: [rag-index]
---

# wake-up

Tight new-session brief. Cap output at **~800 tokens, structured**.

## Output format (always these 4 sections, in order)

```
## blockers
<1-3 bullets — what's preventing progress right now. Empty bullet ok if none.>

## what's next
<1-3 bullets — concrete next action(s). Cite file:line or PR# when applicable.>

## context
<3-5 bullets — recent decisions, prior reasoning, gotchas. Cite source.>

## fresh state
<one-liner: branch · git status counts · latest commit subject>
```

## Pull order (stop at ~800 tokens)

1. **Active handoff** — `~/.claude/handoffs/<project>/latest.md` if it exists, else `~/.claude/handoffs/latest.md`. The "##  IMPLEMENT THIS" section feeds **what's next**; "Blockers" feed **blockers**.
2. **RAG hits (top 3)** — `rag_query(query="<inferred from active handoff title or repo name>", top=3, scope_repos=null)`. Auto-scopes to cwd. Feed **context**.
3. **Most recent memory note** — `ls -t ~/.claude/projects/-Users-<github-user>/memory/*.md | head -1` then read first ~40 lines. Use only if it adds something the handoff didn't.
4. **Git state** — `git status -sb && git log -1 --oneline`. One line into **fresh state**.

## Rules

- Cite paths with `file:line` so the user can jump.
- Skip a section if there's no signal — empty is honest, padding is noise.
- Don't open files to read context — RAG snippets are enough for the wake-up; pull files only when the user picks a thread.
- If no handoff exists, lead with "no active handoff" in **what's next** and pull RAG against the repo README/CHANGELOG topics.

## Pair with

- `resume` for the deeper interactive rehydration.
- `context-pack` when wake-up's 800 tokens isn't enough and you need a multi-source bundle.
- `next-priority` when wake-up shows nothing in flight and you need to pick something.

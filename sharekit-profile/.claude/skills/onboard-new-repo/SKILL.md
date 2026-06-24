---
name: onboard-new-repo
description: Composite skill — first-touch workflow for an unfamiliar repo. Chains adt-repo-intake (understand) → audit-deep (health check) → config-drift-detect (gate audit) → init (CLAUDE.md if missing) → fewer-permission-prompts (prune permission noise). Use when entering a new repo for the first time, taking over from another developer, or after a major repo restructure.
user-invocable: true
auto-invoke: first-touch-on-unknown-repo + post-repo-clone
metadata:
  owner: global-agents
  tier: contextual
---

# Onboard New Repo

The "I just cloned this, what is it" workflow. Replaces 30 minutes of poking around
with one chained pass that builds the full picture and surfaces issues before you
make changes.

## Auto-invocation triggers

- User says "I just cloned X", "let's look at this repo", "what is this codebase"
- Working in a repo with no `CLAUDE.md`, `.claude/` directory, or recent session
  history
- After a `git clone` from a fresh shell

## Workflow

### Phase 1 — Understand (always)
Invoke `adt-repo-intake` for the structural picture:
- Languages + frameworks detected
- Entry points (CLI, server, lib)
- Test runner + framework
- Build / dev / test commands
- Workspace layout (monorepo? single?)

### Phase 2 — Health check (always)
Invoke `audit-deep` for the across-the-board state:
- Test count vs proportionality
- Coverage vs threshold
- Security audit (deps, secrets, OWASP)
- Hook effectiveness if `.claude/` present
- MCP usage
- Plugin usage

This catches "this repo is in rough shape" up front so you don't merge into it
blind.

### Phase 3 — Gate audit (always)
Invoke `config-drift-detect` to surface gates that conflict with sane defaults:
- Coverage thresholds incompatible with proportionality
- TypeScript strictness vs codebase reality
- Husky pre-commit running too much
- Branch protection vs solo-dev workflow

Output: ranked list of gate adjustments with effort estimates.

### Phase 4 — Bootstrap CLAUDE.md (if missing)
If no `CLAUDE.md` at repo root:
- Invoke `init` to generate one from the codebase
- Include: build commands, test commands, key conventions, project structure
- Stage but don't commit (let user review first)

### Phase 5 — Permission prune (if `.claude/settings.json` exists)
Invoke `fewer-permission-prompts` to scan recent transcripts and propose an
allowlist of routine tool calls (Bash patterns, MCP tools) that should auto-allow.
Reduces friction in the first day of work.

### Phase 6 — Save the briefing
- Write a memory note `~/.claude/projects/<slug>/memory/repo_briefing.md` with the
  Phase 1-3 summary so future sessions in this repo bootstrap faster
- Update `MEMORY.md` index

## Reconciliation

Single onboarding brief:
```
ONBOARDING — <repo> @ <branch>

Stack:           <languages, frameworks> <STATUS>
Layout:          <monorepo / single / workspace> <STATUS>
Build:           <command> <STATUS>
Test:            <command, framework> <STATUS>
Entry points:    <list> <STATUS>

Health (audit-deep):
  Tests:         X (target Y-Z) <STATUS>
  Coverage:      X% (threshold Y%) <STATUS>
  Security:      <N findings> <STATUS>
  Hooks:         <state> <STATUS>

Gate conflicts (config-drift):
  CRITICAL: <list> <STATUS>
  HIGH:     <list> <STATUS>

CLAUDE.md:       <created / present / patched> <STATUS>
Permissions:     <X auto-allows proposed> <STATUS>

Recommended first move:
  <specific action with skill suggestion> <STATUS>

Snapshot:        <path to onboarding brief | (none — task ongoing)>
Open watch:      <future obligation | (none)>
```

## Outputs / Evidence

- Onboarding brief (1 page)
- Memory file `repo_briefing.md` for next-session pickup
- Optional new `CLAUDE.md` staged
- Optional permission allowlist staged

## Failure / Stop Conditions

- Repo is not a git repo → minimal brief, recommend `git init` first
- Repo build fails on Phase 1 detection → mark as PARTIAL, surface the build error
  for fix before continuing
- Never make changes (commits, file edits) without explicit user OK — onboarding
  is read-only by default

## Memory Hooks

- Read existing repo memory if present (skip Phase 1 if briefing exists and is
  recent)
- Write the briefing as the primary output

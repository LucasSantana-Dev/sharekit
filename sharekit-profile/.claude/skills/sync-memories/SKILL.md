---
name: sync-memories
description: |
  Sync durable project/session knowledge into memory systems so future sessions have accurate context.
  Use after meaningful work completes (PR merged, feature shipped, release tagged, gotcha discovered).
  Triggers: "remember this", "save where we are", "update memory", "capture this", after `/ship` or session close.
metadata:
  owner: global-agents
  tier: stateful
  canonical_source: ~/.agents/skills/sync-memories
---

# Sync Memories

Update persistent memory systems (Serena, knowledge-brain vault, local `.agents/memory/`) when a session has meaningful output — ensuring future sessions land with accurate state, not stale versions.

## When to Use

- After merging a PR / shipping a feature / releasing a version
- After discovering architecture gotchas, security decisions, or critical patterns  
- When test counts, versions, README examples, or prior assumptions drift stale
- As part of `/ship` or session-end cleanup

**Stop if:** key prerequisites missing (no git repo, no memory system configured, External HD unmounted during brain write).

---

## Pre-flight: Mount Guard + Repo Detect

**External HD mount check** (standards/knowledge-brain.md §1):

```bash
mount | grep -q "/Volumes/External HD" || {
  echo "BLOCKED: External HD unmounted — knowledge-brain vault unreachable."
  echo "Defer memory sync or fall back to local .agents/memory/ only. Surface to user; stop."
  exit 0
}
```

**Repo type** (in order of preference):
- Monorepo workspace (workspaces in `package.json` or `pnpm-workspace.yaml`)
- Standard git repo (has `.git/`)
- Non-git project (document manually, skip git state)

Done when: mount confirmed OR user accepts local-only fallback; repo detected.

---

## Step 1: Query What Memories Exist (Serena / Vault)

**Before writing, read what's already known** about the project — avoid duplicate memories and stale overwrites.

```bash
# If Serena is available (.serena/ or /users/<github-user>/.serena/)
serena.list_memories()
```

If Serena not configured:

```bash
# Check local .agents/memory/
ls -la .agents/memory/ 2>/dev/null || echo "No local memory dir yet."

# Check vault for project memories
ls -la "/Volumes/External HD/Desenvolupamento/knowledge-brain/memory/" | grep -i "$(basename $(pwd))" || echo "No vault entries found."
```

**Done when:** List existing memories (or confirm none); continue to Step 2 only if new facts warrant update.

---

## Step 2: Gather Current Project State

Parallel collection (fork 2+ independent reads):

```bash
# Version + test counts
node -p "require('./package.json').version" 2>/dev/null
npm test 2>&1 | grep -E "Tests:|Test Suites:" | tail -2

# Recent commits + PRs
git log --oneline -8 2>/dev/null
gh pr list --repo $(git config --get remote.origin.url | sed 's/.*\///; s/\.git//') --state closed --limit 3 2>/dev/null

# Quality state (if applicable)
npm audit --audit-level=moderate 2>&1 | tail -2
npm run knip 2>&1 | grep -v "Configuration hints\|Remove from\|Refine" | head -3 || true
```

**Done when:** version, test counts, recent PRs, and key quality metrics in hand.

---

## Step 3: Update Serena Memories (if Available)

Standard memory categories (update only those that changed):

| Memory Key | Update Trigger | Content |
|---|---|---|
| `project_overview` | Version bump, test count shift, new feature, PR merge | Version, test count, suite count, recent PRs, features |
| `architecture` | Major refactor, new subsystem, dependency change | Module structure, critical files, gotchas |
| `development_workflow` | New scripts, CI rules, branching convention | Build/test commands, branch rules, CI gates |
| `testing_strategy` | Test count shift, new suite, coverage change | Test framework, suite structure, coverage gaps |
| `security_standards` | New compliance rule, validator, secret pattern | Rules, file/pattern guards, access control |

Update command:

```bash
serena.update_memory("project_overview", """
- Version: <X.Y.Z from package.json>
- Tests: N passing, M suites
- Recent PRs: <list top 3 merged>
- New features: <if any shipped this session>
- Open/blocked PRs: <list key PRs still in flight>
""")
```

**Done when:** All changed memories updated; no overwrite of unchanged data.

---

## Step 4: Update Local Memory File

Create or append to `.agents/memory/<project-name>.md` (repo-local record):

```markdown
# Project Name

## Latest Session (YYYY-MM-DD)
- Changes: <1-2 sentence summary>
- Files: <key files modified>
- State: <brief working state snapshot>
- Gotchas: <issues discovered, pattern notes>
- Version: X.Y.Z
- Tests: N passing
```

**Done when:** `.agents/memory/<project-name>.md` created/updated with latest session.

---

## Step 5: Push Knowledge-Brain Vault (if Brain Writes Occurred)

The vault (symlinked to `~/.claude/projects/-Volumes-External-HD-Desenvolupamento/memory/`) is the durable cross-project source. Push when session is *not* ending soon or after explicit brain updates:

```bash
BRAIN="/Volumes/External HD/Desenvolupamento/knowledge-brain"

# Mount guard (already checked in pre-flight)
if ! mount | grep -q "/Volumes/External HD"; then
  echo "BLOCKED: External HD unmounted — skip vault push."
  exit 0
fi

# Commit + push memory/graph changes
git -C "$BRAIN" add memory/ graphs/ 2>/dev/null
if ! git -C "$BRAIN" diff --cached --quiet 2>/dev/null; then
  echo "Pushing $(git -C $BRAIN diff --cached --name-only | wc -l) file(s) to knowledge-brain..."
  git -C "$BRAIN" commit -q -m "chore: sync memory from session" && git -C "$BRAIN" push -q
  echo "knowledge-brain pushed"
else
  echo "knowledge-brain: nothing to push"
fi
```

*(SessionEnd `sync push-memories` hook handles automatic push on session close; run explicitly here only if session continues.)*

**Done when:** Brain changes committed + pushed OR nothing to push confirmed.

---

## Anti-Patterns

- Don't duplicate static rules from AGENTS.md/CLAUDE.md into memories (memories = state only).
- Don't write speculative/future content — only current, observed state.
- Don't include full file contents — cite paths + brief descriptions.
- Don't update for trivial changes (formatting, typo fixes).
- Don't leave test counts stale — they drift fast and mislead future sessions.

---

## Signal-First Output

**Verdict:** memories updated [yes/no/partial] | vault pushed [yes/no/blocked].

**Top 3 findings:**
1. Latest version synced + test count confirmed
2. N memories updated (or none needed)
3. Vault push status (pushed/deferred/mount blocked)

If vault push blocked → surface "External HD unmounted — memory captures local-only" and ask user to remount.

---

## See Also

- `standards/knowledge-brain.md` — brain architecture, mount guard, push protocol
- `standards/knowledge-brain.md` §4 — repository-as-SoT gate (decisions must commit + brain capture)
- `/recall` — retrieve existing memories (4 sources: RAG, vault, claude-mem, Serena)
- `/sync-memories` auto-chain after `/ship` (via handoff workflow)

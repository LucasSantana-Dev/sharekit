---
name: session-close
description: |
  Composite skill — memory-durability close. Chains sync-memories (write durable notes) 
  → handoff (write resume packet) → knowledge-loop Phase 5 (push brain to git if changed). 
  Use when: "wrap up", "sign off", "close the session", "save and stop", context >85%, 
  or before switching projects.
user-invocable: true
auto-invoke: session-end + context-budget-warning
metadata:
  owner: global-agents
  tier: orchestration
---

# Session Close

Durably capture session state and push to brain before ending the session. Narrower than 
`session-wrap-up` (which covers shipping, memory, and follow-up improvements); `session-close` 
focuses on **memory persistence** and **resume readiness**: write memories, snapshot active 
work, push changes to the knowledge brain.

## Auto-invocation triggers

- Session approaching context limit (>85%)
- User says "wrap up", "sign off", "close session", "save and stop"
- Switching projects or pausing work mid-feature
- Before handing off to a different machine or session

## Relationship to `session-wrap-up`

`session-wrap-up` (broad, 4 phases):
- Phase 1: Ship uncommitted work (commit + push)
- Phase 2: Remember it (update docs, sync memories)
- Phase 3: Review & apply (identify automation wins)
- Phase 4: Publish (blog posts, issues, templates)

`session-close` (narrow, 3 phases — memory durability only):
- Phase 1: Sync memories (write durable notes, no shipping)
- Phase 2: Handoff (snapshot active work state)
- Phase 3: Push brain (if changes made, commit + sync to vault)

**Use `session-close` when:** session-ending but work is already shipped (PR merged, 
feature released) and you just need to capture knowledge + state. Use `session-wrap-up` 
when ending a working session with uncommitted changes that need shipping + deep review.

---

## Phase 1 — Sync Memories (always)

Call `/sync-memories` to write durable notes about what was built, decided, or 
discovered.

**Invocation:**
```
/sync-memories
```

**Done when:**
- Memories updated (project overview, architecture, testing state, security, or 
  development workflow if changed)
- OR "SKIPPED: no memory changes needed" if session was pure read-only
- File paths confirmed written (`.agents/memory/<project>.md` or vault entries)
- Mount guard passed (external drive accessible)

**Stop condition:**
- external drive unmounted → surface "BLOCKED: external drive unmounted — cannot access brain" 
  and halt Phase 1. Offer fallback: "local-only memory to `.agents/memory/` available 
  instead; defer brain push."

---

## Phase 2 — Handoff (if work in progress)

Call `/handoff` to write a resume packet for the next session.

**Invocation:**
```
/handoff
```

**Precondition:**
- Check: are there unfinished features, mid-refactor branches, or active tasks?
  - If YES: proceed to handoff.
  - If NO (all work merged/shipped): skip Phase 2, move to Phase 3.

**Done when:**
- Resume packet written to `~/.claude/handoffs/<project>/latest.md` OR project 
  directory
- Sections complete: active objective, repo/branch/worktree, what changed, what 
  verified, what remains, blockers, next action, key anchors
- Packet ≤ ~2000 words; no whole-file dumps
- Next action is copy-pasteable

**Skip condition:** All work merged/pushed and session is truly ending (not resuming 
this branch later). Log: "SKIPPED: all work shipped; no handoff needed."

**Stop condition:** (same as Phase 1) external drive unmounted → cannot write handoff to 
`~/.claude/handoffs/`. Halt and surface blocker.

---

## Phase 3 — Push Brain (if memory or graph changed)

Call knowledge-loop Phase 5 (push-to-brain) to commit + sync vault changes.

**Precondition:**
- Did Phase 1 or Phase 2 write to the brain (new memory files, updated ADRs, 
  refreshed graph)?
  - If YES: proceed to push.
  - If NO: skip entirely. Log: "SKIPPED: no brain changes detected."

**Mount guard (required before any vault write — standards/knowledge-brain.md §1):**
```bash
mount | grep -q "${EXTERNAL_HD}" || {
  echo "BLOCKED: external drive unmounted — cannot push brain"
  echo "Defer push to next session or manually run after remounting."
  exit 0
}
```

**Invocation:**
Run knowledge-brain commit + push:
```bash
BRAIN="${DEV_ROOT}/knowledge-brain"
git -C "$BRAIN" add memory/ graphs/ 2>/dev/null
if ! git -C "$BRAIN" diff --cached --quiet 2>/dev/null; then
  git -C "$BRAIN" commit -q -m "chore: sync from session-close" && \
  git -C "$BRAIN" push -q && \
  echo "Brain pushed: $(git -C $BRAIN diff --cached --name-only | wc -l) file(s)"
else
  echo "Brain: nothing to push"
fi
```

**Done when:**
- Brain changes committed + pushed to remote
- OR "nothing to push" confirmed (idempotency check)
- `git -C "$BRAIN" log --oneline -1` reflects the push (verify in output)

**Stop condition:**
- Mount guard blocks → surface "BLOCKED: external drive unmounted" and halt Phase 3. 
  Do NOT retry. Session continues; brain push deferred until HD remounted.

---

## Reconciliation (signal-first summary)

Output one-page close summary:

```
SESSION CLOSE — <date / project>

Phase 1 — Sync Memories:
  [OK] DONE:      <memory files written + mount OK>
  ⏭  SKIPPED:   <reason if no memories needed>
  [BLOCKED] BLOCKED:    <mount/access error if external drive unmounted>

Phase 2 — Handoff:
  [OK] DONE:      <handoff file path>
  ⏭  SKIPPED:   <reason (e.g., all work shipped)>

Phase 3 — Push Brain:
  [OK] DONE:      <N file(s) committed + pushed to vault>
  ⏭  SKIPPED:   <reason (e.g., no brain changes)>
  [BLOCKED] BLOCKED:    <mount error (defer push)>

Open watch:        <outstanding commitments | (none)>
```

**Each phase reports:**
- Status (DONE | SKIPPED: reason | BLOCKED: reason)
- Evidence (file paths, commit SHAs, line counts)
- Auto-invoked skill name (e.g., "skill: sync-memories")

**Signal-first rule:** lead with verdict (all 3 phases status inline), then evidence; 
if bulk output (e.g., full memory files), gate with "ask for details."

---

## Stop/Failure Conditions (halt, surface blocker, do not continue)

1. **external drive unmounted at any point** (Phase 1, 2, or 3)
   - Mount guard catches this before write
   - Surface: "BLOCKED: external drive unmounted — cannot write durable state"
   - Offer fallback: "local-only memory available; defer brain push until remounted"
   - Halt the phase; do not skip to next phase

2. **Phase 1 errors (sync-memories fails)**
   - If Serena not configured, fall back to `.agents/memory/` only
   - If no project detected, skip Serena update; local memory only
   - Continue to Phase 2 even if Phase 1 partial (idempotency)

3. **Phase 2 blocked (handoff write fails)**
   - If branch untracked/broken, still try to write state; surface error
   - If resume packet would be >2000 words, split into multiple files or link to ADRs
   - Halt Phase 2 if blockers remain; do not auto-skip

4. **Phase 3 blocks (brain push fails after successful write)**
   - Likely cause: git push remote auth, network, or concurrent write
   - DO NOT retry silently; surface: "BLOCKED: brain push failed — [error] — try later"
   - Idempotency: local brain state is already updated; next session will retry push

---

## Outputs / Evidence

- Phase 1: `.agents/memory/<project>.md` OR vault memory file paths
- Phase 2: `~/.claude/handoffs/<project>/latest.md` OR `~/.claude/handoffs/latest.md`
- Phase 3: `git log -1` from `$BRAIN` (commit message + push confirmation)
- Summary: one-page close report (signal-first, <200 tokens)

---

## See Also

- `/sync-memories` (Phase 1 sub-skill) — memory capture workflow, Serena integration, 
  mount guard details (standards/knowledge-brain.md §1)
- `/handoff` (Phase 2 sub-skill) — resume packet format, template, rules 
  (references/template.md)
- `/knowledge-loop` Phase 5 — brain push protocol, idempotency, mount guard 
  (see references/push-protocol.sh)
- `standards/knowledge-brain.md` — brain architecture, external drive policy, mount 
  guard enforcement
- `standards/composite-contract.md` — phase bail-out rules, reconciliation patterns
- `CLAUDE.md §1–2` — handoff resume pattern, durable checkpoints

---

## Composite contract

- **Phases are sequential** (1 → 2 → 3); do not reorder
- **Phases skip (not auto-reorder) if precondition fails** (e.g., "no handoff if all 
  work shipped")
- **Mount guard is blocking** — if external drive unmounted, halt the phase; surface 
  blocker; do not continue to next phase
- **Idempotency:** state-check before each write; skip if already done
- **Do NOT silently switch sub-skills or continue past a halt condition**

---
name: knowledge-loop
description: Composite skill — query, capture, improve, persist knowledge in one workflow. Chains recall (semantic lookup) → sync-memories (write note) → rag-curate (improve weak retrievals) → handoff (snapshot). Use when asking "what did we decide about X", "remember this", "save where we are", or closing a session.
user-invocable: true
auto-invoke: end-of-task + recall-questions + checkpoint-requests
metadata:
  owner: global-agents
  tier: contextual
mcp_servers: [claude-mem, rag-index, serena]
---

# Knowledge Loop

Unifies three knowledge sources (RAG index, claude-mem, Serena LSP) into one continuous workflow. Capture and retrieval are paired phases — not separate manual acts.

## Auto-invocation triggers

- **Recall question:** "What did we decide about X?", "Is there a memory note for Z?", "Where did we leave Y?"
- **Closing checkpoint:** End of task (commit, PR merge, decision reached), session-ending, or context budget nearing 80%.
- **Explicit request:** "Remember this", "Save", "Checkpoint", "Handoff"

## Workflow

### Phase 1 — Query (always)
Call `recall` with the user's question or active task. Use the routing guide in `references/recall-routing.md` to pick the right source:
- **Cross-project decision?** → `search_knowledge`
- **Repo-scoped past reasoning?** → `rag_query(scope_types=["memory","handoffs"])`
- **Symbol or call graph?** → Serena `find_symbol`

Return the answer immediately if user is asking a pure recall question. Skip Phases 2–4 unless they also ask to capture.

Done when: Answer returned or "no hits" clearly stated.

### Phase 2 — Capture (if new knowledge produced)
Call `sync-memories` with what was learned, decided, or built this session. Skip if session was pure read/recall with no durable output.

Done when: Memory file written and indexed (RAG reindex fires automatically).

### Phase 3 — Improve (conditional)
If Phase 1 returned weak hits (cosine <0.40) for a query that *should* have matched, call `rag-curate` to add missing doc or rewrite weak chunk. Skip if recall was strong (cosine ≥0.40) or if nothing was retrieved.

Done when: Weak chunk rewritten OR no curation needed (strong hits).

### Phase 4 — Snapshot (if session-ending or context >80%)
Call `handoff` to write a durable resume packet. Skip if work continues immediately.

Done when: Handoff file written to `~/.claude/handoffs/latest.md` or project-scoped path.

### Phase 5 — Push to centralized brain (if graph or memory changed)
Memory and graph live on external drive (ADR-0029). SessionEnd hook auto-pushes; explicit push is needed here if:
- **Graph refreshed** (graphify full build or `--update` run this session).
- **Memory captured AND session is NOT ending soon** (hook won't fire for hours).

**Mount guard required** (§1 in `references/mount-guard.sh`): vault + RAG embedder cache are on external drive. If unmounted, blind push corrupts state. Fail loud, never silent.

Run: `bash references/push-protocol.sh`. If mount guard blocks → surface blocker as Phase 5 status, halt phase, continue session.

Skip entirely if no memory/graph changed (pure recall session).

Done when: memory/graph pushed AND reflected in `git -C "$BRAIN" log --oneline -1` (or phase skipped/blocked, with reason surfaced).

## Reconciliation

Output signal-first summary (top-level verdict inline):

```
KNOWLEDGE LOOP — <topic>
  Recalled:  <n> hits, top cosine <X> (skill: recall) [DONE | WEAK | EMPTY]
  Captured:  <memory file paths> (skill: sync-memories) [DONE | SKIPPED: reason]
  Improved:  <chunks rewritten / docs added> (skill: rag-curate) [DONE | SKIPPED: reason]
  Snapshot:  <handoff path> (skill: handoff) [DONE | SKIPPED: reason]
  Brain push: <commit pushed | nothing to push | BLOCKED: mount reason> [DONE | BLOCKED]
  Open watch: <future obligation | (none)>
```

Each skipped phase includes **why** (e.g., "SKIPPED: pure recall session" not just "SKIPPED"). If mount guard blocks → Phase 5 status is "BLOCKED: external drive unmounted", do not retry.

## Signal-first rule

If recall hit ≥3 sources or >5 chunks, present top-3 inline + "X more available — ask for full list." For captured decisions, note if they need to be committed (Repository SoT gate).

## Stop conditions (halt the phase, don't continue)

- **Recall empty + no new knowledge this session** → exit clean after Phase 1, no capture.
- **Mount guard blocks in Phase 5** → surface blocker, halt Phase 5, continue session (later push is safe).
- **Phase 2 + Phase 3 touch same file** → reconcile into one commit (idempotency safeguard, see `references/phase5-routing.md`).
- **Context >80% and no handoff yet** → Phase 4 is required; do not skip.

## Repository SoT gate

After capturing any decision (Phase 2), check: **"Would a future agent need this committed to make a correct decision?"** If yes and it's only in memory/Slack/ephemeral → surface as open action: *"Decision X must be committed before next session can rely on it."* Do not exit with uncommitted agent-actionable context.

## Worked example

End of a multi-round token-optimization session that shipped 15 hooks + /caveman skill.

```
KNOWLEDGE LOOP — token optimization rounds 1-4
  Recalled:  3 hits, top cos 0.50 (skill: recall) [DONE]
  Captured:  token_opt_round4_2026-05-13.md + token_baseline_2026-05-13.md
             (skill: sync-memories) [DONE]
  Improved:  (skill: rag-curate) [SKIPPED: hits strong, cos 0.50 ≥ 0.40 threshold]
  Snapshot:  handoffs/latest.md (skill: handoff) [DONE]
  Brain push: commit pushed (knowledge-brain) [DONE]
  Open watch: ADR-0033 needs draft before next merge
```

Key points:
- Each phase names the skill, even when indirect (hook auto-write).
- Skipped phase includes the criterion (cos ≥0.40 = strong).
- Two independent writes (sync-memories + handoff) land safely.
- Open watch surfaces commitment gate: ADR must ship before next session assumes the decision.

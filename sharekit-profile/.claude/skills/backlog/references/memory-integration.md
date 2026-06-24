# Backlog Skill Memory & RAG Integration

## Phase 0 RAG pre-flight (runs BEFORE Phase 1)

The RAG pre-flight is the first thing `/backlog` does. It checks for prior work before spending tokens on discovery.

### Mount guard (always run first)

```bash
mount | grep -q "${EXTERNAL_HD}" || {
  echo "WARN: external drive unmounted — RAG/vault unreachable; falling back to local discovery only"
  export RAG_AVAILABLE=false
}
```

### Deferred item persistence

When a user approves only some findings in Phase 3, the rejected findings are stored in the memory snapshot as `deferred_items`. The next run's Phase 0 loads these and injects a `+0.2 urgency boost` in Phase 2 ROI scoring.

**Save deferred items in Phase 8b:**
```json
{
  "deferred_items": [
    {
      "dedup_key": "audit-deep:missing-auth:api/users.ts:142",
      "title": "Add auth check to /api/users endpoint",
      "original_roi": 2.0,
      "deferred_at": "2026-06-23",
      "run": "backlog_sharekit_2026-06-23"
    }
  ]
}
```

**Load deferred items in Phase 0d:**
```bash
python3 ~/.claude/rag-index/query.py "backlog $(basename $(pwd)) deferred_items" \
  --top 1 --scope memory --format json 2>/dev/null \
  | jq '.results[0].deferred_items // []'
```

---

## Pre-run memory check (Phase 2.5 pattern)

Before running `/backlog`, check existing backlog snapshots for the active repo:

```bash
# Query memory for recent backlog runs (preferred over re-running /audit-deep)
rag_query(query="backlog <repo> findings ROI ranked", top=3, scope_types=["memory"])
```

Or via shell:

```bash
python3 ~/.claude/rag-index/query.py "backlog <repo-name> recent findings" --top 3 --scope memory --format json
```

**Guidance:** If a backlog snapshot exists for this repo and is <14 days old, prefer that over re-running `/backlog`. The snapshot contains the most recent ROI-ranked picture of the repo's backlog at run time. Use it when:
- User asks for status or priorities in the repo
- User asks "what should I work on in <repo>"
- User asks for "what's left to do"

If the snapshot is >14 days old, re-run `/backlog` to refresh.

## Memory write outputs (Phase 8b)

Every `/backlog` run saves a project-scoped memory snapshot:

**Path:** `~/.claude/projects/*/memory/backlog_<repo-slug>_<YYYY-MM-DD>.md`

**Metadata:**
```yaml
type: project
description: /backlog run output for <repo> on <date>. <N> issues created, top finding: <title>.
```

**Contents:**
- Top 5 findings by ROI
- List of created issue URLs
- Board URL
- Plan file path
- "Why" clause (for use by `/next-priority` and `/recall`)
- "How to apply" clause (stale after 14 days)

**Auto-indexed by RAG:** These memories are automatically indexed and queryable via `rag_query(..., scope_types=["memory"])`.

## Pointer in MEMORY.md

On first `/backlog` run per repo, append a one-line pointer to `~/.claude/projects/*/memory/MEMORY.md`:

```markdown
- [Backlog: <repo>](memory/backlog_<repo-slug>_<date>.md) — created <date>
```

On subsequent runs for the same repo, **update the existing pointer** (don't add new lines).

This allows `/recall` and composite skills to quickly find the repo's most recent backlog.

## Related standards

See `~/.claude/standards/memory-system.md` for:
- Phase 2.5 memory-check pattern details
- When to prefer memory over re-running skills
- How memory decays (staleness thresholds by skill)
- RAG query syntax and scopes

## Mount guard

Before any RAG query or memory write:

```bash
mount | grep -q "${EXTERNAL_HD}" || { echo "BLOCKED: external drive unmounted — RAG/vault unreachable"; exit 1; }
```

If unmounted, backlog cannot save snapshots or query memory. Fall back to grep + local discovery only.

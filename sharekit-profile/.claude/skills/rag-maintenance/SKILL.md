---
name: rag-maintenance
description: |
  Composite RAG maintenance skill — runs a full retrieval index audit end-to-end: measure quality, find corpus gaps, detect stale chunks, and curate (add missing docs, rewrite weak chunks). Chains: rag-quality → adt-rag-coverage → adt-rag-drift → rag-curate. Use when: retrieval is stale/weak, recall scores drop, users report missing docs, or weekly maintenance cycle. Replaces "run four separate RAG skills and hope they talk to each other."
user-invocable: true
auto-invoke: weekly-maintenance + low-relevance-recall-hits + corpus-drift-detected
metadata:
  owner: global-agents
  tier: contextual
---

# RAG Maintenance

Orchestrated end-to-end maintenance for the RAG index. Runs diagnostics → finds gaps → detects drift → curates corpus. Single composite replaces the "guess which RAG skill to run" pattern.

## When to invoke

- **Weekly routine** — scheduled health check on the index
- **Retrieval quality regresses** — users report low-relevance hits, repeated zero-hit queries, stale content returned
- **Corpus gaps detected** — a query that *should* have results returns nothing (cosine <0.25)
- **Drift suspected** — index may contain deleted/orphaned chunks or outdated content
- **After significant file changes** — bulk file edits, repo rewrites, memory vault reorganization
- **Repeated recall failure** — same question asked >2x in a session with low/irrelevant results

## Pair with standards

- `standards/knowledge-brain.md` § 1 — **Mount guard (required):** external drive hosts embedder cache + memory vault
- `standards/skill-quality-spec.md` § 3, 9 — RAG-first discovery patterns
- `standards/rag-index/BENCHMARK.md` — baseline quality metrics (Hit@5, precision)

## Workflow

**Preflight — Mount guard:**
Mount `${EXTERNAL_HD}` is required for all phases (embedder cache, memory vault, canonical chunks). If unmounted: surface blocker loudly; do not attempt RAG operations.

```bash
mount | grep -q "${EXTERNAL_HD}" || { \
  echo "BLOCKED: external drive unmounted — RAG embedder cache + memory vault unreachable"; \
  exit 1; \
}
```

### Phase 1 — Measure retrieval quality
**Invoke:** `rag-quality` (weekly report: zero-hit queries, low-confidence hits, quality regression)

**Feeds into:** Phase 2 (identifies which queries are failing)

**Done when:** Report shows query-score distribution, zero-hit count, stale-chunk count, quality summary table. Baseline exists at `~/.claude/rag-index/weekly.md`.

**Skip if:** Report is <24h old and verdict is GOOD (>95% queries ≥0.55 cosine). Proceed to Phase 2 for coverage audit (decoupled from quality).

### Phase 2 — Audit corpus coverage
**Invoke:** `adt-rag-coverage` (distribution by source type: skills, standards, code, handoffs, memory vault, etc.)

**Feeds from:** Phase 1 (context: which retrieval failures to prioritize)

**Feeds into:** Phase 3 (coverage map informs drift scanning scope)

**Done when:** Report shows chunk counts per source type vs targets (skills ≥500, standards ≥50, handoffs ≥200, etc.), identifies underindexed topics.

**Stop if:** Total chunks <5k or any critical source type (skills, standards) below 50% of target → escalate to user: "Corpus is severely depleted; recommend full rebuild before curation pass."

### Phase 3 — Detect stale/orphaned chunks
**Invoke:** `adt-rag-drift` (missing files: deleted since index, modified files: sha mismatch vs current)

**Feeds from:** Phase 2 (coverage map scope)

**Feeds into:** Phase 4 (drift report identifies what to curate, reindex, or drop)

**Done when:** Report lists missing chunks (orphaned files), modified chunks (stale content), drift distribution. Zero drift is pass; N>0 drift flagged for curation.

**Critical guard:** Do NOT delete chunks on an unmounted drive — an absent file during unmount means *unknown* state, not *deleted*. Mount guard in preflight prevents this, but Phase 3 surfaces any unmount-time drift risks explicitly.

### Phase 4 — Curate corpus
**Invoke:** `rag-curate` (write missing docs, rewrite weak chunks, incremental reindex)

**Feeds from:** Phase 3 (drift report) + Phase 1 (quality gaps) + Phase 2 (coverage targets)

**Feeds into:** final reconciliation

**Done when:** Curation complete:
- Missing docs added to appropriate corpus directory (skills, standards, memory vault)
- Weak chunks rewritten or re-indexed
- Incremental reindex run (or full rebuild if Phase 2 flagged severe depletion)
- Verification run: re-query flagged zero-hit queries, confirm cosine ≥0.25

**Skip if:** Phase 1–3 all report CLEAN (quality good, coverage sufficient, no drift).

## Reconciliation block

```
RAG-MAINTENANCE — <repo/project>

Phase 1 (Quality):       Zero-hits=N, Low-confidence=M, Stale-chunks=K → [OK] DONE
Phase 2 (Coverage):      <total chunks>, skills=X (target 500), standards=Y (target 50) → [OK] DONE | [BLOCKED] DECLINED (skipped: baseline fresh)
Phase 3 (Drift):         Missing=N chunks, Modified=M chunks → [OK] DONE | [BLOCKED] DECLINED (skipped: no drift detected)
Phase 4 (Curate):        Docs added=N, Chunks rewritten=M, Reindex complete → [OK] DONE | [BLOCKED] DECLINED (skipped: all phases CLEAN)

Snapshot:                ~/.claude/rag-index/weekly.md
Open watch:              Weekly: refresh report every 7 days; if zero-hits persist >1 week, escalate to full rebuild audit
```

## Stop / Failure Conditions

**Mount guard failure (Preflight):** `${EXTERNAL_HD}` unmounted → halt all phases, surface blocker, exit with error. Do not attempt RAG operations without the drive mounted.

**Phase 1 quality regressed:** Quality <80% (e.g., >20% queries <0.40 cosine) → surface regression in reconciliation, continue to Phase 2 for root cause (may be drift, may be coverage gap).

**Phase 2 corpus depleted:** Total chunks <5k or critical source (skills/standards) <50% of target → `adt-rag-coverage` flags for escalation; Phase 4 may switch to full rebuild instead of curate.

**Phase 3 drift explosion:** >100 stale chunks or >10% of corpus orphaned → escalate to user: "Drift is severe; recommend full rebuild. Curation (Phase 4) will proceed incrementally but may be inefficient."

**Phase 4 reindex failure:** `build.py` exits with error → surface exit code + stderr; do not claim curation succeeded.

## Negative rules

- Do NOT skip the reconciliation block. Every run outputs status for all 4 phases (DONE, DECLINED, or BLOCKED).
- Do NOT curate without the Phase 1–3 context. Run phases 1–3 first; Phase 4 consumes their reports.
- Do NOT delete chunks from the index without checking the mount guard. Mounted-drive-only operation; missing files during unmount are unknown state, not deleted.
- Do NOT report "curation complete" without re-querying Phase 1's zero-hit queries and confirming cosine ≥0.25 on the rewrite.
- Do NOT skip Phase 2 just because Phase 1 shows good quality. Coverage and quality are independent; excellent retrieval on a thin corpus is fragile.

## Signal-first output (inline summary)

Lead with: **verdict** (index health: HEALTHY | NEEDS_MAINTENANCE | DEGRADED) + **top 3 findings** (if issues exist).

Example:

```
RAG-MAINTENANCE — <your-domain>

VERDICT: HEALTHY — 95% of queries score ≥0.55 cosine; no drift detected; corpus complete.

Top findings (of 0 issues):
  (none — index is healthy)

Snapshot: ~/.claude/rag-index/weekly.md
```

Or if issues found:

```
RAG-MAINTENANCE — <your-domain>

VERDICT: NEEDS_MAINTENANCE — 18% of queries score <0.40; 8 stale chunks detected; memory vault has 3 new files not yet indexed.

Top findings (of 3 total):
  1. [MEDIUM] 12 zero-hit queries on memory-vault topics (added 2 days ago)
     Fix: Phase 4 will add corpus docs + reindex (Phase 4 — Curate)

  2. [LOW] 8 modified chunks (sha mismatch, stale content in index)
     Fix: Incremental reindex in Phase 4

  3. [LOW] Skills source type at 95% of target (539/500 chunks)
     Status: PASS; no action needed

Remediation plan:
  1. Add missing memory docs (Phase 4: write)
  2. Incremental reindex (Phase 4: build.py --incremental)
  3. Verify zero-hit queries (Phase 4: validation)

Snapshot: ~/.claude/rag-index/weekly.md
Open watch: Check quality again in 7 days; escalate to rebuild if zero-hits persist
```

## Auto-chain conditions

- **After Phase 4 (if curation occurred):** Auto-chain `docs-sync` to mirror any new corpus files to `~/.claude/` backups (optional but recommended for durability).
- **If Phase 1–3 all report CLEAN:** Phase 4 skipped; composite output only. No auto-chain needed.

## Configuration

This composite reads no configuration file; it chains the four sub-skills in order. Each sub-skill (rag-quality, adt-rag-coverage, adt-rag-drift, rag-curate) may read its own config if present.

## Evidence & Artifacts

- Phase 1: `~/.claude/rag-index/weekly.md` (quality report)
- Phase 2: Coverage table from Phase 1 report
- Phase 3: Drift summary from Phase 1 report
- Phase 4: Curation log (added docs, reindex timestamps, re-verification cosine scores)
- Reconciliation: Composite signal-first output above

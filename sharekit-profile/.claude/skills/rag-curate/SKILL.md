---
name: rag-curate
description: "Improve RAG corpus quality by adding missing docs, rewriting weak chunks, and filling retrieval gaps. Use after a diagnostic skill (adt-rag-inspect, adt-rag-quality, adt-rag-coverage) flags a coverage gap or when the index returns poor/irrelevant results for a known query."
triggers:
  - rag curate
  - curate corpus
  - improve rag
  - add to rag
  - rag coverage gaps
mcp_servers: [rag-index]
---

# RAG Curate

Add missing docs or rewrite weak chunks after a diagnostic (`adt-rag-inspect`, `adt-rag-quality`, `adt-rag-coverage`) identifies a gap. Surgical alternative to a full rebuild.

## Corpus directories

| Type | Path |
|---|---|
| Skills | `~/.claude/skills/` |
| Standards | `~/.claude/standards/` |
| Plans | `~/.claude/plans/` |
| Codex | `~/.claude/codex/` |
| Handoffs | `~/.claude/handoffs/` |
| Memory Vault | `${DEV_ROOT}/knowledge-brain/memory/` |
| Code | tracked repos in `build.py` |

> **Phase 2 (ADR-0029) — SHIPPED 2026-06-21 (ADR-0030 One Brain):** the knowledge-brain vault is served by the `search_knowledge` MCP tool (rag-index `mcp_server.py`, scoped to `memory/standards/plans/handoffs/adrs` — implemented on the existing rag-index server, not a separate RAGLight MCP). For *retrieval*, use `search_knowledge(query=…)`. For *curation*, edit the vault's `.md` files directly; the existing `~/.claude/rag-index` build covers `memory/` via the symlink, so incremental reindex works unchanged.

> **Before touching the Memory Vault, mount-guard** (`standards/knowledge-brain.md` §1): the vault + the RAG embedder cache are on the external drive. If it's unmounted, `query.py`/`build.py` can't load the embedder and the vault is unreachable — surface that and stop, don't curate blind. Write/edit memory via the symlink path `~/.claude/projects/-<dev-root>/memory/` (not the raw brain path) so the reindex-hook fires; `build.py` canonicalizes to the brain realpath, so each memory has ONE index path — never "dedup" by deleting brain-path chunks (they're canonical).

## Three curation patterns

> All `build.py`/`query.py` calls below assume the **mount guard passed** (`standards/knowledge-brain.md` §1) — the embedder cache is on the external drive. If `mount | grep "${EXTERNAL_HD}"` is empty, STOP: the embedder won't load and curating blind produces garbage. Memory-file edits go via the `~/.claude/.../memory` symlink path so the reindex-hook fires.

### A. Missing doc → write + incremental reindex

```bash
cat > ~/.claude/standards/new-pattern.md <<'EOF'
# New Pattern Name
...
EOF

cd ~/.claude/rag-index
venv/bin/python build.py --incremental ~/.claude/standards/new-pattern.md
sqlite3 index.sqlite "SELECT COUNT(*) FROM chunks WHERE path LIKE '%new-pattern.md%';"
```

Expect >0 chunks.

### B. Weak retrieval (cos <0.40) → rewrite

```bash
cd ~/.claude/rag-index
venv/bin/python query.py "your weak query" --top 3
# note path + chunk id; edit the source file to add keywords / clarify context
venv/bin/python build.py --incremental <path>
venv/bin/python query.py "your weak query" --top 3   # cosine should rise
```

### C. Undercovered repo → widen globs in build.py

```bash
sqlite3 ~/.claude/rag-index/index.sqlite \
  "SELECT repo, COUNT(*) FROM chunks WHERE repo='your-repo' GROUP BY repo;"
grep -n "your-repo" ~/.claude/rag-index/build.py
# add globs (e.g. add 'src/**/*.tsx'), then incremental reindex
```

## Gap-filling cheatsheet

| Gap | Detection | Fix | Time |
|---|---|---|---|
| Missing doc | zero chunks for topic | write + incremental | 10 min |
| Weak retrieval | score <0.40 | rewrite + reindex | 15 min |
| Undercovered repo | <50 chunks, many files | widen globs + reindex | 20 min |
| Dead code chunks | orphaned (rag-drift) | sqlite DELETE + reindex | 5 min |
| Stale (sha mismatch) | rag-drift | reindex modified file | 5 min |

## When NOT to curate

Curation is wrong tool if:

- >100 chunks missing → full rebuild via `adt-rag-index-rebuild`
- >20 stale chunks → full rebuild
- Many chunks <100 chars → rebuild with new chunk-size config

## Validation

After every curation:

```bash
cd ~/.claude/rag-index
venv/bin/python query.py "<original weak query>" --top 5   # cos > 0.40
venv/bin/python report.py                                   # check weekly delta
```

Commit any doc edits or new standards files to the appropriate repo.

## See also

- `adt-rag-coverage` — find gaps
- `adt-rag-quality` — confirm curation worked
- `adt-rag-inspect` — verify chunk shape
- `adt-rag-index-rebuild` — full rebuild fallback

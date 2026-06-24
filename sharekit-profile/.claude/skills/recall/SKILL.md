---
name: recall
description: Semantic lookup across 4 connected knowledge sources (RAG, knowledge-brain vault, claude-mem, Serena). Answers "what did we decide", "did we hit this before", "where is X defined". Use instead of grep for fuzzy, cross-file, reasoning, or symbol-level queries.
triggers:
  - recall
  - have we seen this before
  - did we decide about
  - where was this decided
  - is there a note on
mcp_servers: [rag-index, claude-mem, serena]
---

# recall

## Pre-flight: Mount check

**Before querying RAG or knowledge-brain vault, verify external drive is mounted:**

```bash
mount | grep -q "${EXTERNAL_HD}" || \
  { echo "BLOCKED: external drive unmounted — RAG/vault unreachable. Degrading to claude-mem + grep."; }
```

If unmounted: `rag_query` (embedder cache on external drive) and `search_knowledge` fail. Fall back to Source 2 (claude-mem FTS5) + shell grep. Degrade explicitly; do not return empty results.

---

## Four retrieval sources, each best for different query shapes

## Source 1 — RAG index (`rag_query`)

Hybrid BM25 + cosine + RRF over the full indexed corpus. Best for fuzzy, cross-file, or "why was this written this way" questions.

```
rag_query(query="<natural-language question>", top=5)
```

Key args:
- `scope_types` — narrow to `["memory","handoffs"]` for written-down decisions, `["commit"]` for recent ships, `["claude-mem"]` for observation notes only via RAG.
- `scope_repos` — `["all"]` ignores cwd auto-scope; `["Lucky"]` forces a repo.
- `top` — 3–5 for fast lookup, up to 8 for thorough cross-source coverage.

## Source 2 — claude-mem (`mcp__plugin_claude-mem_mcp-search__search`)

Direct FTS5 search over the full observation graph (not just what's in RAG). Best for "show me the exact note about X" or when you need the full observation body, not a 500-char snippet.

```
mcp__plugin_claude-mem_mcp-search__search(query="<keywords>", limit=5)
mcp__plugin_claude-mem_mcp-search__get_observations(project="Lucky", limit=10)
mcp__plugin_claude-mem_mcp-search__timeline(days=7)
```

Use when:
- You need the full observation text (RAG snippets are capped at 500 chars).
- The query is project-scoped (`project=` filter).
- You want a timeline of what was recorded recently.

## Source 3 — Serena LSP (`mcp__serena__find_symbol`, `mcp__serena__find_implementations`)

Symbol-level navigation with call-graph awareness. Best for "where is this function defined / who calls it".

```
mcp__serena__find_symbol(name="functionName")
mcp__serena__find_implementations(name="InterfaceName")
mcp__serena__find_referencing_symbols(name="symbolName")
```

Use when:
- You need the exact definition location (RAG lags; Serena is live).
- You want to trace call chains or find all implementors.
- You're about to refactor and need impact analysis.

## Source 4 — knowledge-brain vault (`search_knowledge`) — preferred for decisions/memory

Centralized cross-project vault (ADR-0029/0030 "One Brain") at `${DEV_ROOT}/knowledge-brain/` — all memories (symlinked) + per-project graph snapshots under `graphs/`. Best for **cross-project decision/memory recall**.

```
search_knowledge(query="<natural-language question>", top=5)
```

`search_knowledge` (rag-index MCP — **live since 2026-06-21**, completes ADR-0029 Phase 2) is a vault-scoped semantic search over the knowledge layer only — `memory, standards, plans, handoffs, adrs`; **no code or git commits**; **cross-project** (no cwd auto-scoping). Prefer it over raw `rag_query` for "what did we decide / is there a note on X / did we hit this before". For cross-project graph lookups, read `graphs/<project>/graph.json` directly.

> If `search_knowledge` isn't listed as an available tool, the running rag-index MCP server predates 2026-06-21 — restart the session to reload it.

> **Mount guard** (`standards/knowledge-brain.md` §1): the vault **and the RAG embedder cache** are on the external drive. If it's unmounted, Source 4 is unreachable AND Source 1 (`rag_query`) can't load the embedder — recall degrades to claude-mem (Source 2) + grep only. Check `mount | grep "${EXTERNAL_HD}"`; if absent, say so plainly rather than returning empty/misleading results.

## Auto-route decision table

Pick the source that matches your question shape. When uncertain, run the top 2 sources in parallel (one message).

| Question type | Best source | Fallback |
|---|---|---|
| "What did we decide about X (any project)" | `search_knowledge` (vault-scoped) | RAG scope=memory |
| "Did we hit this bug before" | `search_knowledge` + claude-mem in parallel | RAG all-types |
| "Why was this written this way" | RAG scope=["memory","commit"] | claude-mem full text |
| "Is there a note on X" | `search_knowledge` first | claude-mem full text |
| "Where is function X defined" | Serena `find_symbol` | RAG scope=code |
| "Who calls this function" | Serena `find_referencing_symbols` | RAG (if Serena cold start) |
| "What did we ship recently" | RAG scope=["commit"] | `git log` |
| "Project-scoped observations on [repo]" | claude-mem `get_observations(project="[repo]")` | RAG scope=["claude-mem"] |

## Parallel fan-out pattern

For broad "what do we know about X" questions, run all three in parallel:

```
# In one message: 3 parallel tool calls
rag_query(query="X", top=5)
mcp__plugin_claude-mem_mcp-search__search(query="X", limit=5)
mcp__serena__find_symbol(name="X")  # if X might be a symbol
```

## Output format (reconciliation block)

When returning results, always include:

1. **Source used** — which tool(s) ran (e.g., "search_knowledge" or "RAG + claude-mem parallel")
2. **Hit count** — number of relevant results returned (e.g., "3 hits from search_knowledge, top hit: 0.92 relevance")
3. **Quality signal** — confidence (exact match, strong semantics, weak/speculative) or absence signal
4. **No-hits case** — if all sources returned empty: state explicitly ("No results in any source"), suggest narrowing query or pivoting to Serena (if symbol-shaped) or manual grep

**Example:** "search_knowledge returned 2 hits (0.88, 0.76 relevance) on 'memory-system-consolidation'; top hit: ADR-0030 Phase 2. claude-mem search returned 0 — likely not observed, or ingestion lag."

## Pair with

- `context-pack` when one query isn't enough and you need a multi-source bundle.
- `dispatch` when the question fans into multiple parallel sub-investigations.
- For live symbol navigation: pair Serena results with `refactor-pipeline` (impact analysis before changes).

# Skill Quality Spec

Contract for improving skills (SKILL.md files). An implementer applies it; a
reviewer verifies compliance criterion-by-criterion. Source: /skill-maintainer +
/research-and-decide session 2026-06-22 (research agent + verified RAG commands).

**Hard constraint — preserve behavior.** Improvements may not change what a skill
*does*, its name's invocation contract, or (for composites) its phase chain /
reconciliation contract. Efficiency and clarity only. If a "fix" would alter
behavior, surface it instead of applying.

## Checklist (verifiable, yes/no per criterion)

1. **Trigger-rich description** — frontmatter `description:` names ≥3 distinct
   trigger branches/synonyms; words recur in the body. Verify: read frontmatter,
   count "when/use when"-separated branches.
2. **Progressive disclosure** — only immediately-actionable steps in SKILL.md;
   reference material in `references/`. Target SKILL.md < ~150 lines (reference-heavy
   skills); inline lists > ~10 items move to `references/`. Verify: line count + scan.
3. **RAG-first discovery** — if the skill answers "what did we decide / where did we
   hit this / how did we do X", Step 1 queries RAG BEFORE wide grep/read. Verify:
   Step 1 invokes one of the patterns below.
4. **No-ops eliminated** — every sentence overrides a model default. Cut "be thorough"
   filler. Verify: 3 random sentences — would skipping each weaken output?
5. **Explicit completion criteria** — each step ends with a checkable done-condition
   ("all N tests passing", not "ready"). Verify: last sentence of each step.
6. **Signal-first output** — findings/reports lead with verdict + top-3 inline; bulk
   gated ("ask for full list") or in a reference file. (CLAUDE.md signal-first rule.)
7. **Stop/failure conditions named** — ≥1 explicit "if X missing → surface blocker,
   halt" (no silent fallback). Mount guard where External HD is touched.
8. **Cross-link, don't duplicate** — cite `standards/<file>.md §N` instead of copying
   rules inline; name auto-chain skills + their condition.
9. **Exact RAG snippets embedded** — search/lookup steps show real command syntax (not
   "search for X"). Use the verified patterns below.
10. **Metadata complete** — `name`, `description` present; `metadata.owner`/`tier`/
    `canonical_source` where the skill is an overlay.
11. **Parallelism signaled** — when dispatching ≥2 independent units, say "in a single
    message"; parallel git ops note worktrees (CLAUDE.md parallel-execution rule).
12. **No stale refs** — no retired tools / broken paths. NOTE: claude-mem ingestion is
    currently broken (218k stuck); don't add new hard dependencies on it — prefer
    `rag_query`/`search_knowledge`.
13. **Reference naming convention** — `references/workflow.md`, `output-patterns.md`,
    `schemas.md`, etc.; no duplication with SKILL.md.

## Verified RAG / knowledge invocation patterns

Canonical reference: `~/.claude/skills/recall/SKILL.md`. Skills should point to it
rather than re-documenting all four sources.

```
# 1. RAG index — semantic, repo-scoped (memory, plans, handoffs, skills, code, commits)
rag_query(query="<question>", top=5)               # MCP (rag-index server)
rag_query(query="<q>", top=5, scope_types=["memory","handoffs"])  # decisions only
# shell equivalent:
python3 ~/.claude/rag-index/query.py "<question>" --top 5 [--scope memory] [--format json] [--fast]

# 2. Knowledge-brain vault — cross-project decisions/memory (preferred for "what did we decide")
search_knowledge(query="<question>", top=5)        # MCP; vault-only, no code/commits

# 3. claude-mem observations — full text / project-scoped (ingestion currently broken; read OK)
mcp__plugin_claude-mem_mcp-search__search(query="<keywords>", limit=5)

# 4. Serena LSP — exact symbol defs + call edges (before refactor / wide grep)
mcp__serena__find_symbol(name="<symbol>")
mcp__serena__find_referencing_symbols(name="<symbol>")

# 5. graphify — codebase relationships when graphify-out/graph.json exists (graphify-discipline.md)
graphify query "<codebase question>" --budget 500
```

**Mount guard (required before brain/RAG reliance — knowledge-brain.md §1):**
```bash
mount | grep -q "/Volumes/External HD" || { echo "BLOCKED: External HD unmounted — RAG/vault unreachable"; }
```
If unmounted: `rag_query` (embedder cache on External HD) and `search_knowledge`
degrade; say so plainly, fall back to claude-mem + grep, do not return empty/misleading.

## Anti-patterns to cut

grep-before-RAG · rules copied from standards (cite instead) · SKILL.md/reference
duplication · vague completion ("ready", "looks good") · silent fallback on blocked
ops · explaining a concept fresh instead of a leading word · obsolete tool names ·
sequential dispatch of independent work.

## How to apply (implementer)

1. Run the 13-point checklist (yes/no).
2. For each "no", apply the fix; for RAG steps paste the exact pattern above.
3. Replace inline duplicated rules with `standards/<file>.md §N` pointers.
4. Move bulk > ~150 lines to `references/`.
5. Confirm behavior/contract unchanged (esp. composite phase chains).
6. Output a before/after line-count + checklist delta.

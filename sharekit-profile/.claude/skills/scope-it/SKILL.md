---
name: scope-it
description: "Map the blast radius of a task before writing any code. Identifies affected files, downstream dependencies, and likely test surface. Use before starting implementation to avoid scope creep or missed impact. Triggers: scope this, what will this touch, how big is this change, before I start."
metadata:
  owner: global-agents
  tier: ephemeral
  canonical_source: ~/.claude/skills/scope-it
---

# Scope It

Map what the task will actually touch before writing a single line.

## Phase 0 — RAG pre-flight

Before tracing, query prior scope knowledge via codebase-memory-mcp (trace_path / get_architecture) or graphify. Skip if analysis completed within 24h.

Done when: prior scope surfaced from memory/graph OR none found (proceed with fresh trace).

## Workflow

1. **Read the task** — extract the specific function, module, or behavior being changed.
   Done when: task intent documented and specific symbols/files named.

2. **Find entry points** — locate the files and symbols directly involved.
   Done when: entry files listed, no blind inference of imports.

3. **Trace dependencies** — find callers of changed functions, importers of changed modules.
   Done when: dependent files enumerated via grep or codebase-memory-mcp; no stale assumptions.

4. **Identify test surface** — which test files cover the affected code?
   Done when: test files explicitly matched to core scope; coverage gaps noted.

5. **Estimate size** — count files likely to change (S: 1-3, M: 4-10, L: 11+).
   Done when: size category assigned with file count; L-sized tasks queued for split discussion.

## Output

```
Scope: <task summary>
────────────────────
Core files:     [files directly changed]
Dependents:     [files that import/call changed code]
Tests affected: [test files covering the scope]
Size:           S | M | L
Edge cases:     [behaviors to watch for during implementation]
Blind spots:    [areas that might be affected but need investigation]
```

Done when: scope template filled with concrete paths/symbols and size category justified.

## Rules

- Run before implementing, not after
- If size is L, stop and ask: can this be split?
- List blind spots explicitly — unknown dependencies are higher risk than known ones


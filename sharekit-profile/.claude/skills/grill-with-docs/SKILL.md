---
name: grill-with-docs
description: |
  Grilling session — stress-test a plan against existing domain model (CONTEXT.md, ADRs), sharpen terminology, update docs inline. Use when (1) refining a vague plan before build, (2) validating a design against documented decisions, (3) discovering contradictions in code vs. stated behavior, or (4) crystallizing domain language across team.
metadata:
  tier: execution
  canonical_source: ~/.claude/skills/grill-with-docs/SKILL.md
---

**When to use vs siblings:** `/grill-with-docs` = interview against CONTEXT.md + ADRs (domain-governed, term alignment); `/grill-me` = open-ended interview (no domain docs); `/grill-with-options` = bounded AskUserQuestion forks (fast trade-off resolution).

<what-to-do>

## Phase 1: Load domain context (RAG-first discovery)

Before grilling begins, load the project's existing language and decisions.

**Done when:** CONTEXT.md (if exists), all active ADRs, and project glossary are known. If no CONTEXT.md exists, note that — it will be created on first term resolution.

**Stop condition — external drive unmount:** if external drive is not mounted, fall back to codebase grep + code inspection (RAG unavailable); do not return empty findings.

Mount check and RAG pre-load (run in parallel):
```bash
mount | grep -q "${EXTERNAL_HD}" || echo "BLOCKED: external drive unmounted — RAG degraded"
```

If external drive is mounted, query the RAG index for domain decisions (shell CLI; or the MCP equivalent `rag_query(query="...", top=10, scope_types=["memory","handoffs"])`):
```bash
python3 ~/.claude/rag-index/query.py "domain model glossary terminology context decisions" --top 10 --scope memory --fast
```

If no CONTEXT.md exists in the repo root yet, note it; create one when first term is resolved (follow `references/CONTEXT-FORMAT.md` template).

## Phase 2: Grill the plan — one question at a time

Interview the user about every aspect of the plan, resolving dependencies one-by-one. For each question, provide your recommended answer.

Ask one question at a time, waiting for feedback before continuing.

If a question can be answered by inspecting the codebase (code contradictions, existing patterns, schema details), inspect it; do not rely on user memory.

**Done when:** (A) all design branches explored, (B) all term conflicts resolved against CONTEXT.md — or, if no CONTEXT.md exists yet, noted for creation in Phase 3, (C) no contradictions between plan and code remain.

**Stop condition — CONTEXT.md contradiction:** if a CONTEXT.md or active ADR exists and the user's stated behavior contradicts a documented decision in it, halt immediately and surface it: "HALT: Your plan states [X], but CONTEXT.md documents [Y]. Which is right?" (If no such doc exists yet, there is nothing to contradict — proceed.)

## Phase 3: Sharpen and update docs

Capture resolved terms and trade-off decisions inline (do not batch updates).

**Done when:** CONTEXT.md reflects all new/sharpened terms; any hard-to-reverse trade-offs are offered as ADRs (following the criteria in the Supporting Info section below).

</what-to-do>

<supporting-info>

## Supporting Info — Domain awareness

During codebase inspection and grilling, also look for existing documentation:

### File structure

Most repos have a single context:
```
/
├── CONTEXT.md
├── docs/
│   └── adr/
│       ├── 0001-event-sourced-orders.md
│       └── 0002-postgres-for-write-model.md
└── src/
```

If `CONTEXT-MAP.md` exists at root, the repo has multiple contexts mapped to subdirectories.

Create files lazily — only when you have something to write.

### Challenge against CONTEXT.md

When the user's term or plan contradicts the existing glossary, halt and surface it: "HALT: CONTEXT.md defines X as [Y], but you mean [Z] — which is right?"

### Sharpen fuzzy language

When the user uses vague terms, propose a precise canonical term and verify against code: "You say 'account' — do you mean Customer or User? Let me check the schema."

### Stress-test with scenarios

When domain relationships emerge, probe edge cases with concrete scenarios to force precision. "If a User has multiple Accounts, can they cancel one without affecting the other? Let's test that assumption against the code."

### Update CONTEXT.md & ADRs inline

When a term resolves, update CONTEXT.md immediately (follow `references/CONTEXT-FORMAT.md` template). CONTEXT.md is a glossary only — no implementation details.

Only offer an ADR when all three are true:
1. **Hard to reverse** — cost of changing later is meaningful
2. **Surprising without context** — future reader will ask "why?"
3. **Result of a real trade-off** — genuine alternatives existed, one was chosen for reasons

If any is missing, skip the ADR. Use `references/ADR-FORMAT.md` template when offering one.

See also: `standards/decision-discipline.md` § ADR criteria.

</supporting-info>

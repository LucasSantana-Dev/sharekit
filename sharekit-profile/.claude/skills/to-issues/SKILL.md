---
name: to-issues
description: Break a plan, spec, PRD, or roadmap into independently-grabbable issues using tracer-bullet vertical slices. Use when converting a plan into tickets, creating implementation issues, splitting specs, or breaking roadmaps into milestones.
---

# To Issues

Break a plan into independently-grabbable issues using vertical slices (tracer bullets).

## Process

### 1. Gather context and deduplicate

Work from whatever is already in the conversation context. If the user passes an issue reference (issue number, URL, or path) as an argument, fetch it from the issue tracker and read its full body and comments.

**Before drafting:** Query existing issues and plans to avoid duplication.

Check External HD mount (RAG/vault depend on it):
```bash
mount | grep -q "/Volumes/External HD" || { echo "BLOCKED: External HD unmounted — RAG unreachable"; exit 1; }
```

Then search for related issues + decisions:
```bash
# Search existing issues / decisions / prior slices for this area
rag_query(query="<epic/plan title>", top=5, scope_types=["handoffs","memory"])
# Or use vault if this is a cross-project decision:
search_knowledge(query="<epic/plan title>", top=5)
```

**Done when:** Mount check passes; RAG/vault returns top issues, prior slices, or conflict list (empty = OK); user confirms no duplication or chooses to fold into existing epic.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code. Use domain glossary vocabulary from ADRs in the area you're touching (cite `standards/code-standards.md` or project ADRs).

**Done when:** Codebase state is clear; existing conventions and decision history identified.

### 3. Draft vertical slices

Break the plan into **tracer bullet** issues. Each issue is a thin vertical slice that cuts through ALL integration layers end-to-end, NOT a horizontal slice of one layer.

Slices are either:
- **AFK** — Can be implemented and merged without human interaction (preferred).
- **HITL** — Requires human interaction (architectural decision, design review, stakeholder sign-off).

See `references/vertical-slice-rules.md` for slice design discipline.

**Done when:** All slices drafted; coverage is complete and non-overlapping.

### 4. Present breakdown and iterate

**Signal-first:** Lead with a 1-sentence verdict: "N slices, M blockers, K HITL gates. Ready or revise?"

Then present the full breakdown as a numbered list. For each slice, show:
- **Title**: short descriptive name
- **Type**: HITL / AFK
- **Blocked by**: which other slices (if any) must complete first
- **User stories covered**: which user stories this addresses (if present)

Ask the user:
- Does granularity feel right? (too coarse / too fine)
- Are dependency relationships correct?
- Should any slices merge or split further?
- Are HITL/AFK assignments correct?

**Done when:** User confirms "looks good, create issues" or explicitly approves the slice list. If user asks for changes, revise and re-present verdict + changes only (not the full breakdown again).

**Stop condition:** If user cannot explain why a slice is needed, or if the plan requires >50% HITL slices, surface blocker: "Architecture clarity needed before issuing tickets."

### 5. Create issues in dependency order

For each approved slice, create a new issue on the tracker. Publish in **dependency order** (blockers first) so you can reference real issue IDs in "Blocked by" fields.

Use the template below. AFK issues get triage label (per your project); HITL issues get a review/decision label (confirm with team).

See `references/issue-template.md` for full template + exceptions.

**Publish in parallel:** When creating ≥3 issues, dispatch creation as independent parallel operations in a single tool batch (refer to CLAUDE.md parallel-execution rule).

**Done when:** All N issues created with correct links, triage labels applied, parent issue reference added (if applicable).

**Stop condition:** If tracker is unreachable or issue creation fails after 2 retries, surface: "Issue tracker unavailable — slices drafted but not created. Save breakdown for manual entry."

Do NOT close or modify any parent issue.

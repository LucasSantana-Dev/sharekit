---
name: to-prd
description: |
  Synthesize conversation context into a structured PRD and publish to issue tracker.
  Use when: capturing product spec from session context without interview;
  distilling feature requirements into tracked issue; converting decisions/prototypes into formal spec.
metadata:
  tier: sonnet
  canonical_source: null
---

**Objective:** Draft and publish a PRD to the project issue tracker based on current session context and codebase state. Do NOT interview — synthesize what you already know.

## Step 1: Gather prior context via RAG
Mount check before search:
```bash
mount | grep -q "${EXTERNAL_HD}" || { echo "BLOCKED: external drive unmounted — RAG unreachable"; exit 1; }
```

**Done when:** Prior PRDs and architectural decisions are queried and reviewed for consistency.

Query the RAG index for prior PRDs and related decisions:
```bash
python3 ~/.claude/rag-index/query.py "product requirements PRD scope" --top 5 --scope memory --format json
```
Also check:
```bash
python3 ~/.claude/rag-index/query.py "architectural decisions related to [feature area]" --top 3 --scope memory
```

**If RAG returns no prior context:** note it and proceed. **If prior PRD exists and contradicts current context:** surface the contradiction, halt, and ask user to reconcile before continuing.

## Step 2: Explore repo state and domain glossary
Understand the codebase, existing patterns, and ADRs in the feature area. Refer to `standards/` and ADR files for vocabulary and constraints. Apply the project's domain glossary throughout the PRD.

**Done when:** You can name ≥2 existing modules that relate to the feature area and ≥1 relevant ADR or standard.

## Step 3: Identify modules for build/modification
Sketch out major modules you will need to build or modify. Actively look for opportunities to extract deep modules (encapsulate functionality in simple, testable interface, rarely change).

**Sync with user:** Confirm these modules match expectations. Confirm which modules need tests written.

**Done when:** User confirms module list and testing scope.

## Step 4: Write PRD using template
Use `references/prd-template.md` for structure. Key sections:
- **Problem Statement** — from user's perspective
- **Solution** — user-facing benefit
- **User Stories** — extensive numbered list (≥20 stories, all aspects covered)
- **Implementation Decisions** — modules, interfaces, schema, API contracts, interactions (no file paths; prototypes inline only if encode decision precisely)
- **Testing Decisions** — what makes good test, which modules tested, prior art
- **Out of Scope** — clear boundary
- **Further Notes** — any additional context

**Done when:** All 7 sections complete and user approves the draft.

## Step 5: Publish to issue tracker
Confirm issue tracker is configured (GitHub, Linear, Jira, or other):
```bash
# Example for GitHub (gh CLI required):
gh issue list --limit 1 || { echo "BLOCKED: Issue tracker not configured"; exit 1; }
```

Publish the PRD as a new issue/feature request. Apply the `ready-for-agent` triage label if available; otherwise use appropriate triage label for your tracker.

**Done when:** Issue is created, link is returned, user confirms.

## Signal-first reconciliation
Output verdict first: "PRD published to [tracker] as [issue-link]. Key decisions: [top 3 bullets]. Modules: [list]." Then any caveats or further notes.

## Stop/failure conditions
- **RAG unavailable (external drive unmounted):** halt at Step 1, surface blocker.
- **Prior PRD contradicts current context:** halt at Step 1, surface contradiction, require user reconciliation.
- **Issue tracker not configured:** halt at Step 5, surface configuration requirement.
- **User rejects module list or testing scope:** return to Step 3, iterate.

## See also
- `standards/workflow.md` §product-spec for PRD review gates
- `standards/pr-conventions.md` for issue/PR naming convention
- ADRs in `.claude/adr/` for architectural context

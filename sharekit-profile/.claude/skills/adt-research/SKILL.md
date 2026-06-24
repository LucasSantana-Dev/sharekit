---
name: research
description: |
  Deep exhaustive research on a topic. Synthesizes web search, docs, codebase, 
  and prior decisions to answer "how X works", "what does X do", "investigate X",
  or fact-verify an assumption. Use when you need to go beyond a single source.
triggers:
  - research
  - investigate
  - what does X do
  - how does X work
  - find information about
  - ultraresearch
metadata:
  tier: sonnet
  canonical_source: null
---

# Research

Exhaust all available sources before concluding. Don't stop at the first result.

## Step 1: Pre-check (memory/vault dedup)

**Done when:** Knowledge-brain mount guard passes AND prior research/decision check completes.

First, check if this research topic has already been explored:

```bash
# Mount guard — fail loud if brain unreachable (standards/knowledge-brain.md §1)
if ! mount | grep -q "/Volumes/External HD" || [ ! -d "${DEV_ROOT}/knowledge-brain/.git" ]; then
  echo "BLOCKED: External HD unmounted — knowledge-brain unreachable."
  exit 0
fi

# Check if already decided (search your memory/vault first)
python3 ~/.claude/rag-index/query.py "research on <topic>" --top 5 --scope memory --format json
```

If found, use it. If stale or contradicted by newer sources, continue and surface the conflict.

## Step 2: Source Gathering (in order)

**Done when:** All ≥3 angles have at least one primary source; go/no-go on codebase is made.

1. **Codebase** — search existing code first; answer may already be there
2. **Library docs** — use context7 or equivalent for up-to-date package docs
3. **Web search** — use for current state, comparisons, best practices
4. **GitHub** — search issues/PRs for known bugs and workarounds

Per source, verify against primary docs, not summaries of summaries.

## Step 3: Rules (per-source)

- **Date verification** — note source date; docs for old versions mislead. Flag if >2 yrs old.
- **Contradictions** — when sources conflict, report all sides; don't pick one silently.
- **Primary-source mandate** — read full docs/issues, not just search snippets.
- **Codebase coverage** — if question can be answered by reading code, do it before web search.

## Step 4: Synthesis gate (MANDATORY — run BEFORE output)

**Done when:** All gate conditions pass. If any fails, return to Step 2 or halt with "gate failed" output.

Do not produce findings until ALL of these hold:

- **≥3 distinct angles** explored — different dimensions (how it works, alternatives, failure modes, current state), not 3 phrasings of one query
- **Primary sources read in full** — not just the search snippet/summary
- **Codebase checked** if the question could be answered there
- **Dates verified** on load-bearing sources (no stale-version facts passed as current)
- **Contradictions reconciled or surfaced** — none silently dropped

If uncertain after exhausting sources, say so explicitly.

## Step 5: Output (signal-first)

**Done when:** Verdict + top 3 facts inline; remainder referenced or gated.

```markdown
## Finding: <topic>

### Summary
<2-3 sentences; verdict first>

### Key Facts
- <fact with source + date>
- <fact with source + date>
- <fact with source + date>

### Uncertainties
- <what is unclear or needs verification>

### Recommendation
<what to do based on findings>
```

## Stop Conditions (halt and surface)

- **All sources silent** (no codebase match, no docs, no web results) → output: "No signal found in [sources checked]. Topic may be novel or misnamed."
- **Gate failed after exhausting sources** → output: "Synthesis gate failed at [condition]. Missing: [what's needed]. Cannot produce findings."
- **External HD unmounted** (Step 1) → output: "Knowledge-brain unreachable. Surface to user; cannot dedup prior research."

## See Also

- `standards/knowledge-brain.md` (mount guards, symlink writes, brain conformance)
- `standards/skill-quality-spec.md §45–69` (RAG patterns, verified invocation syntax)

---
name: deep-research
description: |
  Multi-source, fact-checked research report on any topic.
  Use when: fact-checking a claim, evaluating a library/vendor/pattern choice,
  generating a cited synthesis, building a spec from external research, or comparing options
  across multiple sources. Triggers: research, fact-check, evaluate, cite sources, multi-source,
  deep-dive, due diligence, business case.
metadata:
  owner: <your-email>
  tier: sonnet
  canonical_source: ~/.claude/standards/skill-quality-spec.md
---

# Deep Research

Execute multi-source, adversarial research with explicit stop conditions and contradiction
reconciliation. Do not emit synthesis when gates fail — surface the blocker instead.

## Step 1: RAG pre-check (dedup prior work)

Mount-guarded query: before wide web search, check vault & RAG for existing research on
the topic. If a complete prior report exists, cite it; if partial, resume from its gap.

```bash
# Check if External HD is mounted (required for RAG/vault)
mount | grep -q "/Volumes/External HD" || { echo "BLOCKED: External HD unmounted"; exit 1; }
```

Use the verified patterns from `~/.claude/standards/skill-quality-spec.md`:

```
# Option 1: repo-scoped (memory, plans, handoffs, code, commits)
rag_query(query="<topic>", top=5)

# Shell equivalent:
python3 ~/.claude/rag-index/query.py "<topic>" --top 5 --format json

# Option 2: cross-project vault (decisions/memory only; preferred for "what did we decide")
search_knowledge(query="<topic>", top=5)
```

**Done when:** prior research reviewed OR vault/RAG empty. If full match found, cite and
skip to Step 4 (contradiction check); if partial, note the gap in Step 2.

## Step 2: Multi-angle search (≥3 distinct dimensions)

Do not stop at one phrasing. Explore:
- **How it works** (mechanism, architecture, implementation details)
- **Alternatives & tradeoffs** (competing approaches, when each fits)
- **Failure modes & edge cases** (known issues, gotchas, limitations)
- **Current state & adoption** (maturity, version, prevalence, recent changes)

Search sources in order:
1. **Codebase** (if applicable) — grep, Serena symbol lookup
2. **Official docs** (via `Context7` MCP for libraries/APIs)
3. **Web search** — news, benchmarks, comparisons, case studies
4. **GitHub issues/PRs** — workarounds, known bugs, community debate

**Done when:** ≥3 distinct angles searched AND each angle has ≥2 independent sources.
**Stop condition:** fewer than 2 sources per angle → surface: "Insufficient evidence for [angle]."

## Step 3: Primary source verification (read full, not snippets)

For load-bearing claims:
- Read the full doc/article, not just the search snippet.
- Verify the date; reject stale-version facts (>3 years old unless explicitly current-state).
- Check author authority: official docs > peer-reviewed > blog > comment.
- Test claims against code (run a snippet, check a repo for the pattern).

**Done when:** all load-bearing facts cross-referenced to primary source + date-stamped.
**Stop condition:** >1 source is summary-of-summary or undated → surface: "Source chain too indirect for [claim]."

## Step 4: Contradiction reconciliation (required before output)

Scan all sources for conflicting facts. For each conflict:
- **Reconcile if possible:** different versions of same tool, different contexts/use-cases,
  evolution over time (old vs. current state).
- **Classify if unreconcilable:** competing authoritative claims → report both + note the split.
- **Never silent-drop** a contradiction.

Template:
```
**Contradiction:** [Claim X] (Source A, date D1) vs. [Claim Y] (Source B, date D2)
**Reconciliation:** [Different tool versions? Different use-cases? Unresolved split?]
```

**Done when:** all contradictions listed + reconciliation attempted OR marked unresolved.
**Stop condition:** contradictions remain unreconciled AND both sources equally authoritative
→ surface: "Unresolved split — cannot generate confident synthesis."

## Step 5: Synthesis & report

Emit a **signal-first** report:

```markdown
# Research Report: <topic>

## Verdict
<1-2 sentence: what's the answer, what's unclear>

## Top 3 Findings
1. [Key fact with source (URL, author, date)]
2. [Key fact with source]
3. [Key fact with source]

(Ask for full findings if >3.)

## Contradictions & Reconciliation
[Only if contradictions exist; see Step 4 template]

## Uncertainties
- [What remains unclear or unverified]
- [Gaps that would require further work]

## Recommendation
[Actionable guidance based on findings]

## Source Index
- [Title](URL) — Author, date, role (official/peer-reviewed/blog)
- [Title](URL) — Author, date, role
```

**Done when:** report contains ≥3 sources, all contradictions reconciled or marked, uncertainties
listed, and verdict grounded in primary sources.

## Hard Stop Conditions

**Do NOT emit synthesis if any of these hold:**

- **Synthesis gate fails:** (ref. Step 2–4) fewer than 3 angles explored, sources too indirect,
  contradictions unreconciled with equal-authority split, or fewer than 2 sources per angle.
- **External HD unmounted:** RAG/vault unreachable; skip Step 1 but note: "RAG unavailable;
  relying on web search only."
- **Topic has no prior opinion:** if you discover (via Steps 2–3) that there is no consensus
  or published data (e.g., asking about an unreleased product), say: "No published source found —
  cannot generate citation-based report. Recommend: [next step]."

**Blocker output format:**
```
BLOCKED: <condition>
Missing: <what would resolve it>
Next: <how to proceed if at all>
```

## Cross-References

- **Recall pattern (verify vs. memory):** see `/recall` for how to chain RAG check into other skills.
- **Signal-first rule:** `~/.claude/CLAUDE.md` (hard rules section).
- **Parallel research:** when researching ≥2 independent topics, dispatch parallel web-search
  agents (one per topic) in a single message using the `Agent()` tool.
- **Contradiction handling:** `standards/workflow.md` (decision discipline).

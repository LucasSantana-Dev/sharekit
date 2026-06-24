---
name: extract-product
description: Scans a repo or workspace for whole capabilities — features, subsystems, internal tools, pipelines, dashboards — self-contained enough to spin off as their own project or product (OSS repo, CLI tool, SaaS micro-product, template/starter, Claude Code skill/plugin, MCP server), then checks whether the market already serves that niche and what demand evidence exists. Use when the user asks what could become its own project or product, what is worth spinning off / open-sourcing / productizing / turning into a SaaS, tool, or template, or "is any of this a product?". Library-sized finds hand off to extract-package. Propose-only — never scaffolds, extracts, or publishes.
---

# Extract Product

The big sibling of [[extract-package]]: that one finds *code* worth packaging; this finds
**capabilities** worth becoming their own project or product — something with users beyond
this codebase. A good candidate solves a problem strangers have, runs without your
environment, and has an obvious deliverable form.

## Spin-off forms

| Form | When it fits |
|------|--------------|
| OSS project / standalone repo | generic capability, community value, you'd accept issues |
| CLI / desktop tool | dev-workflow capability people would invoke by hand |
| SaaS / micro-product | strangers would pay; you have ops + support appetite |
| Template / starter kit | the value is the setup and wiring, not the runtime |
| Claude skill / plugin / MCP server | the capability is agent-shaped (a workflow, a tool surface) |
| npm library | wrong altitude here → hand off to [[extract-package]] |

## Workflow

1. **Map the portfolio, not the files.** Read `README`/`CLAUDE.md`/ADRs, compose services,
   `package.json` scripts, and `scripts//tools//apps/` surfaces. List *capabilities* —
   things you could name in a sentence ("the WoL endpoint", "the sticker-album importer").

2. **Measure the seams** with the bundled scanner (directory-level coupling math):
   ```
   node scripts/scan-subsystems.js <root> [<root> ...]
   ```
   Per subsystem: files, LOC, fan-out (which subsystems it imports), fan-in, external
   deps, and product signals (own README / Dockerfile / package.json / CLI entry).
   **STANDALONE** = zero fan-out. **near-standalone** = leans on ≤2 siblings.

3. **Filter for product-ness** (judgment — the scanner only measures coupling):
   - **Strangers' problem:** would someone outside this repo want it, unchanged in spirit?
   - **Operable by a stranger:** configurable, not hardwired to your env/db/server names.
   - **One-sentence pitch:** if you can't name what it does and for whom, it's glue.
   - **Deliverable form:** maps cleanly to one row of the table above.

4. **Check the market gap.** Search for existing tools/products serving the niche
   (WebSearch; `~/.claude-env/skills/dependency-scout/scripts/vet-package.sh` for
   npm-shaped neighbors). Healthy, well-fitting incumbent → **skip** (adopt or stay
   internal). Abandoned / heavyweight / awkward / nonexistent → **candidate**.

5. **Demand evidence — the gate that kills most ideas.** What proof exists that anyone
   wants this (inbound asks, stars on similar repos, recurring pain you've observed,
   search volume)? **Unknown demand → the recommendation is a cheap validation step**
   (a post, a landing page, usage instrumentation) — never "build it". This is the
   no-demand-blind-bets rule applied to spin-offs.

6. **Rank by ROI** = (audience size × differentiation × reuse-of-existing-code) ÷
   (extraction effort + ongoing ops/maintenance burden). A SaaS candidate carries ops,
   billing, and support weight that an OSS repo doesn't — price that in.

7. **Emit the report** (below). Propose-only. For a green-lit candidate, suggest
   `/research-and-decide` on the spin-off decision, then a 1-hour `/prototype` of the
   first unit before any repo creation.

## Output

```
## Extract Product — <repo|workspace>
Scanned: <roots> · <N subsystems, M standalone-ready>

### Spin-off candidates (ranked)
| # | Capability | Form | Coupling | Market gap | Demand evidence | Effort | Verdict |
|---|-----------|------|----------|------------|-----------------|--------|---------|
| 1 | wake-on-lan endpoint | CLI/OSS | standalone | thin | none yet → validate | s | validate first |

### Skip — market already serves this
- <capability> → use <incumbent> instead (healthy, fits)

### Not separable (entangled / domain-bound)
- <subsystem> — <fan-out N / hardwired to env>
```

> >3 candidates → show top 3 inline + "N more — ask for the full list".

## Stop / failure conditions

- **Propose-only — never scaffold a repo, move code, create boards, or publish.**
- **Demand unknown → propose validation, not a build.** No demand-blind bets.
- Healthy incumbent → skip unless the differentiation fits in one sentence.
- Always state the maintenance tail: a spun-off product is a commitment, not a deliverable.
- Library-shaped candidate → route to [[extract-package]]. Agent-shaped → note the
  skill/MCP form explicitly.
- Spinning off / open-sourcing / selling is the operator's call (license, ownership, brand).

## Memory

Write memory only when a durable "spin off X as Y" decision lands. Pairs with
[[extract-package]] (code altitude) and `research-and-decide` (the decision gate).

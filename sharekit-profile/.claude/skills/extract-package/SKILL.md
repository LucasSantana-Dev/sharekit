---
name: extract-package
description: Scans a codebase for self-contained, low-coupling modules (often a secondary part of a feature — a util, parser, state machine, algorithm) that are generic enough to reuse across projects, then checks whether npm already serves that niche well; surfaces the strong candidates to extract into a standalone, minimal-dependency npm package. Use when the user asks what code could become an npm package / be open-sourced / extracted / reused across projects, wants to find portable or reusable modules, or asks "is any of this worth packaging". Propose-only — never extracts or publishes.
---

# Extract Package

The mirror of [[dependency-scout]]: that one finds packages to adopt; this finds code
**you wrote** that deserves to be a package. A good candidate is generic (no domain
coupling), self-contained (few/zero internal imports), solves a real problem npm
underserves, and carries minimal external dependencies.

## Workflow

1. **Map the stack & what shipped.** Read `package.json`s, recent features/PRs, and the
   `utils/`/`lib/`/`helpers/`/`services/` surface. Read `CLAUDE.md` + ADRs — anything
   that's a deliberate in-house solution to a general problem is a lead.

2. **Find self-contained modules** with the bundled scanner (it does the coupling math):
   ```
   node scripts/scan-extractable.js <dir> [<dir> ...]
   ```
   It lists each module's LOC, internal-import count (domain coupling), external deps, and
   a portability verdict. **Portable** = 0 internal imports + has exports. **Near-portable**
   = ≤2 internal imports (may pull one sibling util — extractable as a pair).

3. **Filter for genuine reusability** (judgment — the scanner only measures coupling):
   - **Generic, not domain:** would another project want this verbatim? (a retry/backoff,
     a correlation-id minter, a TTL cache, a duration formatter, a diff/merge algorithm —
     yes; "GuildAutomationOrchestrator" — no.)
   - **Stable surface:** a small, clear API that won't churn.
   - **Minimal deps:** ideally zero runtime deps (or only tiny, well-vetted ones). The
     fewer the deps, the more valuable and adoptable the package.

4. **Check the npm gap** — extraction only pays off if npm underserves the niche. For the
   closest existing packages, run dependency-scout's vetter and judge fit:
   ```
   ~/.claude-env/skills/dependency-scout/scripts/vet-package.sh <existing-pkg> ...
   ```
   - Crowded with a healthy, well-fitting incumbent (e.g. `date-fns`, `zod`) → **skip**,
     recommend adopting it instead (hand off to dependency-scout).
   - Existing options are abandoned / heavyweight / awkward-fit / nonexistent → **candidate**.

5. **Rank by ROI** = (reuse value + npm-gap size + low dep weight) ÷ (extraction effort +
   API-stabilization risk). Favor zero-dep, single-responsibility modules.

6. **Emit the report** (below). Propose-only — do not extract, rename, or publish. For a
   green-lit candidate, suggest `/research-and-decide` on the publish/monorepo-package
   decision before any extraction.

## Output

```
## Extract Package — <repo>
Stack: <runtime> · Scanned: <dirs> · <N modules, M portable>

### Extraction candidates (ranked)
| # | Module (file, LOC) | What it does | Coupling | Ext deps | npm gap | Verdict |
|---|--------------------|--------------|----------|----------|---------|---------|
| 1 | utils/correlationId.ts (40) | short url-safe id + sentry tag | 0 internal | 0 | thin/none | extract |

### Skip — npm already serves this well
- <module> → adopt <existing pkg> instead (well-maintained, fits)

### Not portable (high coupling / domain-specific)
- <module> — <N internal imports / domain logic>
```

> >3 candidates → show top 3 inline + "N more — ask for the full list".

## Stop / failure conditions

- **Propose-only — never extract, move, rename, publish, or `npm init`.**
- Don't recommend packaging domain logic, app glue, or anything with >2 internal imports
  unless the cluster extracts cleanly as a unit (say so).
- Don't recommend a new package when a healthy npm incumbent already fits — defer to adoption.
- Prefer **zero-runtime-dependency** candidates; flag any candidate that would drag heavy deps.
- A candidate must have a small, stable, documented-able API surface — flag churn risk.
- License/ownership: note that extraction needs the operator's go-ahead (it's a publish decision).

## Memory

Read [[feedback_prefer_maintained_npm_packages_2026-06-05]] (its converse). Write memory
only if a scan establishes a durable "extract X into a shared package" decision.

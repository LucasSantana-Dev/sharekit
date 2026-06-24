---
name: dependency-scout
description: Audits a JS/TS codebase for hand-rolled boilerplate that a secure, well-maintained, widely-used npm package could replace, and vets each candidate for security advisories, maintenance recency, adoption, and license before proposing it. Use when the user asks to reduce boilerplate, find npm packages to adopt, replace custom utilities with libraries, "stop building from scratch", audit deps for consolidation, or do a dependency/package-opportunity analysis. Propose-only — never installs.
---

# Dependency Scout

Find the boilerplate your codebase reinvents, then propose **vetted** npm packages to
replace it. Every proposal is evidence-backed (security · maintenance · adoption · fit)
and the skill **never installs** — it hands the operator a ranked decision list.

Embodies the standing rule: before hand-rolling common functionality, adopt a secure,
maintained, widely-used package — verified, not assumed.

## Workflow

1. **Map the stack & constraints.** Read every `package.json` (root + workspaces),
   detect runtime/framework, and read `CLAUDE.md` + relevant ADRs for constraints that
   change the answer (e.g. "minimal external infra", "Postgres-as-SoT", banned deps).
   A package that violates an ADR is disqualified no matter how good.

2. **Find boilerplate hotspots.** Scan `utils/`, `helpers/`, `lib/`, `common/` and grep
   for the recurring categories an established lib covers (validation, multipart/CSV/query
   parsing, retry/backoff, rate-limiting, date math, env parsing, HTTP client, caching,
   slugify, deep-merge/clone, debounce/throttle, id generation, etc. — full catalog in
   [REFERENCE.md](REFERENCE.md)). Note the file:line + rough LOC of each hand-rolled block.

3. **Propose 1–3 candidates per hotspot.** Prefer the ecosystem-standard. Check first
   whether a dependency **already in the tree** covers it → recommend *consolidation*, not a
   new dep.

4. **Vet every candidate deterministically** with the bundled script — you supply the names:
   ```
   scripts/vet-package.sh <pkg> [<pkg> ...]
   ```
   It prints latest version, last-publish age, deprecated flag, license, and weekly
   downloads per package. Disqualify: deprecated, no publish in ~18+ months, trivial
   adoption, or a non-permissive/unknown license. For security advisories beyond the
   deprecation signal, run `osv-scanner` / `npm audit` after a trial install (note as a
   follow-up, don't block the proposal on it).

5. **Rank by ROI** = (boilerplate removed + edge-cases/risk offloaded) ÷ (adoption cost +
   new-dependency weight + lock-in). Bias toward small, focused, zero/low-dependency libs.

6. **Emit the report** (below). Propose-only. For any adoption that is also an
   architectural choice, queue `/research-and-decide` rather than deciding here.

## Output

```
## Dependency Scout — <repo>
Stack: <runtime/framework> · Constraints honored: <ADRs/trends>

### Top opportunities (ranked)
| # | Boilerplate (file:line, ~LOC) | Candidate | Latest · last-publish · DL/wk · license | Verdict |
|---|------------------------------|-----------|------------------------------------------|---------|
| 1 | src/utils/retry.ts (~60)     | p-retry   | 6.2.0 · 3mo · 12M · MIT                   | adopt   |

### Consolidation (already in tree)
- <hotspot> → use existing <dep> instead of adding <x>

### Rejected candidates
- <pkg> — <deprecated / unmaintained / low-adoption / license / violates ADR-NNNN>
```

> If >3 strong opportunities, show the top 3 inline + "N more — ask for the full list".

## Stop / failure conditions

- **Propose-only — never run `npm install`** or edit `package.json`/lockfiles.
- Disqualify deprecated, abandoned (~18mo+ no release), low-adoption, or non-permissive-license packages — and say why in *Rejected*.
- A candidate that violates a project ADR/constraint is rejected regardless of metrics.
- Prefer consolidating onto an existing dependency over adding a new one.
- Don't recommend swapping a battle-tested in-house module that encodes domain logic just because a generic lib exists — only target genuine boilerplate.
- Pin recommendations to the latest maintained **major**; never to a deprecated line.

## Memory

Read [[feedback_prefer_maintained_npm_packages_2026-06-05]]. Write memory only if a scan
establishes a durable repo-specific convention (e.g. "this repo standardizes on X for Y").

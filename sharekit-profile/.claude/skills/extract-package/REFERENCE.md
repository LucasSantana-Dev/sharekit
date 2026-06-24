# Extract Package — Reference

## What the scanner measures vs. what you judge

`scan-extractable.js` is purely structural — it counts **internal imports** (coupling to
in-repo code via `.`/`@/`/`@lucky/`/alias) and **external deps** (bare npm specifiers;
Node builtins are free). It cannot tell *generic* from *domain-specific*. A file can be
`PORTABLE(zero-dep)` and still be useless to extract (e.g. a constants table specific to
your app). You supply that judgment.

Verdicts:
- `PORTABLE(zero-dep)` — 0 internal imports, 0 external deps. The ideal: pure stdlib/JS.
- `PORTABLE` — 0 internal imports, some external deps. Extractable; weigh the deps.
- `near-portable` — ≤2 internal imports. Often extractable as a small cluster; check what
  the siblings are.
- `coupled` — >2 internal imports. Usually app glue; skip unless a clean sub-cluster exists.

## Strong extraction archetypes (generic, npm-underserved-ish)

- Algorithms: diffing, merging, scheduling, backoff/jitter, rate math, ranking.
- Small state machines / orchestration seams with a clean port interface.
- Format/parse: a niche URL/ID/duration/format parser the big libs don't cover.
- Framework-agnostic primitives: a typed event bus, a bounded cache, a correlation-id
  minter, an abortable timeout wrapper, a result/option type.
- Protocol/spec helpers: encoders/validators for a public format.

## Weak / non-candidates

- Domain models, services bound to your DB/ORM/Discord/Express objects.
- Thin wrappers over an existing package (just use the package).
- Config/constants tables, app-specific glue, anything reading your env shape.
- One-liners (native already does it) and anything `crypto.randomUUID`/`structuredClone`/
  `Object.groupBy` already covers.

## Extraction-readiness checklist (per green-lit candidate)

- [ ] Generic: a stranger's project would want it unchanged.
- [ ] Self-contained: 0 internal imports (or a tiny, co-extractable cluster).
- [ ] Minimal deps: ideally zero runtime deps; each dep justified.
- [ ] Stable, small API: ≤ a handful of exports; unlikely to churn.
- [ ] Tested: existing unit tests travel with it (or are cheap to add).
- [ ] npm gap real: closest packages are abandoned/heavy/awkward/nonexistent
      (verify with `dependency-scout/scripts/vet-package.sh`).
- [ ] Owner go-ahead: publishing/open-sourcing is the operator's call.

## Pairs with

- `dependency-scout` (inverse): if npm already serves the niche, adopt instead of extract.
- `research-and-decide`: run before committing to a publish / shared-package split.
- In a monorepo, the first step is often "promote to a workspace package", not "publish to
  npm" — same analysis, lower stakes.

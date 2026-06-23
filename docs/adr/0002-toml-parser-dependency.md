# ADR-0002: Adopt smol-toml as the TOML parser (replace unmaintained @iarna/toml)

- **Status:** Accepted
- **Date:** 2026-06-23
- **Deciders:** Lucas Santana
- **Implemented by:** PR #64

## Context

`sharekit` parses `sharekit.toml` — a profile manifest fetched from **arbitrary GitHub
repos** (untrusted input) — in one place (`readManifest()`). The manifest is currently a
trivial `[profile]` table (`name`, `version`, `description`) but is plausibly going to grow
(e.g. backlog #62 proposes a `[dependencies]` table for profile composition).

The incumbent parser, `@iarna/toml@2.2.5`, was flagged as a **supply-chain risk**: it is a
production dependency that has not been published since **2023-07** (effectively
unmaintained). `npm audit` is clean (no CVE) — this is a maintenance/supply-chain *attribute*
risk, the kind Socket surfaces. An unmaintained parser of untrusted input is the worst place
to carry that risk: any parser DoS/bug will never be fixed.

## Decision

Depend on **`smol-toml@^1.7.0`** for TOML parsing. The `^1.7.0` range matters — it keeps us at
or above the versions that patched two known denial-of-service classes (see below).

## Alternatives considered

- **`@ltd/j-toml@1.38.0`** — *rejected.* Also unmaintained (last publish 2023-01) and ~4×
  larger (~812 KB). Swapping one stale parser for another stale, bigger one is not an
  improvement.
- **`toml@4.1.1`** — *rejected.* Supports only the **TOML 0.4** spec, not 1.0; would risk
  failing to parse valid modern manifests and blocks manifest evolution.
- **Hand-rolled minimal parser** — *rejected.* The manifest is trivial *today*, but (a) it is
  expected to grow, and (b) for **untrusted input** a hand-rolled parser forfeits the
  DoS/edge-case hardening that a widely-used parser has accumulated (see the two patched
  advisories below) — hand-rolling moves us from a battle-tested parser to an unaudited one,
  which is *more* risky for this use case, not less.
- **Stay on `@iarna/toml`** — *rejected.* This is the risk being removed.

## Critic challenge and reconciliation

A `decision-critic` review returned **NEEDS_REVISION**, arguing that "recently published" is a
recency heuristic (the same one that failed for `@iarna`), that untrusted-input DoS was
unevaluated, and that no manifest-growth policy was stated. Each concern was verified with
tools and **reconciled in favour of smol-toml**:

- **Scrutiny / bus factor:** smol-toml has **~20.5M weekly downloads**, an active (non-archived,
  non-deprecated) repo, and is depended on by the broader JS toolchain (e.g. Vite's config
  loader). It has a single nominal maintainer (squirrelchat/cyyynthia) — a residual risk —
  but it is ecosystem-critical and heavily scrutinised, the opposite of an abandoned solo
  package. `@iarna` is *also* effectively solo but unmaintained, so this is a real upgrade.
- **Untrusted-input DoS:** smol-toml has a working security process — two DoS advisories were
  responsibly disclosed and **patched**: `GHSA-v3rj-xjv7-4jmq` (thousands of commented lines,
  patched 1.6.1) and `GHSA-pqhp-25j4-6hq9` (deeply-nested inline tables, patched ≥1.3.1). We
  adopt **1.7.0**, which includes both. An unmaintained parser would leave these unpatched.
- **Threat model:** parsing is a **local, user-initiated** CLI read of a single small file;
  a pathological manifest at worst crashes the user's own `install` command — not a
  server-side amplification. Impact of the residual (unknown future) DoS class is low.
- **Manifest growth:** growth is plausible (#62), which justifies keeping a real TOML 1.0
  parser over hand-rolling.

## Consequences

- **Positive:** maintained parser with a demonstrated security-response process; both known
  DoS vectors patched in the adopted version; TOML 1.0 compliant; zero runtime deps; ESM;
  isolated single call site (drop-in; verified by 67 passing tests incl. an invalid-TOML
  error case). `npm audit` clean.
- **Negative / residual:** single nominal maintainer (mitigated by ecosystem reliance + the
  revisit gate below); a recursive-descent parser is in principle DoS-able on novel
  pathological input — known vectors are patched, and a defence-in-depth input size/time
  guard is logged as a low-priority follow-up given the local-CLI threat model.
- **Neutral:** `^1.7.0` range floats within 1.x; a future 2.x would be a deliberate bump.

## Revisit when

Re-open this decision if **any** holds:
- smol-toml maintainer activity stalls (no release or issue/security response for ~6 months),
  or it is deprecated/archived.
- A new **unpatched** parser DoS/CVE is disclosed for smol-toml.
- sharekit begins parsing manifests **at scale or server-side** (then add explicit input
  size/time/nesting guards before the parser, regardless of library).
- The manifest stays permanently trivial *and* eliminating all runtime parser dependencies
  becomes a priority (reconsider the hand-rolled option, with threat modelling).

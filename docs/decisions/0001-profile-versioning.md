# ADR-0001 — Profile version selection

**Status:** ACCEPTED — 2026-06-23
**Decided via:** `/research-and-decide` (2 parallel research agents → `decision-critic` NEEDS_REVISION → orchestrator verified the load-bearing git fact → reconciled)

---

## Context

`sharekit install <user>` clones `github.com/<user>/sharekit-profile` with `git clone --depth 1` and mirrors files into `~/.claude`, `~/.cursor`, `~`. Today it always installs **HEAD** — a consumer cannot install a specific version of someone's profile, and a profile author's breaking change lands on every consumer's next install.

Backlog item #9 asked for "version pinning." Four mechanisms were evaluated.

## Decision

**Ship branch/tag ref selection (candidate D) in v0.2. Defer the lockfile (B) and reject semver ranges (C).**

- `sharekit install <user>@<ref>` → `git clone --depth 1 --branch <ref>`. One parameter resolves **both** a tag (`@v1.0`) and a branch (`@stable`); `install <user>` with no `@ref` stays HEAD (backward-compatible).
- Cache key becomes `<user>@<ref>` (HEAD profiles keep the bare `<user>` path) so different refs don't clobber each other.
- No lockfile, no SHA pinning, no semver resolution.

**Verified load-bearing fact** (the crux): `git clone --depth 1 --branch <ref>` shallow-pins to a **tag** as well as a branch — tested locally: `--branch v1.0` and `--branch stable` both land on the tagged commit at depth 1, same cost as the current default clone. The earlier "shallow clone breaks tags" concern applies only to `git tag -l` *listing/resolution*, not to `--branch <tag>` at clone time. This is what makes D cheap and complete rather than a compromise.

## Alternatives considered

| Option | Verdict | Reason |
|--------|---------|--------|
| **A — Git tags via fetch+checkout** | Folded into D | `--branch <tag>` at clone time achieves tag pinning in one shallow clone; a separate `fetch --tags`/`checkout` flow is unnecessary. |
| **B — Lockfile (`~/.sharekit/lock.json`, SHA pin, npm-style)** | DEFERRED | Strongest reproducibility, but it's the npm *per-dependency-graph* pattern; a shared profile moves as one unit. Real added machinery on a product with ~0 traction. Gate: ≥3 explicit reproducibility requests OR a reported force-push-breaks-consumer incident. |
| **C — sharekit.toml semver ranges (`@^1.0`)** | REJECTED | Two sources of truth (git refs + toml version), shallow-clone-hostile (must check out each tag to read its toml), speculative. `--branch` + git's own tag naming covers the realistic need. |
| **D — Branch/tag ref (`--branch <ref>`)** | **ACCEPTED** | ~10 lines, one git flag, tags+branches, same clone cost, opt-in, backward-compatible. |
| **Full defer (ship nothing)** | REJECTED on critic review | Original recommendation. `decision-critic` correctly flagged a reference-class error: benchmarked against *personal dotfiles* (unpinned) when the right peers are config/plugin *distribution* systems (vim-plug, lazy.nvim, chezmoi `--branch`) that ship ref-selection from day 1. Once a config is shared, it is a dependency of the consumer, not a singleton the author controls. Deferring a one-flag foundational capability behind a first-request trigger is a silent veto, not discipline. |

## Consequences

**Positive:** consumers can pin to a stable ref; authors get a release channel (`stable` branch or `vX` tags) for free; same clone cost; no new dependency; foundation matches how distribution-system peers actually work.

**Negative:** authors must *opt in* by publishing a branch/tag — if they don't, `@ref` 404s with a clear error and consumers stay on HEAD. No cross-install reproducibility guarantee (that's deferred B). `@<branch>` is mutable (force-push moves it); `@<tag>` is the *more stable* option — a tag is conventionally fixed, but git tags can still be force-moved or deleted unless the repo enforces tag protection, so it is not a hard immutability guarantee.

**Neutral:** the HEAD default is unchanged; every install remains reversible via the existing preview-diff + content backup + `rollback` (verified: rollback restores the consumer's pre-install files, so a breaking update is always undoable even without SHA pinning).

## Revisit when

- **B (lockfile) reopens** if: ≥3 explicit requests for reproducibility-across-machines, OR a profile author force-pushes and a consumer reports a broken install, OR sharekit crosses a real adoption bar (>50 installs) with reported HEAD-churn breakage.
- **C (semver) reopens** only if profiles start composing sub-profiles or depending on fast-moving tools such that range-matching across many profiles becomes a stated need.
- **D itself revisits** if `--branch <ref>` proves insufficient (e.g. users want a SHA they can read off a diff) — that is the on-ramp to B, not C.

## decision-critic reconciliation (2026-06-23)

**Verdict: NEEDS_REVISION**, reconciled — not rubber-stamped.

- **Accepted:** the reference-class objection (distribution system, not personal dotfile) and the recommendation to ship D now. The orchestrator independently **verified** the enabling fact (`--branch <tag>` shallow-pins at depth 1, same cost) before acting — the critic asserted cost-equivalence as a hypothesis; the local git test confirmed it.
- **Rejected:** the critic's implied push toward earlier reproducibility work. The deferral of **B** and rejection of **C** survive — the critic itself agreed B should wait for ≥3 requests. The split is principled: D is a git flag (foundation), B/C are machinery (speculative at 0 traction).
- **Verified claims:** (1) `--branch` covers tags+branches at depth 1 — TRUE (local test). (2) `--branch <ref>` clone cost ≈ current clone — TRUE. (3) rollback is content-based and sufficient as the breaking-change mitigation — TRUE (prior live smoke test). (4) zero existing branch-install requests — TRUE (0 users); does not block D because D's cost ≈ 0.

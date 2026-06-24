# ADR-0003: Keep code-review as a bundled-script Agent Skill (not MCP / CLI / Action)

- **Status:** Accepted
- **Date:** 2026-06-05
- **Deciders:** Lucas Santana (solo operator)
- **Supersedes:** (none)
- **Superseded by:** (none)

## Context

The skill ships `scripts/post_review.py` (~300 LOC, Python-stdlib-only) and the agent shells
out to it via the `gh` CLI. This prompted the question: "if we're calling a Python script, are
we even a skill? — position this better and find the most efficient way for this tool to work."

Two facts frame the decision:
- **The premise is a myth.** Anthropic's Agent Skills model treats bundled executable scripts
  as canonical: the official `anthropics/skills` references (XLSX `recalc.py`, DOCX
  `unpack.py`, PDF/PPTX helpers) all ship Python for exactly this kind of deterministic,
  error-prone work. A skill is `SKILL.md` + bundled resources; a script is a resource, not an
  anti-pattern. The script code never enters context — the agent runs it and reads only output.
- **The tool has two layers** that should not be conflated: the *judgment* layer (SKILL.md +
  REFERENCE.md, pure prompt) and the *deterministic plumbing* layer (post_review.py: batched
  inline-thread posting, GraphQL resolve/reply, baseline-SHA incremental re-review, off-diff
  folding). ADR-0001 already established that the LLM must not hand-roll this plumbing.

A critic review (2026-06-05) accepted the architecture but rejected three justifications:
portability across non-Claude agents was *inverted* (bundled script execution is Claude-Code
-class; MCP is the cross-agent standard), graceful degradation was claimed but unimplemented,
and "efficiency" was asserted without measurement. This ADR records the decision with those
corrections folded in.

## Decision

**Keep the bundled-script Agent Skill. Reject MCP server, standalone CLI/PyPI package, GitHub
App/Action, and pure-prompt re-packaging — for now.** Harden positioning and honesty rather
than re-package:

1. **Honest scope, not a portability claim.** The skill is for a **solo operator on Claude
   Code (and skills-spec-compatible agents) doing on-demand review**. The SKILL.md judgment
   layer ports broadly; the `gh`-shelled script is Claude-Code-class and is *not* claimed to
   run unchanged inside Cursor/Codex/Gemini or headless CI. Cross-agent / headless support is
   an explicit **non-goal today** and the documented trigger to extract MCP.
2. **Honest efficiency.** Subprocess + `gh` overhead (~150–300 ms/call; ~0.6–1.5 s for a
   typical multi-call review) is immaterial at solo on-demand cadence (a few PRs/week). We are
   **not** optimizing for batch or always-on; if that changes, the calculus changes.
3. **Real degradation, not aspirational.** `sh()` raises a clear, actionable error when `gh`
   (or `python3`) is missing or unauthenticated — never a raw traceback. We do **not** silently
   fall back to `--dry-run` (silently not-posting when asked to post is worse than a clear stop).
4. **Positioning + scope docs.** SKILL.md/README state *why* the skill shells out (judgment vs.
   mechanics) and declare `allowed-tools` for intent. `gh` + Python-stdlib prereqs are documented.

## Alternatives considered

- **Pure-prompt skill (no script)** — rejected: pushes the error-prone plumbing (off-diff
  folding, baseline reconciliation, GraphQL thread resolve) into the prompt — the exact
  non-determinism ADR-0001 exists to prevent; also token-heavier.
- **MCP server (post/threads/resolve/reply as MCP tools)** — rejected *now*: it is the genuine
  cross-agent standard and the right answer **if** cross-agent/headless use becomes a real
  need, but it is standing infrastructure (a server to run/version/host) with no payoff for a
  solo on-demand Claude Code user today. Violates "no infrastructure without demonstrated
  demand." Kept as the primary revisit path.
- **Standalone CLI / PyPI / npm package** — rejected: adds a publish/versioning pipeline and
  splits the artifact from the skill; distribution friction without current benefit. The script
  is already runnable standalone (`python3 scripts/post_review.py …`) if ever needed.
- **GitHub App / Action (CodeRabbit / PR-Agent model)** — rejected: always-on, server-side;
  ADR-0001 already rejected always-on (cubic auto-runs on every PR). This is a deep,
  on-demand, fix-capable complement, not a second always-on bot.
- **Direct REST/GraphQL via stdlib `urllib` instead of `gh`** — deferred: removes the `gh`
  dependency and would help headless/cross-agent use, but means owning token/auth/enterprise-SSO
  handling that `gh` gives for free. Revisit if the `gh` dependency becomes the blocker.

## Consequences

**Positive:**
- Matches the canonical Anthropic skill shape; zero net-new infrastructure; the script stays
  unit-tested and deterministic; default (non-posting) review path loads no script at all.
- The judgment/plumbing separation is now stated, so "is this even a skill?" should not recur.
- Clear failure when `gh` is absent improves the install experience for distribution.

**Negative:**
- The tool remains effectively Claude-Code-class for its *posting* path; using it from another
  agent or headless CI requires the (deferred) MCP extraction or a `gh` setup in that env.
- Retains the `gh` CLI + auth dependency; `gh` version drift is an ongoing (small) maintenance risk.

**Neutral:**
- No code architecture change — only `sh()` error handling, frontmatter, and docs move.
- `allowed-tools` is declared for intent; it is experimental in Claude Code and not relied on
  for enforcement.

## Revisit when

- The operator needs the tool **from a non-Claude agent (Cursor/Codex/Gemini) or headless CI**
  → extract an MCP server (the primary migration path) and/or move off `gh` to `urllib`.
- A **second contributor** joins → always-on review + stricter merge-gating become worth the
  infrastructure; reconsider the App/Action axis.
- **`gh` breaks** the script (version bump / deprecation) or the operator's `gh` auth becomes
  unavailable in a context that needs posting → reconsider direct `urllib` + token.
- A typical review routinely needs **many sequential post/threads/reply round-trips** such that
  subprocess overhead becomes noticeable → an MCP persistent connection starts to pay off.

## References

- ADR-0001: reviewers and fixers — established the judgment/plumbing split this ADR formalizes
- ADR-0002: confidence calibration — the calibration work that prompted reviewing the whole tool
- Anthropic, "Equipping agents for the real world with Agent Skills" (bundled scripts canonical)
- `anthropics/skills` — XLSX/DOCX/PDF/PPTX reference skills bundling Python helpers
- Phase-1 research (4 angles) + critic review, session 2026-06-05

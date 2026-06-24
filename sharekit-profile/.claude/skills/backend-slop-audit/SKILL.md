---
name: backend-slop-audit
description: A narrow, opinionated post-generation lint for backend/server-side code. Audits a changeset against a named catalogue of backend anti-patterns — swallowed errors, unvalidated input, missing timeouts, read-check-write races, N+1 queries, wrong status codes, unparameterized queries, hardcoded secrets, dead/duplicate handlers, and more — and returns specific, evidence-backed findings with the fix, not vibes. Use this whenever backend code was just written, generated, or pasted (an API route, service, handler, job, query, migration), when reviewing a server-side diff or PR, or when the user says "audit this backend", "does this look AI-generated / sloppy", "lint the server code", "review this endpoint/service/query", "any obvious backend mistakes here", or "is my error handling / validation / query OK". Reach for it proactively after generating any non-trivial backend code, even when the user didn't say the word "audit" — it's the server-side counterpart to ai-slop-audit (which lints frontend output). It is read-only: it finds and proposes; route accepted fixes to /refactor or the relevant specialist skill. Not for full security or performance audits (it defers those), pure frontend code, or subjective style.
---

# backend-slop-audit

A narrow, opinionated lint for **server-side code**. Reads a backend changeset and audits it against the named anti-patterns in [`references/backend-anti-patterns.md`](references/backend-anti-patterns.md). Returns specific findings with evidence and a fix — not a vibe check, and not a full audit.

This is the backend twin of `ai-slop-audit`. Where that catches the *visual* tells that a UI was generated quickly without craft, this catches the *behavioral* tells that a service was generated quickly without thinking about the failure modes — the error that gets swallowed, the input that's trusted, the call with no timeout, the write that races. The kind of thing that passes every happy-path test and then pages you at 3am.

The failure mode of any lint is noise — "could be more robust" is infinite, and every real service has *some* rough edge. So the discipline is the same as the frontend audit: **scope first, verify each claim, defer the deep dives.** A finding you can't point at with a file:line and a concrete fix isn't a finding.

## When to invoke

Auto-invoke (don't wait to be asked):

- Right after generating or editing a non-trivial piece of backend code — a route/controller, service, handler, background job, DB query, or migration.
- In a PR/diff review of server-side changes — default the scope to the diff.
- After pasting backend code from another model or a template into the repo.
- When the user says any of: "audit this backend / endpoint / service / query", "does this look generated / sloppy", "any obvious mistakes", "is my error handling / validation OK", "review the server code".

Do not invoke for:

- A **full security audit** (secrets sweep, dependency CVEs, OWASP) — that's `security-audit` / `security-review`. This lint *spots* a hardcoded secret or an unparameterized query and *hands off*; it doesn't replace the sweep.
- A **full performance audit** (profiling, load testing) — that's `performance-audit`. This lint flags the N+1 shape; it doesn't measure.
- **Over-engineering** specifically — that's `overengineering-audit` (this lint includes one speculative-complexity pattern and defers the rest).
- **Frontend output** — that's `ai-slop-audit`.
- Subjective style / naming bikeshedding.

## Scope — tighten before auditing

This is the whole game. **Never sweep the entire repo unless explicitly asked** — every codebase has rough edges, and an unscoped audit drowns the real findings. State the chosen scope in one line, then audit.

| Option | Effect | Use when |
| --- | --- | --- |
| `<path>` (file or dir) | Audit only that module | "is `src/payments/` solid?" |
| `--changed` / `--diff` | Working diff / `main..HEAD` only | PR review, post-generation (the **default**) |
| `--category a,b` | Only these classes (correctness, api, performance, persistence, config) | "just check the error handling" |
| `--severity major` | Drop everything below the floor | high-signal pass |
| `--budget N` | Cap at top-N findings by severity×reach | quick triage |

Default when no scope is given: **`--changed` if there's a diff, else ask for a path.** Do not silently audit the whole tree.

## The audit procedure

### 1. Classify the surface

What is this code? An HTTP/RPC handler, a service/domain module, a background job/consumer, a data-access layer, a migration, glue/config. The surface decides which patterns bite hardest — input-validation and status-code patterns dominate at the request boundary; transaction and constraint patterns dominate in the data layer; timeout and idempotency patterns dominate in consumers and integrations.

### 2. Lint pass — sweep the catalogue

Load [`references/backend-anti-patterns.md`](references/backend-anti-patterns.md) and check the code against each pattern. The catalogue is **language-agnostic** — it describes shapes, not regexes. Translate each detection heuristic to the stack in front of you before applying it.

Summary (full detail, fixes, and hand-offs are in the catalogue):

| # | Pattern | Class | Severity |
|---|---|---|---|
| 1 | Swallowed error (catch logs/returns default and continues) | correctness | Critical |
| 2 | Catch-all that erases the error type | correctness | Major |
| 3 | Trusting input at a boundary (no validation) | correctness | Critical |
| 4 | Unbounded await / no timeout | correctness | Major |
| 5 | Read-check-write race | correctness | Major |
| 6 | Resource leak (no guaranteed close) | correctness | Critical |
| 7 | Dead / duplicate code path | correctness | Major |
| 8 | Silent fallback that masks failure | correctness | Minor |
| 9 | Wrong status code / lying response | api | Major |
| 10 | Inconsistent error shape | api | Minor |
| 11 | Unbounded result set / missing pagination | api | Major |
| 12 | Leaking internals to the client | api | Critical |
| 13 | Non-idempotent retryable write | api | Minor |
| 14 | N+1 query / call-in-a-loop | performance | Major |
| 15 | Sequential awaits that are independent | performance | Minor |
| 16 | Unbounded / over-fetching query | performance | Major |
| 17 | Cache/pool/memo with no measured hotspot | performance | Minor |
| 18 | Blocking work on the hot path | performance | Major |
| 19 | Unparameterized / string-built query | persistence | Critical |
| 20 | Missing transaction across a multi-write invariant | persistence | Major |
| 21 | Missing constraint behind a uniqueness assumption | persistence | Minor |
| 22 | Hardcoded secret / environment value | config | Critical |
| 23 | console.log / print as the logging strategy | config | Minor |
| 24 | Unchecked cast / `any` at a boundary | config | Minor |

### 3. Verify before you flag

The lint's one job is to be *trusted*, which means no false positives you didn't check. For each candidate finding, confirm the claim against the code before writing it down:

- "Swallowed error" — read the catch body; if it genuinely handles or rethrows, drop it.
- "Dead/duplicate path" — trace what the entrypoint actually wires; "looks unused" is not evidence (grep the callers/registration).
- "N+1" — confirm the query is really inside the loop and not batched by the ORM.
- "No timeout" — check there isn't a client-level or middleware timeout already.

"Feels fragile" is not a finding. A finding has a `file:line`, the specific pattern, and a concrete fix.

### 4. Output

Lead with a one-line verdict, then severity-ranked findings, then a short list of what you checked and it was *fine* (so the reader trusts the sweep was real). Signal-first: if there are more than 3 non-critical findings, show the top 3 and offer the rest.

```
═══════════════════════════════════════════════
backend-slop-audit — <scope>
═══════════════════════════════════════════════
Surface: <handler | service | job | data-access | migration | config>
Verdict: <PASS | WARN | FAIL>
  • PASS: 0 critical, ≤ 2 minor
  • WARN: 0 critical, 1–3 major or > 2 minor
  • FAIL: ≥ 1 critical OR > 3 major

Findings: <N>

──── CRITICAL ────
[#3] Trusting input at a boundary
  src/orders/createOrder.ts:21 — req.body.items spread into the DB insert unchecked
  Diagnosis: no schema/guard between the request and the write; a malformed or
    hostile body reaches persistence. Happy path only.
  Fix: validate the body against a schema at the handler entry; insert the
    validated value. A type annotation is compile-time, not a runtime check.
  Confidence: high (no validator on this path; body fields used directly at :21, :24).
  Defer: input also reaches the query → run /security-review on this path.

──── MAJOR ────
[#14] N+1 query
  src/orders/list.ts:38 — `for (const o of orders) await db.user.find(o.userId)`
  Diagnosis: 1 + N round-trips; fine at 10 orders, falls over at 10k.
  Fix: batch — one `where userId in (...)` query, or a join/dataloader.
  Confidence: high (await on db.user.find inside the for at :38).
  Defer: if list latency is the real concern → /performance-audit.

──── PASS NOTES ────
✓ #4 Timeouts — external calls wrapped in AbortSignal.timeout, good
✓ #19 Parameterized queries — ORM safe API throughout, no string-built SQL
✓ #6 Resource handling — pooled client, no manual open/close
… (abbreviated)
═══════════════════════════════════════════════

Next: 1 critical → fix before merge. 1 major → this iteration.
Hand-offs: /security-review (1), /performance-audit (1).
```

### 5. Apply fixes (only when authorized)

Default: produce the verdict and **stop**. This skill is read-only — it audits and proposes.

When the user says "apply" / "fix", apply the concrete fixes inline (the small, mechanical ones — add the guard, the timeout, the `finally`), and **route the rest**: a finding that says "validate this input properly" or "make this query safe" is real work that belongs to `/refactor` or the named specialist skill, not a one-line patch. After applying, re-audit to confirm no critical remains.

## Calibration — avoid false positives

The lint has known soft spots; downgrade or skip when:

- **Defensive code on external input is correct, not slop.** Validation, a fallback with a logged reason, a try/catch that genuinely recovers — these are the *fix*, not the finding. Only flag when the handling hides the failure (#1/#8).
- **The project decided.** If an ADR/decision record says idempotency is out of scope (#13), or a cache is deliberate (#17), or `SELECT *` is fine for a tiny fixed table (#11/#16) — respect it. Check for a decision before flagging a deliberate trade-off.
- **Framework-mandated structure.** DI containers, repository layers, middleware the stack expects — not over-abstraction.
- **Tests.** Duplication and shortcuts in test code are usually fine; audit the code under test, not the test scaffolding.
- **A `catch` that rethrows or handles specifically** is not a swallowed error. Read the body.
- **A single `console.log`** left in throwaway/scripts is minor-at-most; only flag print-as-logging on real request paths (#23).

## Stop / negative rules

- **Scope first.** Refuse a whole-repo sweep unless explicitly asked; default to `--changed`.
- **Verify each claim** against the code before reporting — grep the caller count, read the catch body, trace the wiring. Never fabricate a "swallowed error" or "dead path" you didn't confirm.
- **Read-only.** Propose; don't edit unless told to. Route accepted findings to `/refactor` or the specialist.
- **Defer, don't duplicate.** This lint *spots* a vulnerability or a hotspot and hands it to `security-review`/`performance-audit`. It is not a substitute for them — say so in the hand-off rather than pretending to have done the deep analysis.
- **One finding per smell, not per line.** Cluster repeats (five swallowed catches in one file = one finding with five locations).

## Related

- `ai-slop-audit` — the frontend twin (visual anti-patterns).
- `silent-failure-hunter` (agent) — the deep dive for #1/#8.
- `security-review` / `security-audit` — for #3 (when input reaches a query), #12, #19, #22.
- `performance-audit` — for #11, #14, #16, #17, #18.
- `overengineering-audit` — for #17 and speculative complexity generally.
- `error-handling-audit` — adjacent, broader error-handling review.
- `/refactor` — apply an accepted fix.

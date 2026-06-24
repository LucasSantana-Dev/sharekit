# Backend anti-pattern catalogue

The backend slop dictionary. Each entry: name → why it's a tell → how to detect → the fix → severity → who to hand off to for a deep dive.

This file is the source of truth that `backend-slop-audit` reads when linting server-side code. It is **language-agnostic** — the heuristics describe shapes to look for, not regexes for one framework. Translate them to the stack in front of you (the call named `fetch` in Node is `requests.get` in Python, `http.Get` in Go; a "catch" is an `except`/`rescue`/`recover`).

The goal is to catch the *tells* that code was generated quickly without thinking about the failure modes — and route anything that needs real analysis to the specialist skill named in each entry. This lint finds the smell fast; it does not replace a security or performance audit.

---

## Severity tiers

- **Critical** (blocks ship): data loss, security exposure, or a failure the operator can't see. #1, #3, #6, #12, #19, #22.
- **Major** (fix this iteration): wrong behavior under load or error, or a trap for the next reader. #2, #4, #5, #7, #9, #11, #14, #16, #18, #20.
- **Minor** (recommend): friction, inconsistency, or cost that isn't yet biting. #8, #10, #13, #15, #17, #21, #23, #24.

A finding's *reach* can raise its severity: a Minor pattern on a hot path or a core module that every reader copies is effectively Major.

---

## Correctness & robustness

### 1. Swallowed error

**Pattern**: a `catch` (or `except`/`rescue`) that logs and continues, returns `null`/`[]`/`undefined`, or is empty — turning a failure into a silent success. The caller can't tell the difference between "no data" and "the call blew up."

**Why it's a tell**: the fast way to make a red squiggle go away is to wrap it and move on. It produces code that *looks* robust and is the opposite — failures vanish, and the operator debugs from nothing (this catalogue exists because exactly this cost a multi-hour prod debug).

**Detect**: catch blocks whose body only logs, returns a falsy/empty default, or is empty; `catch {}`; `.catch(() => null)`; broad catches around large blocks where the recovery doesn't actually recover.

**Fix**: let it throw, or handle it *specifically* (retry, fallback with a logged reason, surface to the caller). If you must return a default, log at warn+ with the cause and make "empty because error" distinguishable from "empty because no data."

**Defer**: deep audit → `silent-failure-hunter`.

### 2. Catch-all that erases the error type

**Pattern**: one `catch (e)` around a large try that handles every failure mode identically — a validation error, a network timeout, and a bug all become the same generic 500/log line.

**Why it's a tell**: thinking about *which* things fail and how each should be handled takes effort; one catch around everything skips it.

**Detect**: try blocks spanning many statements with a single catch; no branching on error type/code; rethrow-vs-handle decisions collapsed.

**Fix**: narrow the try to the call that can fail, or branch on error type. Distinguish *expected* failures (validation, not-found) from *unexpected* (bugs, infra) — they want different status codes and different logging.

### 3. Trusting input at a boundary

**Pattern**: request body / query params / message payload / external API response used directly — indexed, passed to a query, spread into an object — without validation or shape-checking.

**Why it's a tell**: the happy path is what gets written; the adversarial/garbage path is what gets skipped.

**Detect**: `req.body.x`, `params.id`, `payload.foo` flowing into logic, DB calls, or responses with no schema/guard between. Type assertions/`as`/casts standing in for runtime validation.

**Fix**: validate at the trust boundary (schema validator, explicit guards) and work with the validated value downstream. A type annotation is a compile-time promise, not a runtime check.

**Defer**: if the input reaches a query/command → also flag #19 and route to `security-review`.

### 4. Unbounded await / no timeout

**Pattern**: a network or IO call (`await fetch(...)`, DB query, RPC, child process) with no timeout. One slow dependency hangs the request, the worker, or the event loop indefinitely.

**Why it's a tell**: timeouts are the kind of "it'll be fine" detail that gets dropped under speed.

**Detect**: awaited external calls with no `AbortSignal`/timeout/deadline; loops of such calls; `await` on something that can block with no bound.

**Fix**: add a timeout/deadline (`AbortSignal.timeout`, client timeout option, context with deadline) sized to the operation, and decide what happens when it fires.

**Defer**: systemic latency → `performance-audit`.

### 5. Read-check-write race

**Pattern**: read a value, check it in app code, then write based on the check — with no atomicity. Between the read and the write, another request changes the world (double-spend, duplicate insert, lost update).

**Why it's a tell**: it reads naturally top-to-bottom and works in every single-threaded test; the concurrent case is invisible until prod.

**Detect**: `findX(); if (!x) createX()`; get-then-set without a transaction; check-then-act on shared state.

**Fix**: make it atomic — upsert, conditional/compare-and-set write, unique constraint + handle the conflict, or a transaction with the right isolation.

### 6. Resource leak

**Pattern**: a connection, file handle, stream, lock, or cursor opened and not reliably closed — released only on the happy path, not in a `finally`/`defer`/`using`, so an early return or throw leaks it.

**Why it's a tell**: the open is obvious; the guaranteed close is the part that requires thinking about every exit.

**Detect**: acquire calls with no paired release in a finally/defer/dispose; release that sits after a `return`/`await` that can throw.

**Fix**: pair acquisition with guaranteed release (`finally`, `defer`, context manager, `using`/`Disposable`). Prefer pooled clients that the framework manages.

### 7. Dead or duplicate code path

**Pattern**: two implementations/handlers for the same responsibility, one of them unused — or an edit made to the copy that isn't wired up. New behavior added to the dead one silently does nothing.

**Why it's a tell**: when there are two plausible files, the wrong one gets edited; nobody deletes the loser. (This catalogue's home repo lost hours to routing added to a dead handler while the live one was elsewhere.)

**Detect**: two handlers/services/registries with near-identical shape; an exported function with no callers; a branch that can't be reached. Confirm by tracing what's actually wired (the entrypoint/bootstrap), not what looks canonical.

**Fix**: delete the dead path (git is the rollback), or wire the intended one. Before editing a handler, verify it's the one the entrypoint registers.

**Defer**: broad duplication → `overengineering-audit` / `coupling-map`.

### 8. Silent fallback that masks failure

**Pattern**: on error, quietly substitute a default (empty list, cached stale value, "guest" user) and continue, with no signal that the primary path failed.

**Why it's a tell**: it makes demos smooth and incidents invisible. Distinct from #1 in that the fallback is intentional-looking but still hides the failure.

**Detect**: `try { real() } catch { return DEFAULT }`; degraded paths with no metric/log/flag marking that they fired.

**Fix**: fall back if the product needs it, but make it *observable* — log/metric the fallback, and surface degraded state where it matters. A fallback nobody can see is a failure nobody can fix.

---

## API & interface

### 9. Wrong status code / lying response

**Pattern**: `200 OK` on an error, `500` for a client mistake, an empty `200` where `404` belongs, or success envelopes wrapping failures. The status line contradicts what happened.

**Why it's a tell**: returning `res.json({ ok: false })` with a 200 is the path of least resistance; correct status mapping takes thought.

**Detect**: error branches that return success codes; catch-alls returning 500 for validation; `{ error }` bodies with 2xx status.

**Fix**: map outcomes to status families — 2xx success, 4xx caller's fault (400/401/403/404/409/422), 5xx server's fault. Clients and infra (retries, alerts, caches) depend on this being honest.

### 10. Inconsistent error shape

**Pattern**: every endpoint invents its own error format — `{error}` here, `{message}` there, a bare string somewhere else.

**Why it's a tell**: each handler written in isolation, no shared contract.

**Detect**: divergent error response bodies across handlers; ad-hoc error construction inline.

**Fix**: one error shape (code, message, optional details) via a shared helper/middleware. Consistency is what lets clients handle errors generically.

### 11. Unbounded result set / missing pagination

**Pattern**: a list endpoint or query that returns everything — no limit, no pagination — so it's fine with 10 rows and falls over at 10 million.

**Why it's a tell**: `findAll()` is shorter than designing pagination.

**Detect**: list endpoints/queries with no limit/cursor/page; `SELECT *` with no `LIMIT`; returning a full collection to the client.

**Fix**: bound every list — limit + cursor/offset pagination, and a sane default page size. Apply the same to internal fan-out queries.

**Defer**: query cost → `performance-audit`.

### 12. Leaking internals to the client

**Pattern**: stack traces, raw DB/driver errors, internal IDs, file paths, or env details returned in responses or surfaced to users.

**Why it's a tell**: echoing the caught error straight into the response is the quick way to "show the error."

**Detect**: `res.send(err)`/`err.message` to clients; raw exception serialized into a response; internal identifiers in public payloads.

**Fix**: return a sanitized, stable error to the client; log the detail server-side keyed by a correlation id. Internal detail is for your logs, not the caller.

**Defer**: `security-review`.

### 13. Non-idempotent retryable write

**Pattern**: a POST/handler that creates or charges with no idempotency guard, on a path that will be retried (network blips, at-least-once queues) — so a retry duplicates the effect.

**Why it's a tell**: idempotency is invisible until a retry doubles an order.

**Detect**: create/charge/send operations reachable from retried callers or queues with no idempotency key, unique constraint, or dedup.

**Fix**: make the write idempotent — idempotency key, natural unique constraint + conflict handling, or dedup window. (If the project has decided idempotency is out of scope, respect that — check for a decision record before flagging.)

---

## Performance

### 14. N+1 query / call-in-a-loop

**Pattern**: fetch a list, then loop and query/call once per item. 1 + N round-trips where 1 or 2 would do.

**Why it's a tell**: the loop reads naturally and passes tests on 3 rows; the round-trip cost only shows at scale.

**Detect**: an `await`/query inside a `for`/`map` over a result set; ORM lazy-loads in a loop; per-item external calls.

**Fix**: batch — one query with `IN (...)`/join, a bulk endpoint, or a dataloader. Where independent, gather concurrently (see #15).

**Defer**: `performance-audit`.

### 15. Sequential awaits that are independent

**Pattern**: `const a = await f(); const b = await g();` where `f` and `g` don't depend on each other — paying the sum of latencies instead of the max.

**Why it's a tell**: writing them in sequence is the default; noticing they're independent takes a beat.

**Detect**: consecutive awaits with no data dependency between them; independent IO done one at a time.

**Fix**: run them concurrently (`Promise.all`/`gather`/errgroup). Keep sequential only when the order or a real dependency demands it.

### 16. Unbounded / over-fetching query

**Pattern**: `SELECT *`, fetching whole rows/objects to use one field, or pulling a large set into memory to filter/aggregate in app code.

**Why it's a tell**: `select *` and "load it all then filter" are the shortest queries to write.

**Detect**: `SELECT *` where few columns are used; in-memory filter/reduce over a DB-returnable result; loading collections to compute a count.

**Fix**: select only needed columns; push filtering/aggregation/counting into the query; stream large sets.

**Defer**: `performance-audit`.

### 17. Cache/pool/memo with no measured hotspot

**Pattern**: a cache, connection pool tuning, batching, or memoization added speculatively — complexity and a staleness/invalidation surface for a hotspot nobody measured.

**Why it's a tell**: caching feels like "doing performance" and is easy to add; knowing it's needed requires a profile.

**Detect**: caches/memos on cold or cheap paths; invalidation logic guarding something never shown to be slow.

**Fix**: remove it until a profile justifies it; the simplest correct version first. (Don't strip a cache that's load-bearing — confirm it isn't first.)

**Defer**: `overengineering-audit`; before removing, `performance-audit` to confirm it isn't load-bearing.

### 18. Blocking work on the hot path

**Pattern**: heavy synchronous CPU work, sync IO, or a long unbatched operation inside a request handler / event loop tick — stalling everything else on the thread.

**Why it's a tell**: doing the work inline is simpler than offloading it; the contention only shows under concurrency.

**Detect**: sync file/crypto/parse/compress in a handler; large synchronous loops on the request path; blocking calls on an async runtime.

**Fix**: move it off the hot path — async IO, a worker/queue, streaming, or precomputation.

---

## Persistence & data

### 19. Unparameterized / string-built query

**Pattern**: a query assembled by string concatenation/interpolation with untrusted input — SQL/NoSQL/command injection.

**Why it's a tell**: string-building a query is the most direct way to express it and the most dangerous.

**Detect**: query strings built with `+`/template interpolation of variables; shell/command strings built from input.

**Fix**: parameterized queries / prepared statements / the ORM's safe API; never interpolate input into a query or command.

**Defer**: `security-review` (this is a vulnerability, not just a smell — escalate it).

### 20. Missing transaction across a multi-write invariant

**Pattern**: two+ writes that must both succeed (debit + credit, order + line items) done as separate statements with no transaction — a crash between them leaves the data inconsistent.

**Why it's a tell**: writing the statements in sequence is natural; wrapping them in a transaction is the deliberate step.

**Detect**: multiple dependent writes with no transaction/unit-of-work; "save A then save B" where a partial result is invalid.

**Fix**: wrap the invariant in one transaction with appropriate isolation; ensure rollback on failure.

### 21. Missing constraint behind a uniqueness/shape assumption

**Pattern**: code assumes a column is unique / a relation exists, but the schema doesn't enforce it — the invariant lives only in app code that races (see #5).

**Detect**: app-level uniqueness checks with no DB unique index; FK relationships not enforced; nullable columns the code treats as required.

**Fix**: enforce the invariant in the schema (unique index, FK, NOT NULL, check constraint) and let the DB be the source of truth.

**Defer**: schema/migration review → the project's migration reviewer if one exists.

---

## Config & hygiene

### 22. Hardcoded secret or environment-specific value

**Pattern**: an API key, token, password, connection string, or environment URL written as a literal in code.

**Why it's a tell**: pasting the value inline works immediately; wiring config is extra steps.

**Detect**: literal-looking keys/tokens/URLs/hosts in source; credentials in committed files.

**Fix**: move to environment/secret config; rotate anything that was committed. Never read or echo the secret value while fixing.

**Defer**: `security-review` / secret-scanning; treat a committed live secret as an incident.

### 23. `console.log` (or print) as the logging strategy

**Pattern**: ad-hoc `console.log`/`print` for diagnostics instead of the project's structured logger, often with no level, context, or correlation id.

**Why it's a tell**: it's the fastest way to see a value; it just doesn't survive contact with production.

**Detect**: raw print/console calls on real code paths where a logger exists; logs with no level/structure.

**Fix**: use the project's logger with a level and structured context (ids, request/correlation id). Reserve raw prints for throwaway debugging.

### 24. Unchecked cast / `any` at a boundary

**Pattern**: a type assertion, `any`, `as unknown as`, or equivalent escape hatch used to silence the type checker at a data boundary (parsed JSON, DB row, external response) instead of validating the shape.

**Why it's a tell**: casting is the one-keystroke way past a type error; validating is the correct, longer way.

**Detect**: `as X`/`any`/`@ts-ignore` on parsed/external data; force-casts feeding logic that assumes the shape.

**Fix**: validate and narrow at the boundary (schema parse that returns the typed value); reserve casts for cases the type system genuinely can't express, with a comment on why it's safe.

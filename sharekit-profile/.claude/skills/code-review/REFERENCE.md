# Code Review — Dimension checklists, smell catalog & PR-posting mechanics

Reference for `code-review`. Use the relevant sections; don't run every check on every
diff — scope to what the change actually touches.

## Correctness

- Logic matches stated intent; edge cases (empty, null, zero, max, unicode, concurrency).
- Off-by-one, boundary conditions, integer/float/precision, timezone/date handling.
- Error paths return/throw correctly; no swallowed errors; failures are observable.
- Async: awaited promises, no floating promises, race conditions, cancellation, ordering.
- Idempotency where retried; transactions cover multi-step state changes.

## Security

- Input validation + sanitization at trust boundaries (don't trust the client/DB/3rd-party).
- Injection: SQL/NoSQL/command/template/path-traversal/SSRF/XSS.
- Secrets: none hardcoded or logged; query strings/tokens not sent to logs or telemetry.
- AuthN/AuthZ on every privileged path; no IDOR; least privilege.
- Deserialization, regex DoS (catastrophic backtracking), unbounded allocation.

## Maintainability

- A new engineer can follow it: clear names, single responsibility, low nesting.
- Function/file size and cyclomatic complexity reasonable (target <50 lines / CC <10);
  flag the *outliers*, not every long function.
- DRY without premature abstraction; no copy-paste drift between near-identical blocks.
- Comments explain *why*, not *what*; no stale/misleading comments; no dead code.
- Change is localized; touched files trace to the stated request (no scope creep).

## Scalability

- Behavior at 10×/100× input: pagination/streaming vs load-all-in-memory.
- N+1 queries, unindexed lookups, full scans, missing composite indexes for the access pattern.
- Unbounded growth: caches/maps/queues without eviction or size cap; per-request work that
  grows with total data.
- Hot-path allocation, sync I/O on the request path, lock contention, head-of-line blocking.
- Statefulness that blocks horizontal scaling (in-process state that should be shared/external).

## Architecture / structure

- Respects existing boundaries, layering, and ADRs; dependencies point the right way
  (no inward leaks, no new cycles).
- Right seam: is logic in the right module/layer? Does it belong behind an interface?
- Coupling/cohesion: changes ripple appropriately; no god-objects or feature-envy.
- Public surface (API/types/events) is minimal, stable, and hard to misuse.
- Configuration/feature-flag/migration handled where it belongs, not inline.

## Efficiency

- Algorithmic complexity appropriate; no accidental O(n²) over realistic inputs.
- Redundant work: recomputation, repeated parsing/serialization, needless copies.
- Batching/caching opportunities only where they pay off and don't add staleness bugs.
- Bundle/startup cost for client code; lazy-load where heavy.

## Resource safety (leaks)

- Every open resource is closed on *all* paths: files, sockets, DB connections/pools,
  streams, subscriptions, timers/intervals, watchers, event listeners.
- Cleanup on error and on teardown/shutdown (try/finally, defer, `using`, disposers).
- No retained references that prevent GC (closures capturing large scope, growing caches).
- Backpressure on streams/queues; bounded concurrency.

## Code smells (name the smell, point to recurrences)

Long method · large class/file · long parameter list · primitive obsession · feature envy ·
data clumps · shotgun surgery · divergent change · duplicated code · dead code ·
speculative generality · temporal coupling · boolean/flag params · deep nesting / arrow code ·
magic numbers/strings · stringly-typed · leaky abstraction · god object · anemic model ·
nullable-everywhere · exception-as-control-flow · silent catch · TODO/FIXME debt.

## Test coverage & quality

- New behavior has tests that would *fail without the change* (assert behavior, not calls).
- Edge cases + error paths covered, not just the happy path.
- Tests are deterministic (no real time/network/random), isolated, and readable.
- No disabled/`skip`/`xfail`/`@ts-nocheck` masking failures; mocks match real contracts.
- Coverage cite: new-code coverage number when the repo gates on it; name the uncovered lines.

## Best practices / conventions

- Follows the repo's existing idioms (read neighbors): error handling, logging, config,
  imports, naming, formatting, commit/PR conventions.
- Logging/observability at the right level; no PII; structured where the repo expects it.
- Backward compatibility / migration safety (additive schema, API versioning, rollouts).
- Docs/ADR updated when the change establishes or breaks a convention.

---

## PR posting & re-review

Mechanics for *PR-comment mode*. The bundled `scripts/post_review.py` wraps the `gh`
CLI so a single bad line never sinks the whole review and thread state is reconciled
deterministically. `gh auth status` must succeed first.

### Findings JSON

A list of objects; one object = one inline thread:

```json
[
  {"path": "src/api/upload.ts", "line": 42, "severity": "P1",
   "title": "unawaited write can lose data on crash",
   "body": "`fs.writeFile` is fire-and-forget; an error here is swallowed…",
   "suggestion": "  await fs.promises.writeFile(dest, buf)"}
]
```

- `severity` ∈ `P0|P1|P2|P3`. `side` defaults to `RIGHT`. `start_line` makes a multi-line thread.
- `suggestion` (optional) renders as a committable ` ```suggestion ` block — small, single-location fixes only.
- Findings whose `line` isn't in the PR diff are auto-folded into the review summary
  (GitHub rejects inline comments off the diff) instead of failing the post.

### Commands

```bash
S=scripts/post_review.py
python3 $S post <PR> findings.json --event COMMENT      # batch-post; stamps baseline SHA
python3 $S post <PR> findings.json --event COMMENT --dry-run   # preview payload, post nothing
python3 $S threads <PR>          # our open/resolved threads + last baseline SHA (JSON)
python3 $S baseline <PR>         # just the last baseline SHA
python3 $S reply <PR> <thread_id> "Resolved in <sha>: …"
python3 $S resolve <thread_id> [<thread_id> …]
```

`--repo <owner>/<name>` overrides the auto-detected repo. `--event REQUEST_CHANGES` when a
P0/P1 stands; `APPROVE` only when genuinely clean; `COMMENT` otherwise.

### Re-review loop (incremental)

1. `threads <PR>` → list open threads + the `baseline` SHA from the prior review body.
2. `git diff <baseline>..HEAD` → scope to what changed since the last pass.
3. Per open thread, re-read the code at its `path:line`:
   - **Fixed** → `reply` "Resolved in `<sha>`: …" then `resolve <thread_id>`.
   - **Still open** → leave it, or `reply` with the precise remaining gap.
4. New issues introduced by the fix → collect into a fresh `findings.json` and `post` again
   (the new review stamps a new baseline).
5. Only resolve threads **you** authored. Never resolve/dismiss a human reviewer's thread.

### Raw API (if the script is unavailable)

```bash
# Batched review with inline threads:
gh api repos/{o}/{r}/pulls/{N}/reviews --method POST --input - <<'JSON'
{"event":"COMMENT","body":"## Senior-QA review …\n<!-- code-review:baseline=<sha> -->",
 "comments":[{"path":"src/foo.ts","line":42,"side":"RIGHT","body":"**P1** …"}]}
JSON

# List threads + resolution state:
gh api graphql -f query='query($o:String!,$r:String!,$n:Int!){repository(owner:$o,name:$r){
  pullRequest(number:$n){reviewThreads(first:100){nodes{id isResolved isOutdated
  comments(first:1){nodes{path line author{login}}}}}}}}' -F o=O -F r=R -F n=N

# Resolve a thread:
gh api graphql -f query='mutation($id:ID!){resolveReviewThread(input:{threadId:$id}){thread{isResolved}}}' -F id=THREAD_ID
```

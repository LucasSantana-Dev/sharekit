# Skill Auto-Invoke Rules

Workflows that auto-trigger based on task shape, not only on explicit slash commands.

## Composite-first principle

**When multiple skills could fit and one is a composite that chains those skills, ALWAYS prefer the composite.**

Composites enforce auto-chaining (sub-skill A's output feeds B), reconciliation, and stop conditions that individual skills do not. Invoking the composite prevents the bail-out failure mode where individual skills stop at "needs follow-up" and never get chained.

Example: when the user says "the test suite is bad" — invoke `fix-the-suite` (which chains test-health → config-drift-detect → test-cleanup → mutation-test → adr-write), NOT `test-cleanup` alone.

## Composite triggers (auto-invoke when intent matches)

### Per-task composites

| Composite | Trigger phrases / intent |
|---|---|
| `session-bootstrap` | first non-trivial prompt of fresh session, "where are we", "catch me up", "what's next", post-resume, post-handoff-load |
| `scope-and-execute` | "fix the X area", "implement Y end-to-end", "build the Z feature", open-ended scope >1h |
| `design-build` | "build a page/screen/component", "design and implement X", "create the UI for", new UI surface |
| `fix-the-suite` | "test suite is bad", "tests are slow", "too many tests", suite >2× proportionality target, after any test-cleanup that bailed out |
| `merge-confidently` | "merge this", "ship this PR", "is this ready to merge" — DIRECT-TO-MAIN repos only |
| `pr-to-release` | "open a PR", "merge this", "ship this change" — when a `release` branch exists. Lands the change on `release` with a single `[Unreleased]` changelog line; does NOT cut a version |
| `release-cut` | "cut the release", "promote release branch", "ship the batch", "tag a version" — merges `release` → `main`, tags, cleans up stale branches. MANUAL fire only; auto-nudge when `main..release` ≥ 5 commits |
| `hotfix` | "prod is down", "hotfix", "emergency fix", "P0", "SEV-1/2", "users can't X right now" — bypasses release branch, patches main directly, cherry-picks back to release |
| `dep-sweep` | "dependabot PRs", "renovate queue", "clean up bot PRs", "update deps" — auto-fires when ≥10 open bot PRs in a repo |
| `ship-it` | "deploy to prod", "release this", "deploy to production" — post-merge deployment workflow. Pair with `/release-cut` Phase 10 for batched flow |
| `debug-deep` | bug user already tried to fix once, "intermittent", "sometimes fails", "in production but not local", recurring CI pattern |
| `refactor-pipeline` | "refactor X", "restructure Y", scope >5 files OR cross-module |
| `research-and-decide` | "should we use X or Y", "is X worth adopting", "evaluate Z", library/framework/SaaS choice |
| `knowledge-loop` | "remember this", "save this", "what did we decide about X", end-of-task checkpoint |
| `feature-from-zero` | "build feature X end-to-end", "ship the new W", greenfield work >2 days estimated |
| `incident-response` | "prod is down", "users reporting X", "Sentry firing", post-deploy new errors, intermittent in prod (Phases 1–2: triage + mitigate); OR "postmortem", "incident review", "what did we learn", "write up the incident" (Phase 3) — Phase 3 auto-queued by `/hotfix` Phase 10 and after any production rollback |
| `branch-hygiene` | "branch hygiene", "clean up branches", "prune branches", "stale worktrees", "git is a mess"; auto-suggest when local branch count > 30 at session start; queued weekly per active repo |
| `repo-bootstrap` | "bootstrap this repo", "set up release branch", "new repo setup", "configure release workflow"; auto-suggest on first session when `release` branch is missing AND no `.claude/` config files |
| `backlog` | "build a backlog", "generate a backlog", "find gaps", "find opportunities", "what should I work on", "what's missing in this repo", "refactoring opportunities", "audit and plan", "comprehensive backlog", "project audit and plan"; auto-suggest after `/onboard-new-repo` Phase N as the "ok, now populate the work queue" follow-up; produces ranked GitHub issues + Project board cards in one chained workflow |

### Periodic / lifecycle composites

| Composite | Trigger |
|---|---|
| `audit-deep` | "is this project healthy", "audit the repo", weekly per active repo, pre-release |
| `security-sweep` | "security audit", "check for vulns", "is this safe to deploy", quarterly |
| `seo-a11y-audit` | "audit my site", "check SEO", "accessibility audit", pre-launch site checks |
| `mcp-care` | "MCP audit", `claude mcp list` shows failures, after upgrading MCP server |
| `onboard-new-repo` | "I just cloned X", "what is this codebase", first session in unfamiliar repo |

### Maintenance composites

| Composite | Trigger |
|---|---|
| `docs-sync` | After editing any skill / standard / hook (file in `~/.claude-env`, `~/.claude`, or `~/.agents`) |

## Core skill auto-invocation (single skills, only when no composite matches)

- `route` — when the right workflow is not obvious AND no composite matches
- `next-priority` — when entering a repo or deciding what to do now
- `plan` — for multi-step, risky, or ambiguous work (use ONLY if scope-and-execute doesn't fit better)
- `loop` — for normal inspect → act → verify → checkpoint execution
- `context-pack` — before large refactors, reviews, or unfamiliar code changes (note: `auto-context-pack.sh` hook fires this automatically on work-intent prompts)
- `secure` — for config, auth, credentials, tokens, deployment, or dependency security work
- `ci-watch` — for failing checks or repeated CI noise
- `verify` — before merge, release, or handoff
- `ship` — when a branch is merge-ready (use ONLY if merge-confidently doesn't fit better)
- `handoff` — when context is tight or work will switch sessions
- `resume` — when there is existing state in handoffs, plans, or tasks
- `ui-expert` (industry-credible UI; 4-gate workflow + Gate 0.5 register lock) — for any non-trivial UI work where output should pass the "looks like Linear/Vercel/Stripe, not LLM" five-second test. Use INSTEAD of `impeccable` / `frontend-design` when the result needs to be market-credible (not bold-experimental). Auto-invoke when ANY of these phrases appear:
  - **Personal portfolio register**: "build me a portfolio" / "personal site" / "personal website" / "about me page" / "homepage for me" / "redesign my portfolio" / "improve my portfolio" / "[named person] portfolio"
  - **SaaS landing register**: "landing page" / "homepage for our product" / "pricing page" / "pricing tier visualization" / "convert visitors" / "marketing site" / "make it look like Stripe / Linear / Vercel"
  - **Product-app register**: "dashboard for [tool]" / "admin panel UI" / "in-app workflow design" / "post-login surface"
  - **Marketing register**: "launch page" / "blog post layout" / "campaign page" / "manifesto page" / "release announcement"
  - **Docs register**: "API reference page" / "developer docs design" / "knowledge base UI" / "help center"
  - Gate 0.5 (register lock) handles ambiguous phrases by surfacing a disambiguation question.
- `ai-slop-audit` — as a post-generation lint on any UI output that wasn't already audited by `ui-expert` Gate 4. Triggers: "audit this UI for slop", "does this look generic", "lint this page", or proactively after `impeccable`/`frontend-design`/hand-written UI lands
- **Observability** (consolidated 2026-06-06 into the single `observe` skill — was a router + 7 fragments):
  - `observe` — one self-contained skill with internal **modes**. Route any observability-or-monitoring intent here; it picks the mode:
    - **Implement**: "instrument <service>" / "add logging / metrics / traces" / "wire up Sentry / OTEL / Prometheus" / "this service has no observability"
    - **Debug**: "alert flapping" / "metric missing" / "no data in dashboard" / "logs not arriving" / "drain not delivering" / "monitoring went silent"
    - **Tune**: "metrics bill too high" / "cardinality explosion" / "retention" / "sample rate too high" / "drop labels"
    - **Analyze**: "what happened at <time>" / "why did p95 spike" / "build a PromQL/LogQL/SQL for" / "correlate logs with traces" / "investigate this anomaly"
    - **Monitor** (practice layer): "we have metrics but no alerts" / "set up SLOs / SLIs / error budgets" / "create on-call rotation" / "add synthetic / uptime checks" / "build a Grafana dashboard for <service>"
    - **Bootstrap** (greenfield, full stack in one pass): "set up observability and monitoring for <new service>" / "this service is going to prod next week"
    - **Audit** (existing-service health review): "audit observability for <service>" / "quarterly monitoring review" / "post-incident observability review"
  - **Distinct from:** `/debug-deep` (generic app-bug tracing), `/incident-response` (live incident handling), `/sentry` (Sentry-specific MCP-driven workflow), `/langfuse-observe` (LLM-app tracing specifically), Vercel plugin's `/observability` (Vercel-platform-specific).
  - **Pre-condition:** don't wire the full stack on local-only / hobby code with no production-shaped target. One invocation = one mode.

## Individual skill triggers (hook-routed)

These single skills are pattern-matched by the `composite-router` hook, which emits a
` Skill match: /<name>` systemMessage. They fire **only when no composite matches first**
(composite-first principle) — the hook evaluates every composite before this cluster, and
the broad `scope-and-execute` / `parallel-phases` catch-alls last. When you see the hint,
invoke that skill. Triggers are high-precision to avoid false positives.

| Skill | Trigger intent (examples) |
|---|---|
| `code-review` | "review this PR/diff/code", "code review", "critique this code", "look over my diff". Default = chat report; posts to a PR only with explicit `--pr N --comment` |
| `sentry` | "check sentry", "sentry errors/issues/events", "recent production errors" (read-only inspection — distinct from the `incident-response` skill for live fires) |
| `sonar-check` | "sonarcloud", "sonar gate/scan/coverage", "quality gate red/status" |
| `orphan-hunt` | "find dead code", "unused files/exports/deps", "orphaned code", "find orphans" |
| `generate-tests` | "write tests for X", "add tests for X", "generate tests", "cover X with tests" |
| `adr-write` | "write an ADR", "document/record this decision", "capture the decision" |
| `changelog-update` | "update the changelog", "changelog entry" |
| `prisma-migrate` | "create a migration", "prisma migrate", "new schema migration" |
| `performance-audit` | "performance audit", "profile this function/endpoint/query", "why is X slow", "find the bottleneck" |
| `naming-consistency` | "naming consistency/convention", "inconsistent names", "standardize naming" |
| `coupling-map` | "coupling map/graph", "module dependency graph", "what depends on X" |
| `config-drift-detect` | "config drift", "gate mismatch/conflict", "coverage threshold drift" |
| `handoff` | "hand off", "wrap up this session", "save context for next session" |

To add another individual skill: append a matcher in `composite-router.sh` (after the
composite block, before the `scope-and-execute` catch-all) and add its name to the
non-composite `case` in the emit at the bottom of that hook, then mirror + commit.

## Auto-chain pairs (when one fires, queue the next)

- `test-cleanup` outputs → ALWAYS chain `mutation-test` to validate survivors
- Any skill edit → ALWAYS chain `docs-sync` to mirror across roots
- Pre-`ship` → ALWAYS chain `pr-merge-readiness` (or invoke `merge-confidently` instead)
- Pre-`refactor` → ALWAYS chain `config-drift-detect` to surface gate conflicts first
- After hook wiring → ALWAYS queue `hook-effectiveness` for next session
- Bail-out from any skill → ALWAYS queue `skill-effectiveness-audit` for next scheduled run
- Major decision made → ALWAYS chain `adr-write` to capture rationale
- After every `pr-to-release` merge → check `main..release` commit count; if ≥ 5, surface `/release-cut` nudge in the reconciliation block
- After `dep-sweep` auto-merges → check `main..release` count; same nudge applies
- After `hotfix` merges to main → ALWAYS cherry-pick back to `release` (Phase 10 of hotfix) so the next `/release-cut` does not re-introduce the regression
- After `hotfix` Phase 10 completes → ALWAYS auto-queue `/incident-response` Phase 3 (post-mortem: adr-write → generate-tests → security-sweep conditional → knowledge-loop → handoff). Defer if <6h since incident.
- After any revert/rollback to main → ALWAYS queue `/incident-response` Phase 3 (post-mortem) for the next session
- After `ui-expert` generates code (Gate 4) → ALWAYS chain `ai-slop-audit` for the QA pass; do not declare done while criticals remain
- After `impeccable` `craft` / `bolder` / `polish` → ALWAYS chain `ai-slop-audit` to catch slop impeccable misses
- After `frontend-design` → ALWAYS chain `ai-slop-audit` before declaring done
- When project has no `DESIGN.md` and `ui-expert` is invoked → queue `/impeccable teach` to author one (or author inline if scope allows)

## Release-branch model (when applicable)

When a repo has a long-lived `release` branch on origin, route PR/merge intent
through this chain instead of direct-to-main:

- New work / fixes → `/pr-to-release` (lands on `release`, no version cut)
- Bot PRs piled up → `/dep-sweep` (batches into `release`)
- Enough on `release` → `/release-cut` (one promotion → main, one tag, one release)
- Production breakage that cannot wait → `/hotfix` (only acceptable bypass)
- First contribution to a new repo → `/onboard-new-repo` then `/pr-to-release` (lands the first change on `release` if that branch exists)

The whole point is to STOP shipping a new version for every small fix.
`/pr-to-release` does NOT call `version-bump` or `ship`. Only `/release-cut`
and `/hotfix` create tags.

## Negative rules

- Do NOT auto-invoke specialized domain skills unless the task clearly matches them
- Do NOT auto-invoke expensive workflows (mega-composites like `feature-from-zero`) for trivial one-file edits
- Do NOT invoke `session-bootstrap` mid-session — only on first non-trivial prompt
- Do NOT invoke `incident-response` for dev-time bugs — use `debug-deep` instead
- Do NOT invoke individual sub-skills when their composite covers the same intent (composite-first principle)

## Precedence when multiple match

If two composites both match the user's intent:
1. Prefer the more specific (`incident-response` over `debug-deep` if production-impacting)
2. Prefer the more contained scope (`scope-and-execute` over `feature-from-zero` if not greenfield)
3. Prefer the read-only diagnostic before the action (`test-health` before `fix-the-suite` if state is unknown)

If unsure, invoke `route` to decide.

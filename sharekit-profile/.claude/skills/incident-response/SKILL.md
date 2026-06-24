---
name: incident-response
description: End-to-end production incident handling — triage (Sentry → GitHub correlate → Linear ticket), blast-radius-first mitigation (rollback vs hotfix), and the post-mortem chain (ADR + regression test + captured memory). Use when production is on fire or a deploy introduced errors. Not for dev-time debugging — use /debug-deep for that.
user-invocable: true
argument-hint: "[sentry-issue-id | error-description]"
metadata:
  type: skill
  status: stable
---

# Incident Response

When production breaks: triage fast, **stop the bleeding before chasing root cause**, then
make sure the lesson sticks. One skill across the whole lifecycle (consolidated 2026-06-06
from 4 skills: incident-response + production-incident + incident-lifecycle + incident-followup;
the separate composites are in git history). **Never auto-rollback or auto-deploy — always surface
the decision for a human.**

## Auto-invocation triggers

"prod is down", "users reporting X", "Sentry is firing/spiking", a `ship-it`/`/hotfix`
post-deploy error spike, or `/incident-response <sentry-id|error-text>`. For an already-mitigated
incident, jump to **Phase 3 (post-mortem)**.

## Phase 1 — Triage (always first)

Pull the picture, decide blast radius:

1. **Sentry** — issue title, full stack trace (top frame → affected file), affected user/org count, first/last seen, event frequency (last 15 min).
2. **GitHub correlate** — recent commits/PRs touching the failing file; when did the issue start relative to each? (started within 1h of a commit = likely culprit; 1–6h = possible; 6h+ = probably unrelated/cascading.)
3. **Linear** (if used) — create a HIGH-priority `production`/`incident` ticket with the stack trace, impact, suspect commits, and Sentry/GitHub links; assign on-call.

**Blast-radius decision:**
- single user / single feature → Phase 2 (investigate, calm)
- multiple users / one feature → Phase 2 **and** prep mitigation (rollback candidate)
- multiple users / multiple features → **skip to mitigate (rollback first, debug after)**

## Phase 2 — Root cause + mitigate (stop the bleeding)

Root cause (if blast radius is bounded): `/debug-deep` — hypothesis tree from the stack trace,
evidence walk, bisect to the introducing commit (usually the latest deploy).

Mitigate — pick by severity, ranked by risk:
1. **Revert the latest suspect commit** (lowest risk; single recent commit) → deploy via `/ship-it`.
2. **Rollback to last stable tag** (preferred for high blast radius) → `/ship-it` rollback mode; comms in the Linear ticket; then fix forward.
3. **Hotfix in place** (limited blast radius + known fix) → `/hotfix` (skips normal gates, still **never** `--admin`).

Monitor Sentry until the error rate returns to baseline before declaring mitigated. **Do not
proceed to Phase 3 while the incident is still live** — if unresolved, stop and resume Phase 3
after confirming resolution.

## Phase 3 — Post-mortem (after the bleed stops — non-skippable)

A hotfix that ships without a post-mortem repeats itself within months. Once mitigated:
1. **Root-cause writeup** → `/adr-write` as `YYYY-MM-DD-<slug>-incident-postmortem.md`: timeline (detection → resolution), severity, contributing factors, the **prevention rule(s)** to adopt, and prevention cost vs. recurrence cost. Don't write the ADR until at least one root cause is identified.
2. **Regression test** → `/generate-tests` for the exact failure path, so it can't silently return.
3. **Security sweep** (conditional) → `/security-sweep` only if the root cause is auth/input/secret-related.
4. **Capture** → `/knowledge-loop` (memory note + RAG curation) + `/handoff` if the session ends.

Watch for the anti-pattern: a Sentry alert acknowledged + threshold-bumped with **no code fix** — that's an unresolved incident wearing a resolved costume.

## Prerequisites

Sentry (MCP/API), GitHub push access, optionally Linear (MCP/API). Degrade gracefully: no Linear
→ surface the triage report inline; no stack trace → correlate by symptom + recent deploys.

## Stop / negative rules

- Never auto-rollback or auto-deploy — surface the decision (this is the on-fire skill, not autopilot).
- Blast-radius reduction outranks root cause when users are actively affected.
- Don't write a post-mortem ADR for an unidentified root cause; don't skip the regression test.
- `/debug-deep` is dev-time investigation; this skill assumes users are affected **now**.

---
name: ship-it
description: "Composite: ship merged code to prod. Triggers: 'ship to prod', 'release this', 'deploy', 'cut a release', or after merge-confidently if deploy implied. Chains version-bump → changelog-update → ship (tag+release) → deploy (vercel/cloudflare/docker/generic) → post-deploy verify with incident escalation gate."
user-invocable: true
auto-invoke: post-merge-deployment + release-cut-requests
metadata:
  owner: global-agents
  tier: contextual
  canonical_source: ~/.claude/skills/ship-it
---

# Ship It

Composite workflow: merged PR → production, verified, no incidents. Pairs with
`merge-confidently` (ends at merge); `ship-it` starts where that ends and owns
versioning, tagging, deployment, and post-deploy verification with incident-response
escalation.

## Workflow

### Phase 1 — Version + changelog (always)
- Invoke `version-bump` to determine semver bump (patch/minor/major from commit history)
- Invoke `changelog-update` to promote `[Unreleased]` to a versioned section
- Commit version + changelog, push to main
- **Done when:** version tag and changelog committed to main, git log shows both files updated

### Phase 2 — Tag + GitHub release (always)
- Invoke `ship` to:
  - Create the version tag
  - Cut a GitHub release with changelog excerpt
  - Verify the tag pushed cleanly
- **Done when:** `git tag -l` shows new tag; GitHub release visible on repo

### Phase 3 — Pre-deploy: check deployment history & mount guard (always)
- Verify External HD mounted: `mount | grep -q "/Volumes/External HD"` else halt
- Query deployment history via RAG: `python3 ~/.claude/rag-index/query.py "deployment history for <repo>" --top 3 --scope memory` (identify prior incidents, cadence, rollback patterns)
- If any P0/P1 incidents found in history → cross-check fix status before proceeding
- **Done when:** External HD confirmed mounted, deployment history reviewed, prior incidents cleared

### Phase 4 — Deploy (always — pick the right deployer)
Detect deployment target from project:
- Vercel (`vercel.json`, Next.js): invoke `vercel-deploy`
- Cloudflare Workers/Pages (`wrangler.toml`): invoke `cloudflare-deploy`
- Docker on remote server: invoke `prod-rebuild`
- Generic CI/CD: invoke `deployment-automation`
- **Done when:** deploy command exits 0, target environment reports new version live

### Phase 5 — Post-deploy verify (always)
- Wait 60s for deploy to settle
- Invoke `sentry` to check for new issue events post-deploy
- Invoke `ci-watch` to verify any post-deploy smoke checks passed
- Hit a health endpoint if known (curl `/health`, `/version` to confirm new version is live)
- **Done when:** Sentry clean, health endpoint returns live version, ci-watch passes
- **Escalation gate:** If Sentry shows ANY issue with frequency >0 in post-deploy window → STOP, invoke `incident-response` composite (see standards/incident-response.md §1), do NOT declare success

### Phase 6 — Capture (conditional)
- If release contains breaking changes: invoke `adr-write` to record migration notes
- If release is significant (minor/major): invoke `knowledge-loop` to save the
  shipping summary for future reference
- **Done when:** ADR or memory note committed (if applicable)

## Reconciliation

```
SHIP IT — <repo> v<old> → v<new>
  Pre-deploy:  External HD mounted ✓, history checked <STATUS>
  Version:     <bump type>, commits since last tag: N <STATUS>
  Changelog:   M entries promoted from Unreleased <STATUS>
  Tag:         v<new> pushed <STATUS>
  Deploy:      <target>, took Xs <STATUS>
  Verify:      sentry clean, /health ok, version shows v<new> <STATUS>
  Captured:    ADR-NNNN (if breaking) | memory note (if significant) <STATUS>
  Snapshot:    <path to release log | (none — task ongoing)>
  Open watch:  incident-response if escalated | (none)
```

## Outputs / Evidence

- New version + tag
- Changelog entries published
- Deploy target + URL
- Post-deploy verification proof (Sentry clean, health endpoint live)
- ADR if applicable

## Failure / Stop Conditions

- Phase 1 reveals uncommitted changes → STOP, commit first
- Phase 2 fails (tag conflict) → STOP, investigate tag history
- Phase 3 deployment history check: External HD unmounted → STOP, surface blocker; prior P0/P1 incident unfixed → STOP, investigate first
- Phase 4 deploy fails → STOP, surface error with logs, do NOT auto-rollback (escalate to incident-response)
- Phase 5 verify fails (new Sentry issue, health endpoint down) → STOP, invoke `incident-response` per standards/incident-response.md §1, do NOT declare success
- Never use `--force-with-lease` or `--admin` to push past gates

## Auto-chain & cross-links

After this composite completes:
- If breaking changes detected → auto-invoke `adr-write` (captured in Phase 6)
- If deployment history shows recurrent P2 failures → flag for next `/incident-response` run
- Post-deploy memory write: invoke `knowledge-loop` to save release summary (deploy time, issue count, rollback status) for future cadence detection

Escalation path: see standards/incident-response.md §1-2 for post-deploy incident protocol.

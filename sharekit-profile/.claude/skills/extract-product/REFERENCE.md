# Extract Product — Reference

## What the scanner measures vs. what you judge

`scan-subsystems.js` is purely structural — it aggregates imports at the **directory**
level (each child of the root you pass is one subsystem) and reports fan-out (subsystems
it imports), fan-in (subsystems importing it), external deps, and product signals (own
README / Dockerfile / package.json / CLI entry). It cannot tell *a product* from *a pile
of standalone glue*. A subsystem can be STANDALONE and still be worthless to spin off
(e.g. your app's config layer). You supply the product judgment.

Verdicts:
- `STANDALONE` — zero fan-out. Cuts free with no surgery; check what env it assumes.
- `near-standalone` — leans on ≤2 sibling subsystems. Often separable as a cluster, or
  the shared bits become the seam's first extraction.
- `entangled` — imports >2 siblings. App core; skip unless a clean sub-cluster exists.

Product signals are *positive evidence*: a subsystem that already has its own README,
Dockerfile, or CLI entry is already living like a product inside your repo.

## Strong spin-off archetypes

- **Internal tools you reach for weekly:** a deploy helper, a log triager, a media
  renamer, a backlog builder — if it survives contact with your own laziness, it works.
- **Secondary capabilities of a feature:** the importer, the diff view, the scheduler
  *inside* a bigger app that strangers ask "wait, what is that part?" about.
- **Workflow automations that generalize:** anything you've expressed as a skill, hook,
  or pipeline that isn't coupled to your repos' names.
- **Infrastructure recipes:** a docker-compose stack + healthchecks + dashboards that
  took real iteration to get right → template/starter material.
- **Agent-shaped capabilities:** a tool surface, a structured workflow, a domain prompt
  pack → Claude skill, plugin, or MCP server rather than an app.

## Weak / non-candidates

- Your app's core domain (the thing the app *is* — that's the product you already have).
- Glue hardwired to your env: server hostnames, your DB schema, your folder layout.
- Thin wrappers over an existing product ("Notion but my fields") — use the product.
- Anything whose pitch starts with "well, first you need my setup".
- Capabilities with one user (you) and no validation path — keep them as skills/scripts.

## Spin-off-readiness checklist (per green-lit candidate)

- [ ] One-sentence pitch names the user and the pain.
- [ ] Operable by a stranger: configuration over hardcoding; docs or a 10-line README draft.
- [ ] Structurally separable: STANDALONE or a small, nameable cluster.
- [ ] Market gap real: incumbents are absent, abandoned, heavyweight, or mis-fit.
- [ ] Demand evidence exists — or a cheap validation step is defined *before* build.
- [ ] Maintenance tail priced: issues, updates, (for SaaS) ops + billing + support.
- [ ] Operator go-ahead: license, ownership, branding, and time are the operator's call.

## Pairs with

- `extract-package` (lower altitude): library-shaped finds go there; a product scan often
  surfaces both kinds — route each to its altitude.
- `dependency-scout` / WebSearch: the "does the market already serve this" check.
- `research-and-decide`: run before committing to any spin-off — it forces the critic pass.
- `prototype`: the 1-hour first-unit gate after a green light, before any repo-bootstrap.
- `repo-bootstrap` / `to-prd`: only *after* the decision and validation, never as step 1.

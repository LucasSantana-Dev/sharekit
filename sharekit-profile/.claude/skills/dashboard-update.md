---
name: dashboard-update
description: Refresh and publish the Dev Command Center dashboard with latest live data. Use when project versions change, after releases, or when the user wants fresh metrics.
triggers:
  - update dashboard
  - refresh dashboard
  - publish dashboard
  - dev command center
  - update metrics
---

# Dashboard Update — Refresh & Publish Dev Command Center

Collect live metrics, rebuild, and deploy the Dev Command Center to homelab.

## Quick Commands

```bash
# Full pipeline (collect + build + deploy)
cd ~/Desenvolvimento/forge-space/forge-dashboard && ./deploy/publish.sh

# Collect only (no build/deploy)
cd ~/Desenvolvimento/forge-space/forge-dashboard && npm run collect

# Build only (skip collection)
cd ~/Desenvolvimento/forge-space/forge-dashboard && npm run build:static
```

## What Gets Collected

| Collector | Data | Source |
|-----------|------|--------|
| `collect-metrics.mjs` | commits, branches, LOC, memories, skills, agents, issues, PRs, npm downloads, outdated deps | GitHub API, npm API, git, filesystem |
| `collect-projects.mjs` | versions, test counts, git state, changelog highlights | package.json, git log, CHANGELOG.md |
| `collect-google-ads.mjs` | campaigns, spend, clicks, impressions, conversions | Google Sheet CSV or static |

## Updating Project Data

To update roadmap items, next steps, or highlights, edit `src/data/projects.ts` → `roadmapRegistry` object.

To add a new project, add an entry to both:
1. `scripts/collect-projects.mjs` → `projectConfigs` array
2. `src/data/projects.ts` → `roadmapRegistry` object

## Auto-Publish

LaunchAgent `com.<github-user>.dev-dashboard` runs every 30 minutes automatically.
- Logs: `/tmp/dev-dashboard.log`
- Manage: `launchctl unload/load ~/Library/LaunchAgents/com.<github-user>.dev-dashboard.plist`

## Deployment

- **URL**: https://dev.luk-homeserver.com.br
- **Homelab path**: `server-do-luk:~/dev-dashboard-site/`
- **Container**: `dev-dashboard` on `homelab_default` Docker network

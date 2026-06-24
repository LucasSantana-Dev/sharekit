# Lucky — Skills Map

Skills organized by workflow stage. Invoke via `/skill-name` or let Claude pick the right one.

## Development Loop

| Stage | Skill | When to use |
|-------|-------|-------------|
| Plan a feature | `/plan` | Before starting any multi-file change |
| Refactor existing code | `/refactor` | After identifying smell; behavior must be preserved |
| Create a refactor plan | `/refactor-plan` | Before touching a large module like music engine |
| Debug a regression | `/systematic-debugging` | Music playback silent failures, queue state corruption |
| TDD a new feature | `/test-driven-development` | New command, new queue op, new autoplay rule |
| Parallel feature work | `/three-man-team` | 3+ phase feature: design + implement + review in one dispatch |
| Dispatch subagents | `/dispatch` | 3+ independent research or implementation sub-tasks |

## Quality Gates

| Stage | Skill | When to use |
|-------|-------|-------------|
| Pre-push security | `/sonar-check` | Before every push to Lucky — checks S5852, S5332, coverage gaps |
| Security audit | `/security-scan` | Full OWASP scan — run before releases and after dependency updates |
| Security deep dive | `/security-audit` | When a CVE or pentest finding needs root-cause analysis |
| Security best practices | `/secure` (see `references/best-practices.md`) | When adding auth/session/CORS code |
| Code review | `/code-review` | After implementing a feature before opening PR |
| Performance testing | `/performance-test` | Before releases, after music engine changes, when latency reported |
| Backend testing | `/backend-testing` | Writing or reviewing Jest tests for Express routes |
| Webapp testing | `/webapp-testing` | Writing Playwright e2e or Vitest component tests |
| Playwright patterns | `/playwright-best-practices` | Setting up or fixing e2e perf tests |
| Quality assurance | `/quality-assurance` | Full QA sweep across all packages |

## Shipping

| Stage | Skill | When to use |
|-------|-------|-------------|
| Open a PR | `/pr-flow` | Structured PR creation with checklist |
| Address review comments | `/gh-address-comments` | Bulk-fix reviewer feedback |
| Fix failing CI | `/gh-fix-ci` | CI red — diagnose and patch |
| Watch CI | `/ci-watch` | Monitor long-running CI runs |
| Release | `/release-cut` | Promote release→main: version bump + changelog + tag + release in one flow |
| Changelog | `/changelog-update` | After merging PRs, update CHANGELOG.md |
| Deploy to Vercel | `/vercel-deploy` | Frontend dashboard deployment |

## Architecture & Optimization

| Stage | Skill | When to use |
|-------|-------|-------------|
| Optimize slow code | `/optimize-context` | After `/performance-test` identifies a bottleneck |
| Optimize context usage | `/optimize-context` | When session is getting heavy |
| Architecture review | `/architecture-patterns` | Before adding new service or package |
| API design | `/api-design-principles` | Before adding new Express/Hono routes |
| Frontend design | `/frontend-design` | Dashboard UI/UX improvements |
| shadcn | `/shadcn` | Adding new dashboard components, component composition, form patterns |
| RTK health | `/rtk-health` | Check Redux Toolkit store health in frontend |

## From skills.sh (installable externally)

These complement Lucky's workflow and are available via `npx skillsadd <owner/repo>`:

| Skill | Source | Why useful for Lucky |
|-------|--------|----------------------|
| `audit` | vercel-labs/skills | Broader code+quality audit beyond sonar-check |
| `critique` | vercel-labs/skills | Multi-perspective code review pass |
| `systematic-debugging` | obra/superpowers | Already local — deep debug for music engine |
| `test-driven-development` | obra/superpowers | Already local — TDD for new features |
| `subagent-driven-development` | obra/superpowers | Already local — parallelise work across packages |
| `webapp-testing` | anthropics/skills | Already local — frontend + e2e testing |
| `playwright-best-practices` | currents-dev/playwright-best-practices-skill | Setting up or fixing e2e perf tests |

```bash
# Install an external skill
npx skillsadd vercel-labs/skills/audit
npx skillsadd vercel-labs/skills/critique
npx skillsadd obra/superpowers
```

## Performance Testing — Detailed skill map

Focused skills for the `/performance-test` workflow:

| Area | Tool / approach | Skill to reach for |
|------|----------------|-------------------|
| HTTP load testing | `hey` / `oha` / `autocannon` | `/performance-test --load` |
| Music engine regression | `test:music:incident` | `/performance-test --music` |
| Prisma N+1 / slow queries | `EXPLAIN ANALYZE`, Prisma log | `/performance-test --db` |
| Frontend bundle | Vite build + `vite-bundle-visualizer` | `/performance-test --frontend` |
| Lighthouse | `npx lighthouse` | `/performance-test --frontend` |
| Dependency cost | `npm audit` + `cost-of-modules` | `/performance-test --deps` |
| Redis/session latency | `redis-cli MONITOR` + session store config | `/performance-test --api` |
| Bottleneck fix | Code-level refactor post-analysis | `/optimize-context` |

## Skills NOT applicable to Lucky

| Skill | Why skip |
|-------|----------|
| `/supabase` | Lucky uses Prisma/PostgreSQL directly, not Supabase client |
| `/cloudflare-deploy` | Frontend deploys to Vercel, not Cloudflare Pages |
| `/mcp-builder` | Lucky is not an MCP server |
| `/trigger-*` | Lucky doesn't use Trigger.dev |
| `/homelab-service-add` | Homelab skill — wrong repo |
| `/agent-task-new` | Homelab agent-task scaffold — wrong repo |

---
name: forge-ai-init-dev
description: >
  Development workflow for forge-ai-init — the AI governance layer CLI.
  Covers architecture, dev commands, test patterns, release process, and
  common contribution patterns. Use when working on forge-ai-init source code.
metadata:
  owner: forge-space
  tier: project
  canonical_source: ~/.Claude/skills/agents/forge-ai-init-dev
---

# forge-ai-init Development Skill

Fast-load context for contributing to `forge-ai-init` (Forge-Space/forge-ai-init).

## Quick Reference

```bash
npm run build      # tsup build (ESM)
npm test           # Jest ESM — 56 suites, 1088 tests (post-v0.36.0)
npm run test:coverage  # Coverage report (98%+ stmts, 95%+ branches)
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run validate   # lint + typecheck + build + test
./scripts/release.sh <major|minor|patch>  # full automated release
```

## Repository Layout

```
src/
├── shared.ts           # Shared utils: walkFiles, scoreToGrade, readJson, CODE_EXTENSIONS, IGNORE_DIRS
├── index.ts            # CLI entry — 97 lines (commands split into src/commands/)
├── types.ts            # Language, Framework, Tier, DetectedStack, etc.
├── detector.ts         # 1L facade → src/detector/ (utils, language, framework, tooling, commands, index)
├── scanner.ts          # 1L facade → src/scanner/ (types, file-checker, pattern-matcher, scoring, scanner, index)
├── scaffold.ts         # 1L facade → src/scaffold/ (types, base, templates-*, scaffold, index)
├── reporter.ts         # 1L facade → src/reporter/ (types, helpers, markdown, sarif, reporter, index)
├── checker.ts          # 73L facade → src/checkers/ (rules, skills, hooks, ci, security, quality, policies)
├── assessor.ts         # 149L facade → src/assessors/ (types, dependencies, architecture, security, quality, migration)
├── generator.ts        # Orchestrates all generators
├── diff-analyzer.ts    # PR quality delta (resolvedFindings now real)
├── commands/           # 15 command handler modules (ui, parse, scan, init, check, assess, etc.)
├── checkers/           # 7 checker sub-modules (rules, skills, hooks, ci, security, quality, policies)
├── assessors/          # 6 assessor sub-modules (types, dependencies, architecture, security, quality, migration)
├── rules/              # 10 rule category files (115 rules total)
│   ├── security.ts     # 45 rules
│   ├── engineering.ts  # 27 rules
│   ├── error-handling.ts # 14 rules
│   ├── scalability.ts  # 10 rules
│   ├── type-safety.ts  # 5 rules
│   ├── async.ts        # 4 rules
│   ├── react.ts        # 3 rules
│   ├── architecture.ts # 3 rules
│   ├── accessibility.ts # 3 rules
│   └── hardcoded-values.ts # 1 rule
├── test-autogen/       # 8 sub-modules (types, git, classifiers, requirements, templates, bypass, telemetry, index)
├── detector/           # 6 sub-modules (utils, language, framework, tooling, commands, index)
├── scanner/            # 6 sub-modules (types, file-checker, pattern-matcher, scoring, scanner, index)
├── scaffold/           # 9 sub-modules (types, base, templates-nextjs, templates-express, templates-fastapi, templates-ts-library, templates-cli, scaffold, index)
├── reporter/           # 6 sub-modules (types, helpers, markdown, sarif, reporter, index)
└── generators/         # 9 output generators
    ├── claude-md.ts    # CLAUDE.md + cursorrules (16 rule templates)
    ├── mcp-config.ts   # .mcp.json (context7, playwright, sequential-thinking)
    ├── skills.ts       # .claude/skills/ (10 skill templates, tier-gated)
    ├── policies/       # 5 sub-modules (types, base-policies, framework-policies, migration-policies, index)
    ├── migration/      # migration generator sub-module
    ├── workflows/      # 5 sub-modules (orchestrator, github-ci, github-enterprise, github-autogen, gitlab-ci)
    └── ...
src/migrate-analyzer/   # 8 sub-modules (types, strategy, boundaries, typing-needs, dependency-risks, phases, analyzer, index)
src/planner/            # 8 sub-modules (types, walker, structure, risks, recommendations, strategy, planner, index)
templates/rules/        # 16 language/framework rule templates
    common, ai-governance, scalability, migration,
    typescript, nextjs, react, vue, node, python, express,
    go, rust, java, kotlin, svelte
templates/skills/       # 10 skill SKILL.md templates
tests/
├── commands/           # 15 command handler test suites
├── rules/              # 10 rule category test suites
└── generators/         # 10 generator test suites
```

## Key Design Rules

- **ESM project** — use `import.meta.url` / `import.meta.dirname`, never `__dirname`
- **Shared utilities** — add to `src/shared.ts`, never inline duplicates
- **Functions < 50 lines** — complexity < 10
- **Generated files standalone** — no runtime dep on forge-ai-init
- **Grade type** exported from `shared.ts`, re-exported where needed
- **Kotlin = Language** — use `build.gradle.kts` + `.kt` sources for detection

## Adding a New Rule Template

1. Create `src/templates/rules/<lang>.ts` exporting `<lang>Rules(): string`
2. Import + call in `frameworkRules()` in `src/generators/claude-md.ts`
3. Add language to `Language` type in `src/types.ts` if new
4. Add detection in `src/detector.ts` (`detectLanguage()`)
5. Add the new template to generator tests in `tests/generators/claude-md.test.ts`

## Adding a New Skill Template

1. Create `src/templates/skills/<name>.ts` exporting `<name>Skill(stack): string`
2. Wire into `generateSkills()` in `src/generators/skills.ts` with tier gate
3. Add test in `tests/generators/skills.test.ts`

## Test Patterns

```typescript
// Real filesystem tests using mkdtempSync
import { mkdtempSync, rmSync } from 'node:fs';
const tmpDir = mkdtempSync(join(tmpdir(), 'forge-test-'));
try { /* test */ } finally { rmSync(tmpDir, { recursive: true }); }

// Generator unit tests — no filesystem needed
import { generateMcpConfig } from '../../src/generators/mcp-config.js';
const config = generateMcpConfig({ ...baseStack, framework: 'nextjs' });
expect(config['playwright']).toBeDefined();
```

## Known Issues / Refactor Targets

- `index.ts` is now 97 lines — split complete
- All major refactors complete as of v0.33.0 — all large files are now 1-2L facades
- `rules/index.ts` — 22L re-export, 10 category files own 115 rules
- `checker.ts` — 73L, `src/checkers/` (7 sub-modules)
- `assessor.ts` — 149L, `src/assessors/` (6 sub-modules)
- `test-autogen.ts` — 22L, `src/test-autogen/` (8 sub-modules)
- `detector.ts` — 1L, `src/detector/` (6 sub-modules) — v0.33.0
- `scanner.ts` — 1L facade → `src/scanner/` (6 sub-modules); RULES externalized to `src/rules/` (10 files, 115 rules) — v0.33.0
- `scaffold.ts` — 1L, `src/scaffold/` (9 sub-modules) — v0.33.0
- `reporter.ts` — 1L, `src/reporter/` (6 sub-modules) — v0.33.0
- `src/generators/claude-md.ts` (212L) — only remaining file above 100L, but under 250L threshold
- SonarCloud hotspot reviews required in UI for `diff-analyzer.ts` git calls
- Quality-gate CI check fails due to expired `FORGE_TENANT_PROFILES_READ_TOKEN` — infrastructure issue

## Coverage

- Overall: 98%+ stmts, 95%+ branches (threshold), 99%+ funcs — 56 suites / 1088 tests (current main)
- `npm run test:coverage` for full report
- Tests in: `tests/commands/`, `tests/rules/`, `tests/generators/`, `tests/assessors/` (integration)

## Release Process

```bash
# 1. Update CHANGELOG.md [Unreleased] section with changes
# 2. Run automated release:
./scripts/release.sh minor   # or major / patch
# This: validates → bumps version → promotes CHANGELOG → commits → tags → pushes → gh release
# npm publish triggered automatically by .github/workflows/publish.yml
```

## CI Checks

| Check | Required | Notes |
|-------|----------|-------|
| lint | yes | ESLint |
| typecheck | yes | tsc --noEmit |
| build | yes | tsup |
| test | yes | Jest ESM |
| SonarCloud | yes | Hotspots need UI review |
| quality-gate | yes | Fails due to expired tenant token (admin merge) |
| security | yes | npm audit --audit-level=high |

## Outputs / Evidence

Return: implementation done, tests pass count, lint/typecheck clean status.

## Memory Hooks

- Read project memory before starting significant work
- Write back after: new templates, test additions, releases, architecture changes

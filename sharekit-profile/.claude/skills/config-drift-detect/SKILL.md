---
name: config-drift-detect
description: Audit project gates (jest/vitest coverage thresholds, tsconfig strictness, eslint rules, husky/lint-staged, sonar quality gate, branch protection) and flag values mathematically incompatible with reasonable defaults for the project's app type. Surfaces conflicts BEFORE skills like test-cleanup or ship hit them. Use weekly, automatically, or before any major refactor.
user-invocable: true
auto-invoke: scheduled-weekly + pre-refactor
argument-hint: "[<repo-path>]"
metadata:
  owner: global-agents
  tier: contextual
---

# Config Drift Detect

Project gates that are too strict don't make a project safer — they force workarounds,
test bloat, and skill bail-outs. This skill audits every gate and flags incompatibilities
with the project's app type, before they cause concrete pain.

## Auto-invocation

- **Scheduled:** weekly via `~/Library/LaunchAgents/com.lucas.config-drift.plist`
  (Mondays 03:30). Per-repo report written to
  `~/.claude/projects/<slug>/memory/config_drift.md`.
- **Triggered automatically by Claude when:**
  - User asks to refactor, restructure, or "clean up" anything that touches gated code
  - Any skill stalls with "the gate prevents me from..." (especially test-cleanup, ship)
  - Before `/test-cleanup`, `/refactor`, `/ship` on a repo this skill hasn't audited recently

## Workflow

### 1. Detect app type and source size

```bash
cd "$REPO_PATH"
LOC=$(find src lib app extension -name '*.ts' -o -name '*.js' -o -name '*.py' \
  -o -name '*.go' 2>/dev/null | grep -vE "spec|test|node_modules" \
  | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')

# App-type heuristics from package.json / source structure
APP_TYPE=$(grep -lE "discord\.js|chrome\.runtime|webextension|express|fastify|nestjs|next|cli|commander" \
  package.json 2>/dev/null | head -1)
```

Map to defaults table:

| App type | LOC | Sane coverage gate | Sane test count | Sane suite runtime |
|---|---|---|---|---|
| Discord bot | ~5k | lines ≥80%, fn ≥80% | 50–200 | <30s |
| Browser extension | ~3k | lines ≥80%, fn ≥80% | 40–150 | <20s |
| REST API | ~4k | lines ≥85%, fn ≥85% | 80–250 | <60s |
| CLI tool | ~2k | lines ≥80%, fn ≥80% | 30–120 | <15s |
| Full-stack app | ~15k | lines ≥75%, fn ≥75% | 200–600 | <2min |
| Library (published) | varies | lines ≥90%, fn ≥90% | proportional | <30s |

### 2. Audit each gate

```bash
# Coverage thresholds
jq '.coverageThreshold' jest.config.json package.json 2>/dev/null
grep -A10 "coverageThreshold\|threshold:" jest.config.* vitest.config.* 2>/dev/null

# TypeScript strictness
jq '.compilerOptions | with_entries(select(.key | test("strict|noImplicit|exactOptional")))' tsconfig.json 2>/dev/null

# ESLint rules count + severity distribution
test -f .eslintrc.json && jq '.rules | length' .eslintrc.json
test -f eslint.config.* && grep -cE "'error'|'warn'" eslint.config.* | head -3

# Husky/lint-staged gates
test -f .husky/pre-commit && cat .husky/pre-commit
test -f package.json && jq '."lint-staged"' package.json 2>/dev/null

# SonarCloud quality gate
test -f sonar-project.properties && grep -E "^sonar\." sonar-project.properties

# Branch protection (GitHub)
gh api "repos/:owner/:repo/branches/main/protection" 2>/dev/null \
  | jq '{required_status_checks: .required_status_checks.contexts, required_review_count: .required_pull_request_reviews.required_approving_review_count}'
```

### 3. Compare each gate to the app-type default

For each gate found, compute:
- **delta** — current value vs sane default for app type
- **implied cost** — what does this gate force the team to do?
- **compatibility** — is this gate compatible with normal proportionality targets?

Example:
```
Gate: jest coverage functions ≥99%
App type: browser extension
Default for type: ≥80%
Delta: +19pp (significantly stricter)
Implied cost: ~1480 tests minimum (one per function); proportionality target 40-150 unreachable
Compatibility: INCOMPATIBLE with /test-cleanup target
Recommended: lower to 85% (industry norm for browser extensions)
```

### 4. Severity classification

| Severity | Trigger |
|---|---|
| CRITICAL | Gate makes a normal workflow impossible (test-cleanup, ship, refactor) |
| HIGH | Gate is >15pp stricter than sane default for app type |
| MEDIUM | Gate is 5-15pp stricter than default |
| INFO | Gate is within ±5pp of default |
| LOOSE | Gate is significantly looser than default (rarely a problem; flag only if security-relevant) |

### 5. Output

```
CONFIG DRIFT REPORT — <repo>

App type:    Browser extension (~3k LOC)
Audited:    7 gate categories

CRITICAL (1):
  jest functions ≥99% on extension/lib/**
  → makes /test-cleanup target (40-150) unreachable
  → Recommend: lower to 85% with /gate-relax (when implemented)

HIGH (2):
  tsconfig strict: false (sane default: true for new code)
  → Allows implicit any; lets bugs through static analysis
  
  ESLint warnings: 0 errors, 230 warnings
  → Warnings are systematically ignored; prune or promote

MEDIUM (1):
  Husky pre-commit runs full test suite (~5s)
  → Slows commits; recommend lint-staged only

INFO (3):
  branch protection, sonar quality gate, prettier — within sane defaults
```

### 6. Write to memory

Output to `~/.claude/projects/<slug>/memory/config_drift_<repo>.md` with frontmatter so
next session sees it. Include the recommended remediations as actionable bullets.

### 7. Optional: chain to gate-relax

If `/gate-relax` skill exists and severity ≥HIGH, propose chaining to apply the fix
automatically.

## Outputs / Evidence

- One-page severity-classified gate report per repo
- Recommended remediations with target values
- Memory file for next-session context

## Failure / Stop Conditions

- No recognized app type → output "unknown app type, manual review needed"
- Gate config files unreadable → report which ones, continue with the rest
- gh CLI unauthenticated → skip branch protection, continue with rest

## Memory Hooks

- Read prior drift reports to surface trend ("function gate raised from 95→99% last
  month, now incompatible")
- Write the report itself as the primary output

---
name: sonar-check
description: Pre-push SonarCloud gate preflight — scans changed files for S5852 (ReDoS), S5144 (SSRF), and coverage gaps. Project-agnostic; auto-detects base branch and SonarCloud project key.
triggers:
  - sonar check
  - sonar-check
  - check sonar
  - sonarcloud preflight
  - sonar gate
---

# sonar-check

Pre-push SonarCloud gate preflight. Detects the two classes of failures that block the gate:

1. **S5852 — ReDoS**: `new RegExp(` called with a non-literal argument
2. **S5144 — SSRF**: `fetch(` with a template literal containing `${variable}` directly in the URL
3. **Coverage gap**: new `.ts` file without a paired `.spec.ts`, or exported functions with no matching test cases

## Step 0: Detect base branch and project key

```bash
# Auto-detect base branch: prefer PR target, fall back to default remote HEAD
BASE=$(gh pr view --json baseRefName -q .baseRefName 2>/dev/null || git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/origin/||' || echo "main")
BASE="origin/$BASE"

# Auto-detect SonarCloud project key from sonar-project.properties
SONAR_KEY=$(grep -r "sonar.projectKey" sonar-project.properties sonar-project*.properties .sonarcloud.properties 2>/dev/null | head -1 | cut -d= -f2 | tr -d ' ')
```

Both can be overridden: `BASE=origin/main sonar-check` or `SONAR_KEY=my-org_my-repo sonar-check`.

## Step 1: Identify changed source files

```bash
git diff --name-only "$BASE"...HEAD -- '*.ts' '*.js' | grep -v '\.spec\.\|\.test\.\|\.d\.ts$'
```

## Step 2: S5852 scan — dynamic RegExp

```bash
git diff "$BASE"...HEAD -- '*.ts' '*.js' | grep '^+' | grep -v '^+++' \
  | grep 'new RegExp(' \
  | grep -v "new RegExp('" | grep -v 'new RegExp("' | grep -v 'new RegExp(`[^$]*`)'
```

Any match = **RED**. Show the matched line.

**Standard fix:** Replace `new RegExp(variable)` with `indexOf` + a static literal regex for boundary checks. See `languageHeuristics.ts` pattern for reference.

## Step 3: S5144 scan — SSRF in fetch

```bash
git diff "$BASE"...HEAD -- '*.ts' '*.js' | grep '^+' | grep -v '^+++' \
  | grep -E "fetch\(\`[^'\"]*\\\$\{[^}]+\}"
```

**Distinguishing false positives from real risks:**
- Variables from **user input / external data** = real risk → fix or add input validation
- Variables from **URLSearchParams / internal constants** = safe → mark as reviewed in SonarCloud dashboard, or refactor to match `URLSearchParams` pattern if all other similar calls in the file already use it (keeps the codebase consistent and avoids triggering the hotspot for new code)

**Standard fix:** Use `URLSearchParams` like other fetch calls in the file:
```typescript
const params = new URLSearchParams({ key: String(value) })
fetch(`https://api.example.com/endpoint?${params.toString()}`, ...)
```

## Step 4: Coverage gap scan

For each **new** `.ts` file added in this branch:

```bash
# Find newly added source files (not specs)
git diff --name-only --diff-filter=A "$BASE"...HEAD -- '*.ts' | grep -v '\.spec\.\|\.test\.\|\.d\.ts$'
```

For each new file:

a. Check a `.spec.ts` exists:
```bash
find . -name "$(basename "$file" .ts).spec.ts" -not -path "*/node_modules/*" 2>/dev/null
```

b. Check exported symbols have at least one test mention:
```bash
# Extract exported function/const names
grep -E "^export (async )?function|^export const [a-zA-Z]" "$file" | sed 's/export \(async \)\?function //;s/export const //;s/[( =].*//'
# Check each name appears in the spec
grep -c "name" spec_file
```

Missing spec = **RED**. Exported symbol with no test mention = **YELLOW**.

## Step 5: Report verdict

```
══════════════════════════════════════
  sonar-check  [project: <KEY>]
  base: <BASE>  changed: <N> files
══════════════════════════════════════
S5852  dynamic RegExp:   PASS / ✗ <N> found
S5144  dynamic fetch:    PASS / [WARN]  <N> flagged
Coverage gaps:           PASS / ✗ <N> files missing specs
══════════════════════════════════════
Overall: GREEN / YELLOW / RED
══════════════════════════════════════
```

- **RED**: S5852 hit or missing spec → SonarCloud will block merge
- **YELLOW**: S5144 hit or untested exports → manual review recommended
- **GREEN**: No issues

## Live gate check (optional, requires SONAR_TOKEN)

```bash
PR=$(gh pr view --json number -q .number 2>/dev/null)
if [ -n "$PR" ] && [ -n "$SONAR_TOKEN" ] && [ -n "$SONAR_KEY" ]; then
  curl -s -u "${SONAR_TOKEN}:" \
    "https://sonarcloud.io/api/qualitygates/project_status?projectKey=${SONAR_KEY}&pullRequest=${PR}" \
    | python3 -c "
import sys, json
d = json.load(sys.stdin)
s = d['projectStatus']
print('Gate:', s['status'])
for c in s['conditions']:
    flag = '✓' if c['status'] == 'OK' else '✗'
    print(f\"  {flag} {c['metricKey']}: {c['actualValue']} (threshold: {c['errorThreshold']})\")
"
fi
```

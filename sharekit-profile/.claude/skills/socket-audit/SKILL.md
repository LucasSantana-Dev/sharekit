---
name: socket-audit
description: Run Socket.dev supply chain security audit on npm dependencies for malicious packages and typosquatting
user-invocable: true
argument-hint: "[--scan | --ci-setup | --fix]"
---

# Socket Audit Skill

Detect supply chain attacks, typosquatting, and malicious packages in your npm dependencies with Socket.dev, an LLM-powered vulnerability scanner for modern threats.

## What Socket.dev Detects

- **Malicious Packages**: Known harmful code, cryptominers, data stealers
- **Typosquatting**: Packages with names similar to popular ones (e.g., `eslint` vs `eslnt`)
- **Suspicious Maintainer Changes**: Sudden ownership transfers or credential compromise
- **Install Scripts**: Packages that run arbitrary code on `npm install`
- **Supply Chain Risk**: Dependencies of dependencies with known issues
- **Deprecated/Unmaintained**: Packages no longer actively maintained
- **Known CVEs**: Existing reported vulnerabilities in dependencies

## Quick Scan

**One-liner scan of current project:**
```bash
npx socket scan
```

This scans your `package.json` and `package-lock.json` (or `yarn.lock`/`pnpm-lock.yaml`) and outputs findings.

## Understanding the Results

Socket categorizes findings by severity:

| Severity | Action | Example |
|----------|--------|---------|
| **CRITICAL** | Block PR, investigate immediately | Known malware, active cryptominer |
| **HIGH** | Review in detail, require approval | New maintainer, install script on new version |
| **MEDIUM** | Inform team, consider mitigation | Deprecated package, typosquatting risk |
| **LOW** | Log for trend analysis | Network access, file system access |

## CLI Usage

```bash
# Scan current directory (reads package.json + lock file)
npx socket scan

# Scan with verbose output
npx socket scan --verbose

# Output JSON for parsing
npx socket scan --json

# Check a specific package
npx socket scan --package react

# Update packages and re-scan
npm update
npx socket scan
```

## GitHub Actions Setup

**Create `.github/workflows/socket.yml`:**

```yaml
name: Socket Security Scan

on:
  pull_request:
  push:
    branches: [main]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Socket Scan
        uses: socket-security/action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

This runs on every PR and commit, automatically commenting with findings.

## How the Skill Works When Invoked

### `/socket-audit --scan`
1. Runs `npx socket scan` in current directory
2. Parses output for CRITICAL and HIGH findings
3. For each finding, outputs:
   - Package name
   - Issue type (malware, typosquatting, install script, etc.)
   - Recommended action
4. Suggests mitigation: patch version, replace package, or request exemption

### `/socket-audit --ci-setup`
1. Checks if GitHub Actions workflow exists
2. If not: generates `.github/workflows/socket.yml`
3. Commits workflow file and creates PR
4. Enables automated security scanning on all PRs

### `/socket-audit --fix`
1. Run full scan
2. For each CRITICAL issue:
   - Suggest version bump, replacement, or removal
   - (Does NOT auto-execute — requires human approval)
3. For HIGH issues:
   - Suggest mitigation
4. Output a todo list for next steps

## Interpreting Common Findings

### Typosquatting (MEDIUM/HIGH)
```
Package: "eslnt" (candidate for eslint)
Risk: Install-time user mistake
Action: Check package.json spelling; remove if accidental
```

### Install Script (HIGH)
```
Package: "some-lib@2.1.0"
Risk: Runs arbitrary code during `npm install`
Action: Review node_modules/some-lib/scripts/ for legitimacy
```

### Known Malware (CRITICAL)
```
Package: "malicious-package"
Risk: Confirmed cryptominer/data stealer
Action: Remove immediately; audit logs for compromise
```

### Unmaintained (MEDIUM)
```
Package: "old-lib"
Risk: No updates in 3+ years; may have unfixed vulnerabilities
Action: Consider active alternative or add to exceptions if stable
```

## Integration with CI/CD

Socket results automatically block merges on CRITICAL findings. For HIGH:
- PR requires approval from security team or maintainer
- Comment on PR explains finding and mitigation

## Example Output

```
Socket security scan results:

CRITICAL (1):
- "malicious-steal" v1.0.0: Known cryptominer. ACTION: Remove from package.json

HIGH (3):
- "random-package" v2.1.0: Newly pushed by unknown maintainer. ACTION: Pin to v2.0.9 or verify new maintainer
- "deprecated-lib" v1.0.0: Install script detected. ACTION: Review lib/install.js
- "typo-common" v1.0.0: Package name is typosquatting candidate for "typo-comm". ACTION: Verify spelling

MEDIUM (2):
- "unmaintained-lib" v0.9.0: No updates in 5 years. ACTION: Consider replacement
- "network-access" v1.1.0: Makes network requests. ACTION: Legitimate but monitor for abuse

Recommendation: Fix 1 CRITICAL, review 3 HIGH before merging.
```

## Prevention Checklist

- Run on every PR via GitHub Action
- Pin transitive dependencies you trust (use `npm ls` to audit tree)
- Require code review for dependency changes
- Use `npm audit` for CVEs + Socket for supply chain attacks
- Subscribe to GitHub Security Advisories for your dependencies

## Troubleshooting

- **Slow scan**: First run fetches package data; subsequent runs are cached
- **False positives**: Socket AI-powered; some findings may need exemption approval
- **No findings**: Either no issues or Socket hasn't indexed the latest package data
- **API rate limit**: Free tier has limits; register account to increase quota

## Pricing

- **Free**: Limited scans
- **Pro**: Unlimited scans + GitHub Actions integration
- **Enterprise**: Self-hosted option available

## Next Steps

1. Run `/socket-audit --scan` on current project
2. Review CRITICAL and HIGH findings
3. Patch/remove problematic packages
4. Run `/socket-audit --ci-setup` to enable GitHub Actions
5. Merge when findings are resolved

---

**Invocation pattern**: `/socket-audit --scan` to run scan, `/socket-audit --ci-setup` to add GitHub Actions, `/socket-audit --fix` to see mitigation steps.

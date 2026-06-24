---
name: security-scan
description: Run concrete security scanning steps for the current project, including
  secrets, dependency, code, or config checks. Use when the user wants executable
  security verification before merge or release.
disable-model-invocation: true
context: fork
allowed-tools: Bash(*)
argument-hint: '[secrets|deps|code|config|all]'
metadata:
  owner: global-agents
  tier: contextual
---














Run security scan for the current project. Scope: `$ARGUMENTS` (default: all).

## Scan phases

### 1. Secrets detection

Search tracked files for hardcoded secrets:
- Passwords, API keys, tokens assigned to string literals
- .env files with actual values (not REPLACE_WITH_ placeholders)
- Private keys (.pem, .key, .p12) committed to git

Use `git grep` to search, excluding test files and markdown.

### 2. Dependency vulnerabilities

Run the appropriate audit tool:
- Node.js: `npm audit --audit-level=moderate`
- Python: `pip-audit` or `safety check`
- Rust: `cargo audit`

Report high/critical findings.

### 3. Code patterns

Look for dangerous patterns:
- Dynamic code evaluation (eval, Function constructor)
- SQL string concatenation (injection risk)
- Unsanitized HTML rendering (XSS risk)
- Disabled security protections (CSRF, CORS wildcards)
- Hardcoded URLs with embedded credentials

### 4. Configuration security

Check for:
- Docker containers running as root
- Using `:latest` image tags in production
- CI secrets referenced inline instead of via env
- Overly permissive CORS origins

## Report format

```
Security Scan Report
--------------------
Secrets:    [CLEAN/FOUND N issues]
Deps:       [CLEAN/N vulnerabilities]
Code:       [CLEAN/N patterns found]
Config:     [CLEAN/N issues]

Critical:   [list if any]
Action:     [required steps]
```

Flag CRITICAL for: exposed secrets, high/critical CVEs, injection vectors.

## Outputs / Evidence

- Return the checks run, evidence captured, blockers found, and the next required action.

## Failure / Stop Conditions

- Stop if required credentials, environment access, or prerequisite context are missing.
- Stop if the workflow would report unverified work as complete.
- Do not bypass required gates or safeguards unless the user explicitly asks for it.

## Memory Hooks

- Read memory when product, repo, or workflow history affects correctness.
- Write memory only if this work establishes a durable policy or convention.

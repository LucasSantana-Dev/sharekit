---
name: security-audit
description: Perform a broad security audit across secrets, dependencies, code paths,
  and OWASP-style risks. Use when the user wants a security review of a codebase or
  system rather than a narrow scan command.
argument-hint: '[<scope>]'
metadata:
  owner: global-agents
  tier: contextual
---














# Security Audit

Comprehensive security audit for codebases.

## Audit Areas

### 1. Secret Detection
- Scan for hardcoded API keys, tokens, passwords
- Check .env files aren't committed
- Verify .gitignore covers sensitive files

### 2. Dependency Vulnerabilities
```bash
# Node.js
npm audit --omit=dev
# Python
pip-audit || safety check
```

### 3. Code Security
- SQL injection vectors (parameterized queries?)
- XSS prevention (output sanitization?)
- CSRF protection
- Authentication/authorization patterns
- Input validation at system boundaries

### 4. Infrastructure
- HTTPS enforcement
- CORS configuration
- Rate limiting
- Security headers (CSP, HSTS, X-Frame-Options)

## Output

```
SECURITY AUDIT — <project>
━━━━━━━━━━━━━━━━━━━━━━━━━
Critical: <count> | High: <count> | Medium: <count> | Low: <count>

[CRITICAL] <finding>
[HIGH] <finding>
...

Recommendations:
1. <action>
2. <action>
```

## Failure / Stop Conditions

- Stop if required credentials, environment access, or prerequisite context are missing.
- Stop if the workflow would report unverified work as complete.
- Do not bypass required gates or safeguards unless the user explicitly asks for it.

## Memory Hooks

- Read memory when product, repo, or workflow history affects correctness.
- Write memory only if this work establishes a durable policy or convention.

# Security

## Risk Model

Profiles are published to **public GitHub repositories** and installed directly into your home directory. Before pushing a profile, you are responsible for ensuring it contains no secrets.

## Review Before Publishing

Run the secret scanner before `git push`:

```bash
npx @lucassantana/sharekit scan ./sharekit-profile
```

Manually review your profile's structure:
- **CLAUDE.md** — check for inline secrets, API keys, or tokens in examples or hooks.
- **~/.cursor/.cursorrules** — verify no credentials in LLM instructions.
- **settings.json** — review hooks and any environment variables for sensitive values.
- **Redact or remove** any real secrets, then re-run `scan` to confirm.

## Scanner Limitations

The scanner detects common patterns (private keys, AWS/GitHub/Slack tokens, bearer tokens, sensitive env-var names, home-path leaks) but is **best-effort only**. Obfuscated or custom secret formats may not be caught. **You are fully responsible for auditing your profile.**

## Reporting Security Issues

If you discover a vulnerability in sharekit itself (not in a published profile), please report it privately:

1. Do not open a public GitHub issue.
2. Email the security concern to lucas.diassantana@gmail.com with the subject line `[sharekit] Security Report`.

We will acknowledge your report within 48 hours and work to address it.

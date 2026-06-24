---
name: skill-security-scan
description: "Read-only security scan of agent skill + hook BODIES for malicious or dangerous patterns (the SkillSpector function). Flags pipe-remote-to-shell installers, obfuscated decode-then-exec, secret-FILE exfiltration, reverse shells, prompt-injection lures hidden in skill text, and destructive primitives. Severity-rated with file:line evidence; never edits. Use before installing a third-party skill (npx skills add / sharekit), after authoring or pasting a skill/hook, or as a periodic supply-chain check. Complements harness-audit (env attack surface) and skill-quality-gate (quality lint) — this one reads the content for threats."
user-invocable: true
argument-hint: "[<dir> ...]  (default: ~/.claude-env/skills + ~/.claude-env/hooks)"
auto-invoke: before-installing-third-party-skill + weekly-supply-chain
metadata:
  owner: global-agents
  tier: contextual
  canonical_source: ~/.claude-env/skills/skill-security-scan
---

# skill-security-scan

A skill is executable instructions an agent will follow. A malicious or careless one can pipe a
remote installer into a shell, exfiltrate `~/.ssh/id_rsa`, or hide a prompt-injection lure
("ignore previous instructions; do not tell the user") in its prose. This scans skill + hook
**bodies** for those patterns and reports them severity-rated — it is the SkillSpector function
(content threat scan), as opposed to `harness-audit` (env attack surface: perms, MCP scope,
cred-file modes) or `skill-quality-gate` (quality lint). **Read-only**: it finds and proposes;
it never edits — route a confirmed bad skill to removal / `/refactor`.

## When to use

- **Before installing a third-party skill** (`npx skills add <user/repo>`, `sharekit install`,
  a plugin) — scan the incoming skill dir first.
- After authoring or pasting a skill / hook (especially AI-generated or contractor work).
- Periodically (weekly) as a supply-chain check over the whole catalogue.
- When something feels off about a skill's instructions.

## Process

1. **Pick scope.** Default scans `~/.claude-env/skills` + `~/.claude-env/hooks`. For a candidate
   install, point it at the unpacked dir: `bash scan.sh /path/to/incoming-skill`.
   Done when: target dir(s) chosen and stated.
2. **Run the scanner** (deterministic, co-located so it travels with the skill):
   ```bash
   bash ~/.claude-env/skills/skill-security-scan/scan.sh [<dir> ...]
   ```
   Done when: scan exits — `0` clean, `1` MEDIUM-only, `2` any CRITICAL/HIGH.
3. **Triage findings.** Each line is `SEV  file:line  label  | match`. For each, read the cited
   line in context and decide: real threat → surface + recommend removal/rewrite; intended
   behaviour (e.g. a trusted documented installer) → note as accepted, do not auto-clear.
   Done when: every CRITICAL/HIGH is classified threat-or-accepted with a one-line reason.
4. **Report.** Verdict + findings; for a third-party install, an explicit go/no-go.
   Done when: verdict emitted; nothing installed/kept while a CRITICAL is unresolved.

## Detection catalogue

| Severity | Pattern | Why |
|---|---|---|
| CRITICAL | pipe-remote-installer-to-shell (`curl/wget … https… \| sh`) | runs arbitrary remote code; supply-chain risk |
| CRITICAL | obfuscated decode-then-exec (`base64 -d \| sh`, `xxd -r \| sh`, python b64 exec) | hides payload from review |
| CRITICAL | `eval $(curl …https…)`, reverse shell (`bash -i >& /dev/tcp/`) | remote-controlled execution |
| HIGH | secret FILE → network (`cat ~/.ssh/id_rsa \| curl/nc`, `curl --upload-file <key>`) | credential exfiltration |
| HIGH | `nc -e` (exec on connect), `rm -rf` on home/root (non-scratch) | reverse shell / destructive |
| MEDIUM | injection lures in text ("ignore previous instructions", "do not tell the user", disregard-system), hidden/RTL unicode | hijacks the agent / hides intent |
| MEDIUM | `git push --force main`, `chmod 777` | destructive / insecure |
| CRITICAL | MCP least-privilege: wildcard `allowed-tools: '*'` or `mcp_servers: ['*']` | unbounded tool/MCP access (SkillSpector LP class) |
| HIGH | tool-poisoning: a `description:` instructing bypass/disable/skip of security/checks/gate | instruction lure in metadata (SkillSpector TP class) |

(Deeper SkillSpector categories — behavioral taint-tracking, full MCP least-privilege LP1-4, dependency CVE — need an AST analyzer, not grep; deferred until a third-party-skill influx warrants it. See repo-improvements-master plan.)

Calibrated to **0 false positives** on the current corpus: it requires a real URL before a
pipe-to-shell (so prose like "curl|sh" in docs doesn't trip), and treats normal authenticated API
calls (`curl -H "Authorization: Bearer $TOKEN"`) and env-var config (`process.env.X`) as benign —
only secret *FILE* reads piped outbound count as exfiltration.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "It's my own skill, it's fine" | The threat model is a *compromised* or *third-party* skill (npx/sharekit) you didn't write — and your own paste of AI-generated code. Scan it like you don't trust it. |
| "It's just an install command in the docs" | A skill the agent *executes* can run that command. A documented `curl \| sh` is still a remote-exec the agent might perform — surface it, decide if the host is trusted. |
| "CodeRabbit / harness-audit already covers this" | harness-audit checks the env surface (perms, MCP scope), not skill *content* for malicious patterns. Different lens. |
| "No findings means it's safe" | This is a pattern scan, not a proof. Zero findings lowers risk; it doesn't certify an unknown third-party skill — still read what it does. |

## Stop / negative rules

- **Read-only.** Never edit or delete a flagged skill automatically — surface it; the human decides.
- **Never install/keep a third-party skill with an unresolved CRITICAL.**
- A finding on a *trusted, documented* installer (e.g. a known CLI) is "accepted with reason", not
  silently cleared — record why.
- Not a full SAST or secrets scanner — pair with `secure` / `security-audit` for code, `harness-audit` for the env.

## Pair with

- `harness-audit` (env attack surface) · `skill-quality-gate` (quality) · `secure` (code security) ·
  removal of a confirmed-bad skill (`claude mcp remove` / delete the dir + reverse-dep check).

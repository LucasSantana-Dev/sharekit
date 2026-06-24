#!/usr/bin/env bash
# skill-security-scan/scan.sh — read-only malicious-pattern scan of agent skill + hook BODIES
# (the SkillSpector function — distinct from harness-audit, which covers the ENV attack surface).
# Usage: scan.sh [target-dir ...]   (default: ~/.claude-env/skills ~/.claude-env/hooks)
# Output: SEV  file:line  label  | match.   Exit: 2 if CRITICAL/HIGH, 1 if MEDIUM, 0 clean.
set -uo pipefail

targets=("$@")
[ ${#targets[@]} -eq 0 ] && targets=("$HOME/.claude-env/skills" "$HOME/.claude-env/hooks")
mapfile -t FILES < <(
  for t in "${targets[@]}"; do
    find "$t" -type f \( -name '*.md' -o -name '*.sh' -o -name '*.js' -o -name '*.ts' -o -name '*.py' \) 2>/dev/null
  done | grep -vE '/node_modules/|/\.git/|/hooks/archive/|/skill-security-scan/'
)

TMP=$(mktemp); trap 'rm -f "$TMP"' EXIT
add() { # sev label  (matches on stdin as file:line:text)
  local sev="$1" label="$2"
  while IFS= read -r ln; do
    [ -z "$ln" ] && continue
    local loc m; loc=$(printf '%s' "$ln" | cut -d: -f1-2)
    m=$(printf '%s' "$ln" | cut -d: -f3- | sed 's/^[[:space:]]*//' | cut -c1-100)
    printf '%s\t%s\t%s\t%s\n' "$sev" "$loc" "$label" "$m" >> "$TMP"
  done
}
scan() { grep -rnEI "$1" "${FILES[@]}" 2>/dev/null; }

# ── CRITICAL: remote code execution (require a URL before the pipe-to-shell → excludes prose) ──
scan '(curl|wget|fetch)[^|]*https?://[^|]*\|[[:space:]]*(sudo[[:space:]]+)?(ba|z|k)?sh([[:space:]]|$)' | add CRITICAL "pipe-remote-installer-to-shell"
scan 'eval[[:space:]]+["'"'"'\`]?\$\((curl|wget|fetch)[^)]*https?://' | add CRITICAL "eval of remote fetch"
scan '(base64[[:space:]]+(-d|-D|--decode)|xxd[[:space:]]+-r)[^|]*\|[[:space:]]*(ba)?sh' | add CRITICAL "obfuscated decode-then-exec"
scan 'python[0-9.]*[[:space:]]+-c[[:space:]].*(exec|eval)\([^)]*b64decode' | add CRITICAL "python base64 exec"
scan 'bash[[:space:]]+-i[[:space:]]*>&[[:space:]]*/dev/tcp/' | add CRITICAL "reverse shell (/dev/tcp)"

# ── HIGH: real secret-FILE exfiltration (NOT normal authed API calls / env config) ──
scan '(cat|head|tail|<)[^|]*(\.ssh/|id_rsa|id_ed25519|\.aws/credentials|\.gnupg|secrets?\.(json|ya?ml|env)|\bPRIVATE KEY\b)[^|]*\|[^|]*(curl|wget|nc|ncat)\b' | add HIGH "secret FILE piped to network"
scan '(curl|wget)[^\n]*( -d @| --data @| -F | --upload-file )[^\n]*(\.ssh/|id_rsa|id_ed25519|\.aws/credentials|\.pem\b|\.key\b|\.gnupg)' | add HIGH "secret FILE uploaded outbound"
scan '(^|[^[:alnum:]_/])(nc|ncat)[[:space:]]+-[a-z]*e[a-z]*([[:space:]]|$)' | add HIGH "netcat -e (exec on connect)"

# ── MEDIUM: prompt-injection lures embedded in skill TEXT ──
scan 'ignore[[:space:]]+(all[[:space:]]+)?(previous|prior|above)[[:space:]]+(instructions?|prompts?)' | add MEDIUM "injection lure: ignore-previous"
scan '(do not|don'"'"'t|never)[[:space:]]+(tell|inform|reveal[[:space:]]+to|notify|mention[[:space:]]+(this[[:space:]]+)?to)[[:space:]]+(the[[:space:]]+)?(user|operator|human)' | add MEDIUM "injection lure: hide-from-user"
scan 'disregard[[:space:]]+(the[[:space:]]+)?(above|previous|prior|system[[:space:]]+prompt)' | add MEDIUM "injection lure: disregard"
scan $'​|‌|‍|‮|⁦|⁧' | add MEDIUM "hidden/RTL-override unicode in text"

# ── MEDIUM: destructive primitives (scratch/tmp excluded) ──
scan 'rm[[:space:]]+-[a-z]*r[a-z]*f[a-z]*[[:space:]]+(/|~|\$HOME|\$\{HOME\})([[:space:]]|/|$)' | grep -viE 'scratch|/tmp/|\.cache|node_modules|/dist|\.worktrees|backup' | add HIGH "rm -rf on home/root (non-scratch)"
scan 'git[[:space:]]+push[[:space:]][^\n]*(--force([[:space:]]|=)|[[:space:]]-f[[:space:]])[^\n]*(main|master)' | grep -viE 'refus|never|reject|block|do not|don'"'"'t|forbid|NOT ' | add MEDIUM "force-push to main"
scan 'chmod[[:space:]]+(-R[[:space:]]+)?(0)?777' | add MEDIUM "chmod 777 (world-writable)"

# ── SkillSpector harvest: MCP least-privilege + tool-poisoning (grep-feasible subset; calibrated 0-FP) ──
# (deeper taint-tracking / LP1-4 / TP1-4 need an AST analyzer, not grep — out of scope for this scanner)
scan '^[[:space:]]*(allowed-tools|tools)[[:space:]]*:[[:space:]]*["'"'"']?\*["'"'"']?[[:space:]]*$' | add CRITICAL "MCP least-privilege: wildcard allowed-tools"
scan '^[[:space:]]*mcp_servers[[:space:]]*:[[:space:]]*(\[[^]]*["'"'"']?\*|["'"'"']?\*)' | add CRITICAL "MCP least-privilege: wildcard mcp_servers"
scan '^[[:space:]]*description[[:space:]]*:[^|]*(bypass|disable|turn[[:space:]]+off|skip)[[:space:]]+(the[[:space:]]+)?(security|checks?|validation|gate|review)' | grep -viE 'refus|never|reject|block|do not|don'"'"'t|forbid|NOT |warn' | add HIGH "tool-poisoning: bypass-security imperative in description"

# ── print (severity-ordered) + summary ──
if [ -s "$TMP" ]; then
  awk -F'\t' 'BEGIN{o["CRITICAL"]=1;o["HIGH"]=2;o["MEDIUM"]=3} {print o[$1]"\t"$0}' "$TMP" \
    | sort -n | cut -f2- | awk -F'\t' '{printf "%-8s %-62s %s  | %s\n",$1,$2,$3,$4}'
fi
crit=$(grep -c '^CRITICAL' "$TMP"); high=$(grep -c '^HIGH' "$TMP"); med=$(grep -c '^MEDIUM' "$TMP")
echo "---"
echo "skill-security-scan: ${#FILES[@]} files scanned | CRITICAL=$crit HIGH=$high MEDIUM=$med"
[ "$crit" -gt 0 ] || [ "$high" -gt 0 ] && exit 2
[ "$med" -gt 0 ] && exit 1
exit 0

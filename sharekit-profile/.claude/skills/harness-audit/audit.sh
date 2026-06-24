#!/usr/bin/env bash
# harness-audit — read-only security audit of the Claude Code harness config (~/.claude)
# as an attack surface. Mutates nothing. Secrets are masked, never printed.
# Usage: audit.sh [--strict] [path]   (default path: ~/.claude; --strict => exit 2 on any HIGH)
set -u

STRICT=0
ROOT="$HOME/.claude"
for a in "$@"; do
  case "$a" in
    --strict) STRICT=1 ;;
    -*) echo "unknown flag: $a" >&2; exit 64 ;;
    *) ROOT="$a" ;;
  esac
done
[ -d "$ROOT" ] || { echo "not a directory: $ROOT" >&2; exit 64; }

TMP="$(mktemp -t harness-audit.XXXXXX)"
trap 'rm -f "$TMP"' EXIT
SELF_DIR="harness-audit"   # exclude this skill's own dir so its regexes don't self-match

# Common excludes for heavy / irrelevant dirs.
EX=(--exclude-dir=node_modules --exclude-dir=.git --exclude-dir=rag-index
    --exclude-dir=projects --exclude-dir=shell-snapshots --exclude-dir=todos
    --exclude-dir=statsig --exclude-dir=history --exclude-dir=file-history
    --exclude-dir=ide --exclude-dir="$SELF_DIR")

# Settings + top-level config files (the core attack surface).
CONF_FILES=()
for f in "$ROOT/settings.json" "$ROOT/settings.local.json" "$ROOT/.mcp.json" "$ROOT/mcp.json"; do
  [ -f "$f" ] && CONF_FILES+=("$f")
done

short() { sed -E "s#/Users/[^/]+/\.claude#~/.claude#g; s#$HOME#~#g"; }
# record SEV<TAB>CATEGORY<TAB>evidence
rec() { printf '%s\t%s\t%s\n' "$1" "$2" "$3" >>"$TMP"; }

# Pipe grep "file:line:content" lines into findings. $1=sev $2=cat $3=redact(0/1)
ingest() {
  local sev="$1" cat="$2" redact="$3" l r
  while IFS= read -r l; do
    [ -z "$l" ] && continue
    r="$(printf '%s' "$l" | short | cut -c1-180)"
    [ "$redact" = "1" ] && r="$(printf '%s' "$r" | sed -E 's/[A-Za-z0-9+/_-]{16,}/«redacted»/g')"
    rec "$sev" "$cat" "$r"
  done
}

# ── 1. SECRETS — hardcoded keys/tokens in config + hooks (NOT in skills/, to avoid
#       matching other scanners' regexes). Filters out env-var references.
SECRET_RE='(sk-[A-Za-z0-9]{20,}|gh[posru]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{22,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{30,}|-----BEGIN [A-Z ]+PRIVATE KEY-----)'
GENERIC_RE='(api[_-]?key|secret|access[_-]?token|auth[_-]?token|client[_-]?secret|password|passwd)["'"'"']?[[:space:]]*[:=][[:space:]]*["'"'"']?[A-Za-z0-9/+_-]{20,}'
NOISE='\$\{?[A-Za-z_][A-Za-z0-9_]*\}?|os\.environ|process\.env|getenv|<[A-Za-z_ -]+>|your[-_]|example|placeholder|REDACTED|xxxx|\.\.\.|changeme|0000'
SECRET_TARGETS=("${CONF_FILES[@]}")
[ -d "$ROOT/hooks" ] && SECRET_TARGETS+=("$ROOT/hooks")
if [ "${#SECRET_TARGETS[@]}" -gt 0 ]; then
  grep -rInE "${EX[@]}" --exclude='*.credentials.json' -e "$SECRET_RE" -e "$GENERIC_RE" "${SECRET_TARGETS[@]}" 2>/dev/null \
    | grep -vEi "$NOISE" | ingest HIGH "secret" 1
fi

# ── 2. HOOK / SCRIPT INJECTION — shell-exec of (possibly untrusted) input.
INJ_HIGH='(curl|wget)[^|]*\|[[:space:]]*(ba)?sh|shell[[:space:]]*=[[:space:]]*True|os\.system\(|[^A-Za-z_]exec\(|[^A-Za-z_]eval[[:space:]]'
INJ_MED='bash[[:space:]]+-c[[:space:]]+"\$|sh[[:space:]]+-c[[:space:]]+"\$'
INJ_TARGETS=()
[ -d "$ROOT/hooks" ] && INJ_TARGETS+=("$ROOT/hooks")
[ -d "$ROOT/skills" ] && INJ_TARGETS+=("$ROOT/skills")
if [ "${#INJ_TARGETS[@]}" -gt 0 ]; then
  grep -rInE "${EX[@]}" --include='*.sh' --include='*.py' --include='*.bash' "$INJ_HIGH" "${INJ_TARGETS[@]}" 2>/dev/null | ingest HIGH "injection" 0
  grep -rInE "${EX[@]}" --include='*.sh' --include='*.py' --include='*.bash' "$INJ_MED"  "${INJ_TARGETS[@]}" 2>/dev/null | ingest MED  "injection" 0
fi

# ── 3. PERMISSION POSTURE — over-broad allow entries / sandbox-disabling flags.
if [ "${#CONF_FILES[@]}" -gt 0 ]; then
  # Exclude "matcher" lines — a hook matcher of "*" means "fire on all tools", not a permission grant.
  grep -rInE '"Bash\(\*\)"|dangerouslyDisableSandbox|bypassPermissions|--dangerously|--no-verify' "${CONF_FILES[@]}" 2>/dev/null \
    | grep -v '"matcher"' | ingest HIGH "permission" 0
  grep -rInE '"Bash\((rm|sudo|chmod|chown|mv|dd|eval|curl|wget)[^)]*\*' "${CONF_FILES[@]}" 2>/dev/null | ingest MED  "permission" 0
fi

# ── 4. CREDENTIAL FILE PERMISSIONS — must not be group/other readable.
while IFS= read -r f; do
  [ -f "$f" ] || continue
  p="$(stat -f '%Lp' "$f" 2>/dev/null || stat -c '%a' "$f" 2>/dev/null)"
  [ -z "$p" ] && continue
  if [ $(( 8#$p & 8#077 )) -ne 0 ]; then
    rec MED "cred-perms" "$(printf '%s' "$f" | short) is mode $p (group/other can read — chmod 600)"
  fi
done < <(find "$ROOT" -maxdepth 2 \( -name '.credentials.json' -o -name '*.env' -o -name 'credentials.json' \) -type f 2>/dev/null)

# ── 5. MCP SCOPE CREEP — broad-capability servers present (informational).
if [ "${#CONF_FILES[@]}" -gt 0 ]; then
  grep -rInE '"(filesystem|computer-use|desktop-commander|shell|exec|server-commander)"|computer_use|execute_shell_command' "${CONF_FILES[@]}" 2>/dev/null | ingest INFO "mcp-scope" 0
fi

# ── 6. AGENT WRITE GRANTS — analysis-role agents granted Write/Edit (read-only rule).
if [ -d "$ROOT/agents" ]; then
  for f in "$ROOT"/agents/*.md; do
    [ -f "$f" ] || continue
    # Role gate: true analysis roles only. Avoid "spec" (matches "specialist" — many builders are "X specialist").
    head -40 "$f" | grep -qiE 'name:.*(reviewer|audit|research|explore|critic|^plan|analy)|description:.*(review|audit|research|investigat|adversari|read-only)' || continue
    # Except-aware: "All tools except Write, Edit" is the SAFE case — do not flag it.
    tline=$(head -40 "$f" | grep -iE '^[[:space:]]*(tools|allowed-tools):' | head -1)
    [ -z "$tline" ] && continue
    low=$(printf '%s' "$tline" | tr 'A-Z' 'a-z')
    grants=0
    printf '%s' "${low%%except*}" | grep -qE 'write|edit' && grants=1
    if printf '%s' "$low" | grep -qE 'all tools|\*'; then
      printf '%s' "$low" | grep -qE 'except.*(write|edit)' || grants=1
    fi
    [ "$grants" = "1" ] && rec MED "agent-grant" "$(printf '%s' "$f" | short) — analysis-role agent grants Write/Edit"
  done
fi

# ── 7. REMOTE SUPPLY CHAIN — unpinned remote code pulled at runtime (low signal).
if [ "${#INJ_TARGETS[@]}" -gt 0 ]; then
  grep -rInE "${EX[@]}" --include='*.sh' --include='*.py' --include='*.bash' \
    'npx[[:space:]]+(-y[[:space:]]+)?https?://|pip[[:space:]]+install[[:space:]]+https?://|go[[:space:]]+install[[:space:]]+[^[:space:]]+@(latest|master|main)' \
    "${INJ_TARGETS[@]}" 2>/dev/null | ingest LOW "supply-chain" 0
fi

# ── Report ────────────────────────────────────────────────────────────────────
H=$(grep -c '^HIGH' "$TMP"); M=$(grep -c '^MED' "$TMP"); L=$(grep -c '^LOW' "$TMP"); I=$(grep -c '^INFO' "$TMP")

echo "# harness-audit — $(printf '%s' "$ROOT" | short)"
echo
echo "**HIGH: $H · MED: $M · LOW: $L · INFO: $I**  _(read-only; secrets masked)_"
echo
if [ ! -s "$TMP" ]; then
  echo "_No findings. Harness config is clean against current heuristics._"
else
  for sev in HIGH MED LOW INFO; do
    n=$(grep -c "^$sev" "$TMP")
    [ "$n" -eq 0 ] && continue
    echo "## $sev ($n)"
    echo
    grep "^$sev" "$TMP" | sort -t$'\t' -k2,2 | while IFS=$'\t' read -r _ cat ev; do
      printf -- '- `[%s]` %s\n' "$cat" "$ev"
    done
    echo
  done
fi
echo "---"
echo "_Heuristic static scan. Triage before acting — expect occasional false positives_"
echo "_(a regex in a comment, a placeholder that looks like a key). See SKILL.md → Acting on results._"

if [ "$STRICT" = "1" ] && [ "$H" -gt 0 ]; then exit 2; fi
exit 0

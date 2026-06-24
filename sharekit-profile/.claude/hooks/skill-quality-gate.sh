#!/bin/bash
# skill-quality-gate.sh — PostToolUse hook (SELF-CONTAINED, no external script dep).
# Non-blocking: warns (via systemMessage) when a SKILL.md Write/Edit produces a low-quality skill.
# Derived from SkillSpector's CI-gate concept (ADR repo-list, 2026-06-24). No emoji (CLAUDE.md).
set -e

read -r HOOK_JSON || exit 0
TOOL=$(printf '%s' "$HOOK_JSON" | python3 -c "import sys,json;print(json.load(sys.stdin).get('tool_name',''))" 2>/dev/null || echo "")
FILE=$(printf '%s' "$HOOK_JSON" | python3 -c "import sys,json;print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null || echo "")

# only SKILL.md Write/Edit/MultiEdit
case "$TOOL" in Write|Edit|MultiEdit) ;; *) exit 0 ;; esac
case "$FILE" in */SKILL.md) ;; *) exit 0 ;; esac
[ -f "$FILE" ] || exit 0

warn=""
add(){ warn="${warn}${warn:+; }$1"; }

# 1. frontmatter parses as strict YAML (the 19-skill bug class)
python3 - "$FILE" <<'PY' 2>/dev/null || add "frontmatter not valid YAML (quote colon/list values)"
import re,sys,yaml
t=open(sys.argv[1]).read()
m=re.match(r'^---\n(.*?)\n---\n',t,re.S)
if not m: sys.exit(1)
yaml.safe_load(m.group(1))
PY
# 2. size > 30 lines
[ "$(wc -l < "$FILE")" -gt 30 ] || add "under 30 lines (likely incomplete)"
# 3. Done-when present
grep -iqE "done when|^##.*done.when" "$FILE" || add "no 'Done when:' criterion"
# 4. negative-rules / rationalizations / stop conditions
grep -iqE "^##.*(hard rule|negative rule|stop condition|common rationaliz)" "$FILE" || add "no Hard rules / Common Rationalizations / Stop conditions section"
# 5. backtick fence parity
[ $(( $(grep -c '^```' "$FILE") % 2 )) -eq 0 ] || add "odd code-fence count (unclosed \`\`\`)"
# 6. structured workflow (accept Phase/Step/Process/Workflow/Modes/Cycle headers OR a numbered list)
grep -iqE "^##+ .*(Phase|Step|Process|Workflow|Mode|Cycle|Recipe|Pipeline)|^\*\*Step|^[0-9]+\. " "$FILE" || add "no structured workflow (Phase/Step/Process/Modes section or numbered steps)"

if [ -n "$warn" ]; then
  name="${FILE##*/skills/}"; name="${name%%/*}"
  printf '{"systemMessage": "skill-quality-gate (%s): %s"}' "$name" "$warn"
fi
exit 0

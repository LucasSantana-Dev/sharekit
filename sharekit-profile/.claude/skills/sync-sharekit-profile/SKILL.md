---
name: sync-sharekit-profile
description: 'Sync ~/.claude/ (skills, hooks, standards, CLAUDE.md, agents) into the public sharekit profile repo, sanitize personal paths/identity, scan for secrets, show diff, and commit+push. Invoke whenever: "sync my sharekit profile", "update sharekit", "push my latest skills to sharekit", "sharekit is out of date", or after a session that significantly expanded the skill or agent library.'
user-invocable: true
auto-invoke: 'never'
metadata:
  owner: global-agents
  tier: personal
  canonical_source: ~/.claude/skills/sync-sharekit-profile
---

# sync-sharekit-profile

Mirror your live `~/.claude/` configuration into the public sharekit profile, so anyone running `npx @<github-user>/sharekit install <github-user>` gets your latest setup.

The goal is to share what's genuinely useful to others — not your personal identity or machine-specific paths. That means copying broadly, sanitizing aggressively, and excluding anything that leaks personal context even after sanitization.

---

## Variables

```bash
PROFILE_REPO="${DEV_ROOT}/sharekit"
PROFILE_DIR="$PROFILE_REPO/sharekit-profile/.claude"
SOURCE_DIR="$HOME/.claude"
```

---

## Phase 0 — Mount guard

```bash
mount | grep -q "/Volumes/External HD" || {
  echo "BLOCKED: External HD unmounted — profile repo unreachable. Mount it and retry."
  exit 1
}
```

---

## Phase 1 — Pre-sync status

Show what's changed since the last profile push:

```bash
git -C "$PROFILE_REPO" log --oneline -1
git -C "$PROFILE_REPO" status --short
```

Surface: last sync commit + date, any uncommitted profile changes already present. If there are open changes in the repo that aren't from this session, surface them and ask whether to proceed.

---

## Phase 2 — Copy source files

Copy the five source trees into the profile. `--delete` ensures removed files don't persist in the published profile. Never publish eval artifacts, worktrees, backlogs, or archives.

```bash
COMMON_EXCLUDES=(
  --exclude='.archive/'
  --exclude='*-workspace/'
  --exclude='worktrees/'
  --exclude='backlog/'
  --exclude='__pycache__/'
)

rsync -a --delete "${COMMON_EXCLUDES[@]}" "$SOURCE_DIR/skills/"    "$PROFILE_DIR/skills/"
rsync -a --delete "${COMMON_EXCLUDES[@]}" "$SOURCE_DIR/hooks/"     "$PROFILE_DIR/hooks/"
rsync -a --delete "${COMMON_EXCLUDES[@]}" "$SOURCE_DIR/standards/" "$PROFILE_DIR/standards/"
rsync -a --delete "${COMMON_EXCLUDES[@]}" "$SOURCE_DIR/agents/"    "$PROFILE_DIR/agents/"
cp "$SOURCE_DIR/CLAUDE.md"                                          "$PROFILE_DIR/CLAUDE.md"
```

After copying, count and surface what was synced:
```bash
echo "Skills: $(ls "$PROFILE_DIR/skills/" | wc -l) directories"
echo "Hooks:  $(ls "$PROFILE_DIR/hooks/" | wc -l) files"
echo "Standards: $(ls "$PROFILE_DIR/standards/" | wc -l) files"
echo "Agents: $(ls "$PROFILE_DIR/agents/" | wc -l) files"
```

**Agent vs. Skill distinction:** Agents and skills publish to separate namespaces — `~/.claude/skills/` → `sharekit-profile/skills/` and `~/.claude/agents/` → `sharekit-profile/agents/`. Always explicitly surface this in the count summary (e.g. "42 agents synced from ~/.claude/agents/, not skills/") so the caller knows where each type lives.

### Phase 2a — Agent namespace clarity

Before proceeding to sanitization, explicitly state which agents and skills were identified:

**Important:** Agent files and skill files are **not interchangeable**.
- **Skills** (e.g., `loop`, `mutation-test`, `parallel-phases`) live in `~/.claude/skills/` and sync to `sharekit-profile/skills/`
- **Agents** (e.g., `loop-engineer`, `tdd-practitioner`, `mutation-tester`, `parallel-implementer`) live in `~/.claude/agents/` and sync to `sharekit-profile/agents/`

Each agent is a **separate, independent definition** in the `agents/` namespace — not a subdirectory within `skills/`. When reporting counts in the output, explicitly note:
```
Agents: 42 files synced from ~/.claude/agents/ (published as agents/, not skills/)
```

---

## Phase 3 — Sanitize personal references

Replace machine-specific and identity references with generic placeholders. Apply to all copied files:

```bash
# Use /usr/bin/find explicitly — RTK's find wrapper silently drops compound -o predicates
/usr/bin/find "$PROFILE_DIR" -type f \( -name "*.md" -o -name "*.sh" -o -name "*.py" -o -name "*.json" -o -name "*.toml" -o -name "*-gate" -o -name "*-reminder" \) | while read f; do
  # Personal paths
  sed -i '' 's|${DEV_ROOT}|${DEV_ROOT}|g' "$f"
  sed -i '' 's|~|~|g' "$f"
  
  # GitHub identity (with and without -Dev suffix)
  sed -i '' 's|<github-user>|<github-user>|g' "$f"
  sed -i '' 's|<github-user>|<github-user>|g' "$f"
  sed -i '' 's|<github-user>|<github-user>|g' "$f"
  
  # Personal email
  sed -i '' 's|<your-name>@gmail\.com|<your-email>|g' "$f"
  
  # Homelab paths
  sed -i '' 's|/home/luk-server/homelab|${HOMELAB_ROOT}|g' "$f"
done
```

---

## Phase 4 — Dynamic exclusion (detect un-sanitizable files)

After sanitization, grep for any remaining personal references. Show actual results — don't speculate:

```bash
PERSONAL_REFS=$(grep -rl \
  "<github-user>\|<github-user>\|<your-name>\|~\|luk-server" \
  "$PROFILE_DIR" --include="*.md" --include="*.sh" --include="*.py" 2>/dev/null)

echo "Phase 4 scan: $(echo "$PERSONAL_REFS" | grep -c . || echo 0) files with residual personal refs"
```

For each file found:
- If it's a skill's SKILL.md → remove the entire skill directory, log: `Excluded (personal-ref): skills/<name>/`
- If it's an agent file → remove the agent file, log: `Excluded (personal-ref): agents/<name>.md`
- If it's a reference/asset within a skill → remove the file, log: `Excluded (personal-ref): <path>`

Report the full exclusion list, even if empty: `Phase 4: 0 files excluded` is a valid and useful result.

---

## Phase 5 — Secret scan

Run the local sharekit scanner (the published npm package doesn't include `scan` yet):

```bash
cd "$PROFILE_REPO"
npx tsx src/index.ts scan ./sharekit-profile 2>&1
```

Classify findings by severity:
- **HIGH** (API keys, private keys, real bearer tokens): stop, show findings, ask whether to fix or `--force`
- **MED/LOW** (env-var names like `CLOUDFLARE_API_TOKEN='your-token'`, template placeholders, example paths): surface them, don't block — these are documentation examples

Report as: `CLEAN (HIGH: 0, MED: 0, LOW: N)` — use CLEAN, not PASS.

---

## Phase 6 — Diff + confirmation gate

Show what actually changed:

```bash
git -C "$PROFILE_REPO" diff --stat
git -C "$PROFILE_REPO" diff --name-only | head -30
```

Emit a summary table:
```
Changes ready to commit:
  Skills:    N added, N updated, N removed
  Hooks:     N changed
  Standards: N changed
  Agents:    N added, N updated, N removed
  Excluded:  <list each item with reason, e.g. "skills/sync-memories/ (personal-ref)">
```

Then emit:
```
Proceed to commit? (10s without objection = yes)
```

Wait. If user objects or requests changes, revise. Otherwise proceed.

---

## Phase 7 — Commit and push

```bash
cd "$PROFILE_REPO"
git add sharekit-profile/
git commit -m "chore(profile): sync skills, hooks, standards, agents — $(date +%Y-%m-%d)"
git push
```

After push, report:
```
Pushed: <sha>
Install: npx @<github-user>/sharekit install <github-user>
```

---

## Reconciliation

Always output this block, even on stop/failure:

```
SYNC-SHAREKIT-PROFILE
  Source:       ~/.claude/ (skills: N dirs, hooks: N files, standards: N files, agents: N files)
  Profile repo: <last-commit-sha> (<date>) → <new-sha | pending | unchanged>
  Excluded:     <each item with reason — "none" if clean>
                  skills/foo/ — personal-ref (luk-server path)
                  agents/bar.md — personal-ref (email)
  Scan:         CLEAN (HIGH: 0, MED: 0, LOW: N)
  Diff:         N files changed, N added, N removed
  Status:       Committed and pushed | Blocked (<reason>) | Pending confirmation

Install: npx @<github-user>/sharekit install <github-user>
```

---

## Stop conditions

- External HD not mounted → halt at Phase 0
- HIGH-severity scan findings → halt at Phase 5, await human decision
- Profile repo has unexpected uncommitted changes → surface and confirm before overwriting
- `git push` fails → surface error, leave commit local

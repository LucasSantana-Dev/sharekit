---
name: docs-sync
description: Detect and reconcile drift between canonical source-of-truth docs/skills/standards and their mirrored copies (~/.claude-env, ~/.claude, ~/.agents). Resolves direction, applies the change, commits to claude-env, and reindexes affected RAG chunks. Use after editing any file that exists in multiple locations.
user-invocable: true
argument-hint: "[<path>] [--direction canonical|newest|interactive]"
metadata:
  owner: global-agents
  tier: contextual
  canonical_source: ~/.claude/skills/docs-sync
---

# Docs Sync

Skills and standards live in three places at once:

- `~/.claude-env/<dir>/` — git-tracked source of truth, propagates via `sync pull`
- `~/.claude/<dir>/` — what the active session loads
- `~/.agents/<dir>/` — what some agent skills consume

Editing one without the others creates silent drift. This skill detects drift, picks the
correct direction, applies it, commits to claude-env, and reindexes the RAG chunks
affected.

## Use When

- After editing any skill (`SKILL.md`), standard, hook, or settings file
- Before committing claude-env to ensure all three roots agree
- Periodically as a hygiene sweep to catch drift introduced by `sync pull` conflicts
- When a session loads a stale skill version that doesn't match the canonical source

## Do Not Use When

- The file genuinely only exists in one location (e.g., session-only memory files)
- Editing project repo files unrelated to the dotfile ecosystem

## Inputs / Prereqs

- `~/.claude-env` is a git repo (it is)
- Optional `<path>` arg to scope to one file/dir; otherwise scans known sync roots
- `--direction`:
  - `canonical` (default): claude-env wins; overwrite ~/.claude and ~/.agents
  - `newest`: latest mtime wins, propagate to the other two
  - `interactive`: show diff and ask which side wins per file

---

## Workflow

### 1. Define the sync map

The skill scans two ecosystems by default. Choose with the optional first arg
(`claude-env` | `forgekit` | `all`, default `all`).

#### Ecosystem A: claude-env (dotfiles)

```
canonical: ~/.claude-env/skills/<name>/SKILL.md
mirrors:   ~/.claude/skills/<name>/SKILL.md
           ~/.agents/skills/<name>/SKILL.md   (manual mirror, not in `sync` binary)

canonical: ~/.claude-env/standards/<name>.md
mirrors:   ~/.claude/standards/<name>.md
           ~/.agents/skills/standards/<name>.md  (manual mirror)

canonical: ~/.claude-env/hooks/<name>
mirrors:   ~/.claude/hooks/<name>

canonical: ~/.claude-env/config/{CLAUDE.md, RTK.md, mcp.json}
mirrors:   ~/.claude/{CLAUDE.md, RTK.md, .mcp.json}

canonical: ~/.claude-env/settings/shared.json + machines/<host>.json
mirrors:   ~/.claude/settings.json (deep-merged via apply_settings)

canonical: ~/.claude-env/rag-index/<script>
mirrors:   ~/.claude/rag-index/<script>
```

Read the active sync logic from `~/.claude-env/bin/sync` (the binary, not install.sh)
and the `.sync.log` to confirm. Do not invent new sync targets; reconcile only what
the binary already manages, plus the `~/.agents/` manual mirror that this session
maintains by hand.

#### Ecosystem B: forgekit (mirrored content locations)

Forgekit has two distinct content-sync axes — this skill owns axis 2 only;
defer axis 1 to `adt-bilingual-readme-sync`.

**Axis 1 — Bilingual translation parity** (EN ↔ pt-BR):
- `<repo>/README.md` ↔ `<repo>/README.pt-BR.md`
- `<repo>/docs/AI_ASSISTED_DEVELOPMENT_SUMMARY.md` ↔ `<repo>/docs/AI_ASSISTED_DEVELOPMENT_SUMMARY.pt-BR.md`
- `<repo>/packages/<pkg>/README.md` ↔ `<repo>/packages/<pkg>/README.pt-BR.md`
- → **Defer to `/adt-bilingual-readme-sync`** — content here is *translated*, not
  *copied*; sha matching is the wrong test. This skill should detect these pairs
  exist but skip them with a note.

**Axis 2 — Mirrored locations** (same content in two paths, this skill's job):
- `packages/core/rules/<file>` ↔ `locales/<lang>/rules/<file>`
- `packages/core/implementations/<x>/<file>` ↔ `locales/<lang>/implementations/<x>/<file>`

For axis 2, canonical is `packages/core/` and mirrors live under `locales/<lang>/`.
For non-pt-BR mirrors (e.g., `locales/en/`), the file should be byte-identical to
canonical. For pt-BR mirrors of files that are themselves translations (e.g.,
`GEMINI.pt-BR.md`), only check existence, not content (the content is a translation
maintained separately).

Forgekit map specifically (auto-detected from filesystem; do not hardcode):
```bash
FORGEKIT="${DEV_ROOT}/forgekit"
# Axis-2 canonical roots (only when forgekit is in scope):
#   $FORGEKIT/packages/core/rules/
#   $FORGEKIT/packages/core/implementations/<x>/
# Axis-2 mirror roots:
#   $FORGEKIT/locales/<lang>/rules/         (lang != source lang)
#   $FORGEKIT/locales/<lang>/implementations/<x>/
```

### 2. Detect drift

For each (canonical, mirrors) tuple in scope:

```bash
# Compare by content hash, not mtime
sha_canonical=$(sha256sum "$CANONICAL" 2>/dev/null | cut -d' ' -f1)
for m in "${MIRRORS[@]}"; do
  if [ -f "$m" ]; then
    sha_mirror=$(sha256sum "$m" | cut -d' ' -f1)
    [ "$sha_canonical" != "$sha_mirror" ] && echo "DRIFT: $m"
  else
    echo "MISSING: $m"
  fi
done
```

Categorize each drift:
- **MISSING-MIRROR** — exists in canonical, missing in mirror
- **MISSING-CANONICAL** — exists in mirror, missing in canonical (uncommon — usually
  means the file was created in claude/agents but never promoted)
- **CONTENT-DIFFERS** — both exist, hashes differ
- **STALE-MIRROR** — mirror is older than canonical (subset of CONTENT-DIFFERS)
- **STALE-CANONICAL** — canonical is older than the mirror (this is what you want to
  catch when editing claude/agents directly)

### 3. Resolve direction

For each drift:

**`--direction canonical` (default, recommended):**
- CONTENT-DIFFERS / STALE-MIRROR → copy canonical → mirror
- MISSING-MIRROR → copy canonical → mirror
- MISSING-CANONICAL → prompt the user (this is unusual; default is to promote
  mirror → canonical, but ask first)
- STALE-CANONICAL → prompt: "mirror is newer than canonical; promote mirror to
  canonical?" (yes for normal edits, no for accidental local-only changes)

**`--direction newest`:**
- Whichever side has the newer mtime wins; propagate to the other two
- Risk: if a `sync pull` overwrote a local edit, newest will be the pull artifact, not
  your edit. Prefer `canonical` or `interactive`.

**`--direction interactive`:**
- Show `diff` and prompt per file

### 4. Apply

```bash
# Copy in the chosen direction
cp "$SOURCE" "$DEST"

# For settings.json (key-merge, not overwrite), invoke the existing apply_settings logic
# from install.sh — do not hand-roll JSON merging
~/.claude-env/install.sh --apply-settings-only
```

After all copies, run a final hash check to confirm zero drift remains.

### 5. Commit canonical changes

For each ecosystem in scope, commit to its own repo (claude-env and forgekit are
separate repos with their own remotes):

```bash
# claude-env changes
cd ~/.claude-env
git status --short
git add -A && git commit -m "Sync: <summary>" && git push

# forgekit changes (only if forgekit was in scope and has drift)
cd "${DEV_ROOT}/forgekit"
git status --short
git add -A && git commit -m "Sync mirrored locations: <summary>" && git push
```

Skip commit step for an ecosystem if only mirrors were updated to match an
already-committed canonical. Never commit forgekit changes from inside claude-env or
vice versa.

### 6. Reindex affected RAG chunks

```bash
cd ~/.claude/rag-index
venv/bin/python build.py --incremental <list of all touched files in ~/.claude/>
```

The RAG index points at `~/.claude/` paths, not `~/.claude-env/`. Reindex only the
mirrors there.

### 7. Report

```
DOCS SYNC REPORT

Scanned: 47 sync pairs
Drift found: 3
  CONTENT-DIFFERS:  skills/test-cleanup/SKILL.md  (mirror older by 2 commits)
  STALE-CANONICAL:  standards/testing.md          (mirror newer — promoted)
  MISSING-MIRROR:   skills/mutation-test/SKILL.md (added to ~/.claude/)

Direction: canonical (default)
Actions:
  ✓ Copied canonical → ~/.claude/skills/test-cleanup/SKILL.md
  ✓ Promoted ~/.agents/skills/standards/testing.md → canonical, then synced down
  ✓ Created ~/.claude/skills/mutation-test/SKILL.md from canonical

Commit: 9a4594f "Sync: testing.md, test-cleanup, mutation-test"
RAG: reindexed 4 files, 11 chunks

Drift after sync: 0
```

---

## Outputs / Evidence

- Drift report (before)
- Per-file actions taken with direction reasoning
- Commit hash if claude-env was touched
- Reindex summary
- Final drift count (must be 0)

## Failure / Stop Conditions

- claude-env has uncommitted local changes when this skill is invoked → stop and ask
  the user to commit or stash first; do not auto-stash
- `sync pull` is currently running (check `~/.claude-env/.sync.log` last line) → wait
  or stop
- A direction-conflict the skill cannot resolve (e.g., both sides edited since the
  last sync, content meaningfully diverges) → drop to `interactive` for that file even
  if the global flag was `canonical`
- Network failure on push → keep local commit, report blocker, do not retry blindly

## Memory Hooks

- Read memory for any per-file sync overrides (e.g., "skills/foo is intentionally
  divergent in ~/.agents")
- Write memory only if a recurring drift pattern emerges (e.g., "settings.json keeps
  drifting because hook X writes to it") so future sessions know to investigate the
  source rather than just sync

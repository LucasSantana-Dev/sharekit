# sharekit

![ShareKit banner](https://i.ibb.co/NgdM23Kz/sharekit-card.png)

**Share your entire AI coding setup in one command.**

Distribute your CLAUDE.md, skills, cursorrules, and dotfiles to team members, colleagues, or the public. One command to install. One command to rollback. Built for Claude Code, Cursor, Windsurf, Codex, and more.

[![npm version](https://img.shields.io/npm/v/@lucassantana/sharekit.svg)](https://www.npmjs.com/package/@lucassantana/sharekit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)

---

## Quick Start

Install a profile from GitHub in seconds:

```bash
npx @lucassantana/sharekit install <github-user>
```

That's it. sharekit will:
- Fetch the profile from `github.com/<github-user>/sharekit-profile`
- Show you a preview of changes (files, counts, paths)
- Ask for confirmation
- Back up existing files before overwriting
- Apply the configuration

**Undo anytime:**

```bash
npx @lucassantana/sharekit rollback <github-user>
```

---

## Core Commands

| Command | Purpose |
|---------|---------|
| `install <user>` | Install a profile and apply its configuration |
| `preview <user>` | See what would change without applying anything |
| `rollback <user>` | Restore the last backup for a profile |
| `list` | View all installed profiles with versions and dates |
| `update <user>` | Sync an installed profile to its latest version |
| `search [keyword]` | Discover published profiles on GitHub |
| `init [skills...]` | Create a profile from your current `~/.claude` |
| `scan` | Detect secrets before publishing a profile |

---

## How It Works

### What Gets Synced

sharekit copies files from a profile into your local environment:

- **`claude/`** → `~/.claude/` — CLAUDE.md, skills, settings, hooks, standards
- **`cursor/`** → `~/.cursor/` — Cursor IDE configuration
- **`shared/`** → `~/` — Root dotfiles and shared config

Files are copied as-is (TOML, text, binary). Use `preview` to spot conflicts before applying.

### Pinning Versions

Track a specific version or branch instead of `HEAD`:

```bash
npx @lucassantana/sharekit install <github-user>@v1.0     # tag
npx @lucassantana/sharekit install <github-user>@stable   # branch
```

Update only works on HEAD-tracked profiles. Pinned refs are skipped.

### Hooks & Safety

Settings files (`.claude/settings.json`) that define hooks are **flagged but not installed by default**—hooks run shell commands and require explicit trust. After reviewing a profile in `preview`, install hooks with:

```bash
npx @lucassantana/sharekit install <github-user> --include-hooks
```

You'll get a second confirmation before the settings file is written.

---

## Discover Profiles

GitHub is the registry. Find published profiles by searching for repos named `sharekit-profile`:

```bash
npx @lucassantana/sharekit search              # list all profiles
npx @lucassantana/sharekit search react        # filter by keyword
```

Each result includes the one-liner to install it.

Manage installed profiles:

```bash
npx @lucassantana/sharekit list        # see installed profiles + versions
npx @lucassantana/sharekit update user  # sync to latest (HEAD-tracked only)
```

---

## Publish Your Own Profile

Create a GitHub repository named **`sharekit-profile`** with this structure:

```
sharekit-profile/
├── sharekit.toml
├── .gitignore
├── claude/           (→ ~/.claude/)
│   ├── CLAUDE.md
│   ├── skills/
│   │   ├── skill-1/SKILL.md
│   │   └── skill-2/SKILL.md
│   ├── settings.json
│   └── standards/
├── cursor/           (→ ~/.cursor/)
│   └── settings.json
└── shared/           (→ ~/)
    └── .cursorrules
```

### Profile Metadata: `sharekit.toml`

```toml
[profile]
name = "My Setup"
version = "1.0.0"
description = "Claude Code + Cursor config with custom skills and standards"
```

Subdirectories automatically mirror to their targets. Files in `claude/` → `~/.claude/`, etc.

### Scaffold from Your Config

Bootstrap a profile repo from your current setup:

```bash
npx @lucassantana/sharekit init                    # copy CLAUDE.md + all skills
npx @lucassantana/sharekit init skill-1 skill-2   # copy specific skills only
```

This creates a ready-to-push `sharekit-profile/` directory.

### Security Check Before Publishing

Always scan for secrets before pushing:

```bash
npx @lucassantana/sharekit scan ./sharekit-profile
```

The scanner detects:
- **High-severity** (blocks): Private keys, AWS/GitHub/Slack/Google API tokens, bearer tokens
- **Medium/Low** (warns): Sensitive env variable names, home-path leaks

Override a block (after manual review) with:

```bash
npx @lucassantana/sharekit scan ./sharekit-profile --force
```

**You are responsible** for ensuring no real secrets escape. The scanner is best-effort. Always review the profile and `.gitignore` sensitive files before `git push`.

---

## Supported Tools

sharekit works with any tool that stores config in `~/`, `~/.claude/`, `~/.cursor/`, or similar:

- ✅ **Claude Code** — CLAUDE.md, skills, settings, hooks, standards
- ✅ **Cursor** — settings.json, keyboard shortcuts
- ✅ **Windsurf** — configuration
- ✅ **Codex** — setup files
- ✅ **VS Code** — via `shared/` dotfiles
- ✅ **Neovim** — via `shared/` dotfiles
- ✅ Any tool with home-relative paths

---

## Security Model

- **Hooks are never auto-installed.** Settings with hooks are flagged in `preview` and skipped. Merge them manually after reviewing.
- **Preview before applying.** `sharekit preview` shows exact diffs (new/changed/unchanged counts, file paths) — inspect before any write.
- **Everything is backed up.** Changed files are saved to `~/.sharekit/backups/<user>-<timestamp>/` before apply. `rollback` restores them instantly.

For the full trust model, path assumptions, and responsible disclosure policy, see [SECURITY.md](SECURITY.md).

---

## Status & Roadmap

- ✅ Install, preview, rollback, update
- ✅ Profile discovery via GitHub
- ✅ Version pinning (tags, branches)
- ✅ Backup & restore
- ✅ Hook safety gating
- ✅ Secret scanning
- ⏳ Multi-tool merge logic (planned)

File-copy only for now—no smart merging. Use `preview` to spot conflicts.

---

## License

[MIT](LICENSE) — Share freely.

---

Made with ❤️ by Lucas Santana. [Contribute on GitHub](https://github.com/LucasSantana-Dev/sharekit).

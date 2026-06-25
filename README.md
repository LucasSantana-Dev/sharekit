# sharekit

![ShareKit banner](https://i.ibb.co/NgdM23Kz/sharekit-card.png)

Share your AI coding setup — CLAUDE.md, skills, cursorrules, and dotfiles — with anyone. One command to install, one to rollback.

## Install

```bash
npx @lucassantana/sharekit install <github-user>
```

Fetches a profile from `github.com/<github-user>/sharekit-profile`, previews the changes (colors + counts), asks for confirmation, backs up any files it will overwrite, and applies them. Undo with `sharekit rollback <github-user>`.

```bash
npx @lucassantana/sharekit preview <github-user>   # see what would change, apply nothing
npx @lucassantana/sharekit rollback <github-user>  # restore the last backup
```

## Discover profiles

GitHub is the registry — find published profiles (any repo named `sharekit-profile`):

```bash
npx @lucassantana/sharekit search           # list all published profiles
npx @lucassantana/sharekit search react     # filter by keyword
```

Each result shows the one-liner to install it.

### Pin to a version

Install a specific tag or branch of a profile instead of the latest:

```bash
npx @lucassantana/sharekit install <github-user>@v1.0     # a tag
npx @lucassantana/sharekit install <github-user>@stable   # a branch
```

Plain `install <github-user>` always tracks the profile's default branch (HEAD).

## Manage installed profiles

List all installed profiles with version, commit, and date applied:

```bash
npx @lucassantana/sharekit list
```

Output:

```
  Installed profiles:

  user1@HEAD      v1.0.2    abc1234   Jun 15, 2025
  user2@v1.0     (no version) ?        Jun  1, 2025
```

Update an installed profile (tracked profiles only; pinned refs are no-ops):

```bash
npx @lucassantana/sharekit update <github-user>
```

Shows what changed, asks for confirmation, and applies. Pinned refs (tags, commit SHAs) do not update.

### Hooks

A profile's `.claude/settings.json` can define hooks that run shell commands, so it is **never installed by default** — it's flagged in the preview and skipped. To opt in after reviewing it, pass `--include-hooks` (you'll get a second explicit confirmation before it's written):

```bash
npx @lucassantana/sharekit install <github-user> --include-hooks
```

## Publish your own profile

Create a GitHub repo named **`sharekit-profile`** with this structure:

```
sharekit-profile/
├── sharekit.toml
├── claude/           (→ ~/.claude/)
├── cursor/           (→ ~/.cursor/)
└── shared/           (→ ~/)
```

**sharekit.toml** example:

```toml
[profile]
name = "My Setup"
version = "1.0"
description = "Claude + Cursor config with custom skills"
```

Subdirectories mirror into their corresponding roots: files in `claude/` go to `~/.claude/`, files in `cursor/` to `~/.cursor/`, and files in `shared/` to `~/`.

Run `sharekit init [skill...]` to scaffold a profile from your `~/.claude` — copies your `CLAUDE.md` and any named skills into a ready-to-push `sharekit-profile/`.

### Safety

Before pushing your profile to a public GitHub repo, use `sharekit scan` to check for secrets:

```bash
npx @lucassantana/sharekit scan ./sharekit-profile
```

The scanner detects private keys, AWS/GitHub/Slack/Google API tokens, bearer tokens, sensitive environment variables (`SECRET|TOKEN|PASSWORD|API_KEY|APIKEY|ACCESS_KEY`), and home-path leaks. High-severity findings (keys/tokens) **block the `init` and `scan` commands with a non-zero exit**. Medium/low findings (e.g., env-var names, paths) warn only.

Override a block with `--force` if you've manually reviewed and redacted the findings:

```bash
npx @lucassantana/sharekit scan ./sharekit-profile --force
```

Always review the profile and `.gitignore` sensitive files before `git push`. The scanner is best-effort; you are responsible for ensuring no real secrets escape.

## Security

- **Hooks are never auto-installed.** Settings containing hooks (`.claude/settings.json`) are flagged in the preview and skipped. Merge them manually after reviewing.
- **Preview before applying.** `sharekit preview` shows the exact diff (new/changed/unchanged counts and paths) — trust gate before any write.
- **Everything is backed up.** Before applying, sharekit saves changed files to `~/.sharekit/backups/<user>-<timestamp>/`. Rollback restores them.

See [SECURITY.md](SECURITY.md) for the full trust model, path assumptions, and responsible disclosure policy.

## Status

- No registry/discovery yet — GitHub is the registry. Search `sharekit-profile` repos by topic or follow the convention.
- File-copy only; no multi-tool merge logic. TOML, text, and binary files are copied as-is. Use `sharekit preview` to spot conflicts.

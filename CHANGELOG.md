# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.2] - 2026-08-02

### Fixed

- Release workflow's `publish` job pinned Node 20 for the npm publish step; npm's own engine floor moved to `^22.22.2 || ^24.15.0 || >=26.0.0`, so `npm install -g npm@latest` failed with `EBADENGINE` and no npm publish happened for v0.6.1 (PyPI, GitHub Release binaries, and the Homebrew tap all published fine on that tag). Bumped to Node 22, already covered by CI's test matrix.

## [0.6.1] - 2026-08-02

### Changed

- Bundled `sharekit-profile/` content refreshed from source (first sync since 2026-06-24): skill catalog pruned from ~103 to 47 folders via consolidation (retired/archived skills removed, e.g. duplicate frontend-UI skills merged into `repaint`), hooks/standards/agents updated to current state. No CLI code changes.

## [0.6.0] - 2026-07-03

### Added

- Profile support for `opencode/` (→ `~/.config/opencode/`) and `gjc/` (→ `~/.gjc/`) directories, mirrored alongside `claude/`, `cursor/`, and `shared/`.
- `--include-dotfiles` flag for `install`/`update`: executable-on-load dotfiles in `shared/` (`.zshrc`, `.bashrc`, and 9 others) are now skipped by default and flagged in preview — same trust model as `--include-hooks` (#145).
- `install` now errors on profiles containing no tool directories instead of silently applying nothing (#151).
- `npm run bump -- X.Y.Z` — atomically updates package.json, `src/index.ts` VERSION, and sharekit-pip/pyproject.toml (#146).
- `init` scaffolds `opencode/` and `gjc/` directories, copying a config from the source machine when present (#150).
- Usage errors now explain that `<user>` is a GitHub username hosting a `sharekit-profile` repo, with an example (#152).

### Fixed

- PID lock is now actually acquired by `install`/`update`/`rollback`/`uninstall` (was dead code); liveness check uses portable `process.kill(pid, 0)` (#148).
- Secret scanner Google API key pattern widened from exactly 35 to 30–40 chars (#153).

### Security

- Release workflow validates the git tag against all three version sources before any publish job runs (#147).
- Third-party GitHub Actions pinned to commit SHAs; dependabot now tracks the `github-actions` ecosystem (#149).

## [0.5.0] - 2026-06-25

### Added

- `sharekit update <user> --additive` — update mode that only adds new files from the upstream profile; locally-modified files are preserved and never overwritten. Reports skipped count in output.

## [0.3.0] - 2026-06-23

### Added

- `sharekit search [query]` — discover published profiles (queries GitHub for repos named `sharekit-profile`; GitHub is the registry, no server). Each result shows its install one-liner.

## [0.2.1] - 2026-06-23

### Security

- Harden git invocations: `fetchProfile` now uses `execFileSync` with array args and a `--` separator instead of building shell strings, so a profile name or `@<ref>` can no longer inject shell commands or be parsed as a git option (#20).

### Fixed

- Flags now work in any position — `install --include-hooks <user>@<ref>` no longer captures the flag as the username (#21).

### Changed

- README documents `install <user>@<ref>` pinning and `--include-hooks`; ADR-0001 no longer overstates git tags as immutable (#23, #24).
- Internal: install/rollback core (`applyProfile`/`restoreBackup`) accepts an injectable state dir; integration test now exercises the real helpers; added `pruneBackups` and `--include-hooks` tests (#22).

## [0.2.0] - 2026-06-23

### Added

- Profile version pinning: `sharekit install <user>@<ref>` resolves a git tag or branch (ADR-0001)
- `init` now scaffolds `cursor/` and `shared/` alongside `claude/`
- `--include-hooks` flag to opt into installing `settings.json` (gated behind an extra confirmation)
- Automatic backup pruning — keeps the 5 most recent backups per profile

### Fixed

- Skip symlinks when copying a profile (no following into arbitrary files; dir-links no longer `EISDIR`)
- Preserve the executable bit when copying files (e.g. a skill's `toggle.sh`)
- Friendlier errors for missing `git` and malformed `sharekit.toml`
- Rollback recreates parent directories removed since install

### Changed

- CI runs a Node 20/22 matrix with a Prettier format gate; tag-triggered npm release workflow

## [0.1.0] - 2026-06-23

### Added

- Initial CLI release with core features:
  - `sharekit install <github-user>` to install a profile from a GitHub repo
  - `sharekit preview <github-user>` to preview changes without applying them
  - `sharekit rollback <github-user>` to restore the last backup
  - `sharekit init [skill...]` to scaffold a profile from your `~/.claude`
- Support for TOML-based profile configuration (`sharekit.toml`)
- Multi-directory profile structure: `claude/`, `cursor/`, and `shared/` subtrees
- Color-coded preview output showing new, changed, and unchanged file counts
- Backup system that saves overwritten files before applying changes
- Hook safety: `.claude/settings.json` files with hooks are flagged and skipped
- File-copy semantics for TOML, text, and binary files

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Ref pinning support for locked profile versions
- Init cursor mode and shared mode for faster profile setup
- `--include-hooks` flag to optionally include hook configurations during install
- Backup pruning to clean old profile backups

### Fixed

- Symlink files are now skipped during copy to avoid dangling references
- Executable bit (chmod +x) is preserved on shell scripts and binaries
- More friendly error messages for git and TOML parsing failures
- Rollback now creates intermediate directories if needed

## [0.1.0] - 2024-XX-XX

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

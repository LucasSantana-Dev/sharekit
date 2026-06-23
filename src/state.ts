import * as fs from 'node:fs';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';
import kleur from 'kleur';
import { Dirs, DEFAULT_DIRS } from './paths.js';

export interface InstallRecord {
  user: string;
  ref: string;
  commit: string | null; // null if rev-parse fails
  version?: string;
  appliedAt: string; // ISO timestamp
}

// Record an installation: resolve commit SHA, write to state file (keyed by user)
export function recordInstall(
  user: string,
  profileDir: string,
  ref: string,
  version: string | undefined,
  dirs: Dirs = DEFAULT_DIRS
): void {
  let commit: string | null = null;
  try {
    commit = execFileSync('git', ['-C', profileDir, 'rev-parse', 'HEAD'], {
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 30_000,
    }).trim();
  } catch {
    // best-effort: if rev-parse fails (offline cache, odd state), record null
  }

  const record: InstallRecord = {
    user,
    ref,
    commit,
    version,
    appliedAt: new Date().toISOString(),
  };

  // Read existing state or create empty map
  const stateFile = path.join(dirs.state, 'installed.json');
  let installed: Record<string, InstallRecord> = {};
  if (fs.existsSync(stateFile)) {
    try {
      installed = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    } catch {
      // corrupt state file; overwrite with fresh state
      installed = {};
    }
  }

  // Update or insert this user's record
  installed[user] = record;

  // Write back
  fs.mkdirSync(dirs.state, { recursive: true });
  fs.writeFileSync(stateFile, JSON.stringify(installed, null, 2));
}

// Read the install state file (returns a map keyed by user, or empty object if not found)
// If the file exists but is corrupt, warn to stderr to help the user diagnose the issue.
export function readInstalled(dirs: Dirs = DEFAULT_DIRS): Record<string, InstallRecord> {
  const stateFile = path.join(dirs.state, 'installed.json');
  if (!fs.existsSync(stateFile)) return {};
  try {
    return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch (e) {
    console.error(
      `${kleur.yellow('⚠  install state is corrupt')} — ${stateFile}\n` +
        `  ${kleur.dim(`Reset: rm ${stateFile}`)}  to rebuild from scratch.`
    );
    return {};
  }
}

// List installed profiles with version, short commit SHA, and applied date
export function list(dirs: Dirs = DEFAULT_DIRS): void {
  const installed = readInstalled(dirs);
  const records = Object.values(installed);

  if (records.length === 0) {
    console.log(kleur.dim('\n  Nothing installed yet.\n'));
    return;
  }

  console.log(kleur.bold(`\n  Installed profiles:\n`));
  for (const record of records) {
    const shortSha = record.commit ? record.commit.slice(0, 7) : '?';

    // Guard against invalid appliedAt timestamps
    let dateStr = '(unknown)';
    if (record.appliedAt) {
      const date = new Date(record.appliedAt);
      if (!Number.isNaN(date.getTime())) {
        dateStr = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
    }

    const version = record.version ?? '(no version)';
    console.log(
      `  ${kleur.cyan(`${record.user}@${record.ref}`)}  ${version}  ${kleur.dim(shortSha)}  ${kleur.dim(dateStr)}`
    );
  }
  console.log();
}

// Check if a ref is an immutable ref (tag or commit hash).
// Only return true for HIGH-CONFIDENCE immutable cases. Bias toward mutable for ambiguous names
// because the best-effort git pull (from #52a) harmlessly no-ops on detached checkouts.
// Wrongly skipping an update to a real branch (the current risk) is worse than attempting
// a redundant pull on a tag (which fails harmlessly).
export function isImmutableRef(ref: string): boolean {
  // Hex commit SHA (7-40 hex chars) is definitely immutable
  if (/^[a-f0-9]{7,40}$/.test(ref)) return true;
  // Anchored dotted semver: v1.0.0, 1.2, v2.0, etc. Excludes v2-wip, v3-feature, release-2
  if (/^v?\d+\.\d+(\.\d+)*$/.test(ref)) return true;
  // Everything else (branches, loose tags, ambiguous names) → mutable. Pull is safe; no-ops on detached.
  return false;
}

// Helper: write metadata.json to backup directory
// Only writes if metadata has keys
export function writeMetadata(
  backupDir: string,
  metadata: { sourceVersion?: string; sourceCommit?: string | null }
): void {
  if (Object.keys(metadata).length === 0) {
    return;
  }
  fs.writeFileSync(path.join(backupDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
}

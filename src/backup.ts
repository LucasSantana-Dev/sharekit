import * as fs from 'node:fs';
import * as path from 'node:path';
import { STATE, cp, Dirs, DEFAULT_DIRS } from './paths.js';

export interface BackupInfo {
  stamp: string;
  fileCount: number;
}

export interface RestoreMetadata {
  filesRestored: number;
  filesRemoved: number;
  sourceVersion?: string;
  sourceCommit?: string | null;
}

export type Status = 'new' | 'changed' | 'same';

// Helper: read metadata.json from backup directory
// Returns {sourceVersion?, sourceCommit?} or {} if missing/unparseable
export function readMetadata(backupDir: string): {
  sourceVersion?: string;
  sourceCommit?: string | null;
} {
  const metadataPath = path.join(backupDir, 'metadata.json');
  if (!fs.existsSync(metadataPath)) {
    return {};
  }
  try {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    return {
      sourceVersion: metadata.sourceVersion,
      sourceCommit: metadata.sourceCommit,
    };
  } catch {
    // If metadata can't be read, return empty object
    return {};
  }
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

// Prune backups, keeping only the most recent 5
export function pruneBackups(user: string, state = STATE): void {
  const root = path.join(state, 'backups');
  if (!fs.existsSync(root)) return;

  const dirs = fs
    .readdirSync(root)
    .filter((e) => e.startsWith(user + '-'))
    .sort();

  if (dirs.length > 5) {
    const toRemove = dirs.slice(0, dirs.length - 5);
    for (const dir of toRemove) {
      fs.rmSync(path.join(root, dir), { recursive: true, force: true });
    }
  }
}

export function listBackups(user: string, state = STATE): BackupInfo[] {
  const root = path.join(state, 'backups');
  if (!fs.existsSync(root)) return [];

  const dirs = fs
    .readdirSync(root)
    .filter((e) => e.startsWith(user + '-'))
    .sort();

  return dirs
    .reverse() // reverse to get newest first
    .map((dir) => {
      const stamp = dir.slice(user.length + 1);
      const appliedPath = path.join(root, dir, 'applied.json');
      let fileCount = 0;
      try {
        const applied = JSON.parse(fs.readFileSync(appliedPath, 'utf8'));
        fileCount = (applied as Array<unknown>).length;
      } catch {
        // If we can't read applied.json, default to 0
      }
      return { stamp, fileCount };
    });
}

export function restoreBackupInternal(
  user: string,
  backupDir: string,
  dirs: Dirs = DEFAULT_DIRS
): RestoreMetadata {
  const applied: { dest: string; status: Status }[] = JSON.parse(
    fs.readFileSync(path.join(backupDir, 'applied.json'), 'utf8')
  );

  let filesRestored = 0;
  let filesRemoved = 0;

  for (const a of applied) {
    if (a.status === 'new') {
      fs.rmSync(a.dest, { force: true }); // ponytail: leaves empty parent dirs; harmless
      filesRemoved++;
    } else {
      const src = path.join(backupDir, path.relative(dirs.home, a.dest));
      if (fs.existsSync(src)) {
        fs.mkdirSync(path.dirname(a.dest), { recursive: true }); // dest dir may have been removed since install
        cp(src, a.dest);
        filesRestored++;
      }
    }
  }

  // Load metadata (source version/commit) if available
  const sourceBackupMetadata = readMetadata(backupDir);
  const sourceVersion = sourceBackupMetadata.sourceVersion;
  const sourceCommit = sourceBackupMetadata.sourceCommit;

  return { filesRestored, filesRemoved, sourceVersion, sourceCommit };
}

export function restoreBackupToStamp(user: string, stamp: string, dirs: Dirs = DEFAULT_DIRS): void {
  const root = path.join(dirs.state, 'backups');
  const backupDir = path.join(root, `${user}-${stamp}`);

  if (!fs.existsSync(backupDir)) {
    throw new Error(`No backup found for ${user} with stamp ${stamp}.`);
  }

  restoreBackupInternal(user, backupDir, dirs);
}

export function restoreBackup(user: string, dirs: Dirs = DEFAULT_DIRS): RestoreMetadata {
  const root = path.join(dirs.state, 'backups');
  const last = fs.existsSync(root)
    ? fs
        .readdirSync(root)
        .filter((e) => e.startsWith(user + '-'))
        .sort()
        .pop()
    : undefined;
  if (!last) throw new Error(`No backup for ${user}.`);

  const dir = path.join(root, last);
  return restoreBackupInternal(user, dir, dirs);
}

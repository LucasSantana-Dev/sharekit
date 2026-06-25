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
  // Read and parse applied.json with safe error handling
  let applied: { dest: string; status: Status }[];
  const appliedPath = path.join(backupDir, 'applied.json');
  try {
    const rawData = JSON.parse(fs.readFileSync(appliedPath, 'utf8'));

    // Validate that it's an array
    if (!Array.isArray(rawData)) {
      throw new Error('applied.json must be an array');
    }

    // Validate array elements have required shape
    applied = rawData.map((item, index) => {
      if (typeof item !== 'object' || item === null) {
        throw new Error(`applied.json[${index}] is not an object`);
      }
      const { dest, status } = item as { dest?: unknown; status?: unknown };
      if (typeof dest !== 'string') {
        throw new Error(`applied.json[${index}].dest must be a string, got ${typeof dest}`);
      }
      if (typeof status !== 'string') {
        throw new Error(`applied.json[${index}].status must be a string, got ${typeof status}`);
      }
      return { dest, status: status as Status };
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Backup data is corrupt or unreadable: ${msg}`);
  }

  let filesRestored = 0;
  let filesRemoved = 0;

  // Resolve home directory once for bounds checking
  const resolvedHome = path.resolve(dirs.home);

  for (const a of applied) {
    // Bounds-check: ensure dest is within dirs.home
    const resolvedDest = path.resolve(a.dest);
    if (!resolvedDest.startsWith(resolvedHome + path.sep)) {
      console.warn(`Skipping out-of-bounds entry: ${a.dest}`);
      continue;
    }

    if (a.status === 'new') {
      fs.rmSync(resolvedDest, { force: true }); // ponytail: leaves empty parent dirs; harmless
      filesRemoved++;
    } else {
      const src = path.join(backupDir, path.relative(resolvedHome, resolvedDest));
      if (fs.existsSync(src)) {
        fs.mkdirSync(path.dirname(resolvedDest), { recursive: true }); // dest dir may have been removed since install
        cp(src, resolvedDest);
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

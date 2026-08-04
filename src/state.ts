import * as fs from 'node:fs';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';
import kleur from 'kleur';
import { Dirs, DEFAULT_DIRS } from './paths.js';

export interface InstallRecord {
  user: string;
  ref: string;
  commit: string | null;
  version?: string;
  appliedAt: string;
}

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
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(kleur.yellow(`  Warning: couldn't read commit sha (${msg}) — install record will show no commit`));
  }
  const record: InstallRecord = { user, ref, commit, version, appliedAt: new Date().toISOString() };
  const stateFile = path.join(dirs.state, 'installed.json');
  const installed = readInstalled(dirs);
  installed[user] = record;
  fs.mkdirSync(dirs.state, { recursive: true });
  const tmp = stateFile + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(installed, null, 2));
  fs.renameSync(tmp, stateFile);
}

export function readInstalled(dirs: Dirs = DEFAULT_DIRS): Record<string, InstallRecord> {
  const stateFile = path.join(dirs.state, 'installed.json');
  if (!fs.existsSync(stateFile)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      console.warn(kleur.yellow('  Warning: installed.json is corrupt — resetting to empty'));
      return {};
    }
    return parsed as Record<string, InstallRecord>;
  } catch (e) {
    console.error(
      `${kleur.yellow('⚠  install state is corrupt')} — ${stateFile}\n  ${kleur.dim(`Reset: rm ${stateFile}`)}  to rebuild from scratch.`
    );
    return {};
  }
}

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

export function isImmutableRef(ref: string): boolean {
  if (/^[a-fA-F0-9]{7,40}$/.test(ref)) return true;
  if (/^v?\d+\.\d+(\.\d+)*$/.test(ref)) return true;
  return false;
}

const LOCK_FILE = path.join(DEFAULT_DIRS.state, '.lock');

/**
 * Portable cross-platform PID liveness check using process.kill(pid, 0).
 * Signal 0 doesn't send a signal; it only checks if the process exists and is accessible.
 * - EPERM: process exists but we don't own it (return true — alive)
 * - ESRCH: process doesn't exist (return false — dead)
 * - Other errors: treat as dead
 */
function isPidAlive(pidStr: string): boolean {
  const pid = Number(pidStr);
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    return code === 'EPERM'; // EPERM = alive but not owned by us; ESRCH = dead
  }
}

export function acquireLock(lockPath: string = LOCK_FILE): void {
  const pid = process.pid.toString();
  if (fs.existsSync(lockPath)) {
    try {
      const existingPid = fs.readFileSync(lockPath, 'utf8').trim();
      if (isPidAlive(existingPid)) {
        throw new Error(
          `another sharekit process is running (PID ${existingPid}) — retry after it finishes, or delete ${lockPath} if stale`
        );
      }
      // Process is dead — clean up stale lock
      try {
        fs.unlinkSync(lockPath);
      } catch {}
    } catch (e) {
      // If checking liveness or reading the lock file fails, check if it's our error
      if (e instanceof Error && e.message.includes('another sharekit process')) {
        throw e; // Re-throw the "process still running" error
      }
      // Otherwise try to clean up the lock file
      try {
        fs.unlinkSync(lockPath);
      } catch {}
    }
  }
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  fs.writeFileSync(lockPath, pid);
}

export function releaseLock(lockPath: string = LOCK_FILE): void {
  try {
    fs.unlinkSync(lockPath);
  } catch {}
}

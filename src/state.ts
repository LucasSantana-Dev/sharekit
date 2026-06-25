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

export function recordInstall(user: string, profileDir: string, ref: string, version: string | undefined, dirs: Dirs = DEFAULT_DIRS): void {
  let commit: string | null = null;
  try {
    commit = execFileSync('git', ['-C', profileDir, 'rev-parse', 'HEAD'], { stdio: 'pipe', encoding: 'utf8', timeout: 30_000 }).trim();
  } catch {}
  const record: InstallRecord = { user, ref, commit, version, appliedAt: new Date().toISOString() };
  const stateFile = path.join(dirs.state, 'installed.json');
  let installed: Record<string, InstallRecord> = {};
  if (fs.existsSync(stateFile)) {
    try {
      installed = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    } catch {}
  }
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
    console.error(`${kleur.yellow('⚠  install state is corrupt')} — ${stateFile}\n  ${kleur.dim(`Reset: rm ${stateFile}`)}  to rebuild from scratch.`);
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
        dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      }
    }
    const version = record.version ?? '(no version)';
    console.log(`  ${kleur.cyan(`${record.user}@${record.ref}`)}  ${version}  ${kleur.dim(shortSha)}  ${kleur.dim(dateStr)}`);
  }
  console.log();
}

export function isImmutableRef(ref: string): boolean {
  if (/^[a-fA-F0-9]{7,40}$/.test(ref)) return true;
  if (/^v?\d+\.\d+(\.\d+)*$/.test(ref)) return true;
  return false;
}

const LOCK_FILE = path.join(DEFAULT_DIRS.state, '.lock');

export function acquireLock(lockPath: string = LOCK_FILE): void {
  const pid = process.pid.toString();
  if (fs.existsSync(lockPath)) {
    try {
      const existingPid = fs.readFileSync(lockPath, 'utf8').trim();
      try {
        fs.statSync(`/proc/${existingPid}`);
        console.error(`Another sharekit operation is running (PID ${existingPid}). Try again in a moment.`);
        process.exit(1);
      } catch {
        try { fs.unlinkSync(lockPath); } catch {}
      }
    } catch {
      try { fs.unlinkSync(lockPath); } catch {}
    }
  }
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  fs.writeFileSync(lockPath, pid);
}

export function releaseLock(lockPath: string = LOCK_FILE): void {
  try { fs.unlinkSync(lockPath); } catch {}
}

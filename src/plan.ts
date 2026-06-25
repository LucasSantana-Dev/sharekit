import * as fs from 'node:fs';
import * as path from 'node:path';
import kleur from 'kleur';
import { ROOTS, tildify, cp, walkWithSymlinks, Dirs, DEFAULT_DIRS } from './paths.js';
import { readManifest } from './fetch.js';
import { restoreBackupInternal, pruneBackups, writeMetadata } from './backup.js';
import { readInstalled } from './state.js';

export type Status = 'new' | 'changed' | 'same';
export interface PlanFile {
  tool: string;
  src: string;
  dest: string;
  rel: string;
  status: Status;
}

// Track skipped symlinks for the current plan
let currentPlanSkippedSymlinks: string[] = [];

export function plan(profileDir: string, roots = ROOTS): PlanFile[] {
  const files: PlanFile[] = [];
  currentPlanSkippedSymlinks = []; // Reset for this plan

  for (const [tool, root] of Object.entries(roots)) {
    const base = path.join(profileDir, tool);
    if (!fs.existsSync(base)) continue;

    const walkResult = walkWithSymlinks(base);
    for (const src of walkResult.files) {
      const rel = path.relative(base, src);
      const dest = path.join(root, rel);
      files.push({ tool, src, dest, rel, status: classify(src, dest) });
    }

    // Collect skipped symlinks for this tool
    for (const symlink of walkResult.skippedSymlinks) {
      const rel = path.relative(base, symlink);
      currentPlanSkippedSymlinks.push(path.join(root, rel));
    }
  }
  return files.filter((f) => f.status !== 'same');
}

function classify(src: string, dest: string): Status {
  if (!fs.existsSync(dest)) return 'new';
  try {
    const srcBuf = fs.readFileSync(src);
    const destBuf = fs.readFileSync(dest);
    return srcBuf.equals(destBuf) ? 'same' : 'changed';
  } catch {
    // If either file is unreadable (e.g., permission denied), treat as 'changed' to be conservative.
    // This prevents a file unreadable mid-operation from crashing the plan.
    return 'changed';
  }
}

// ponytail: settings.json carries hooks (arbitrary shell). v1 never auto-installs it.
//           add `--include-hooks` when someone actually asks.
export const isExecutable = (f: PlanFile, includeHooks = false) =>
  !includeHooks && f.tool === 'claude' && path.basename(f.dest) === 'settings.json';

export function printPlan(files: PlanFile[], manifest: ReturnType<typeof readManifest>): void {
  console.log(
    kleur.bold(`Profile: ${manifest.name}${manifest.version ? ' v' + manifest.version : ''}`)
  );
  if (manifest.description) console.log(kleur.dim('  ' + manifest.description));
  const show = (s: Status, label: string, c: (x: string) => string) => {
    const g = files.filter((f) => f.status === s);
    if (!g.length) return;
    console.log(c(`\n  ${label} (${g.length})`));
    for (const f of g) console.log(c(`    ${tildify(f.dest)}`));
  };
  show('new', '+ new', kleur.green);
  show('changed', '~ changed', kleur.yellow);
  const same = files.filter((f) => f.status === 'same').length;
  if (same) console.log(kleur.dim(`\n  = ${same} unchanged`));
  if (files.some((f) => isExecutable(f)))
    console.log(
      kleur.yellow(`\n  ⚠  settings.json present — contains hooks; skipped. Merge manually.`)
    );
}

function write(files: PlanFile[], includeHooks = false): number {
  let n = 0;
  for (const f of files) {
    if (f.status === 'same' || isExecutable(f, includeHooks)) continue;
    fs.mkdirSync(path.dirname(f.dest), { recursive: true });
    cp(f.src, f.dest);
    n++;
  }
  return n;
}

export function writeAtomic(
  files: PlanFile[],
  backupDir: string,
  user: string,
  includeHooks = false,
  dirs: Dirs = DEFAULT_DIRS
): number {
  let n = 0;
  const applied = files.filter((f) => f.status !== 'same' && !isExecutable(f, includeHooks));

  try {
    for (const f of applied) {
      fs.mkdirSync(path.dirname(f.dest), { recursive: true });
      cp(f.src, f.dest);
      n++;
    }
    return n;
  } catch (e) {
    // Write failed mid-way: restore from backup and rethrow
    try {
      restoreBackupInternal(user, backupDir, dirs);
    } catch (restoreErr) {
      // Log the restore failure but don't mask the original error
      console.error(
        `Failed to restore from backup after write error: ${(restoreErr as Error).message}`
      );
    }
    throw e;
  }
}

export function backup(
  files: PlanFile[],
  user: string,
  includeHooks = false,
  dirs: Dirs = DEFAULT_DIRS
): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.join(dirs.state, 'backups', `${user}-${stamp}`);
  const applied = files.filter((f) => f.status !== 'same' && !isExecutable(f, includeHooks));
  fs.mkdirSync(dir, { recursive: true });
  for (const f of applied.filter((f) => f.status === 'changed')) {
    const t = path.join(dir, path.relative(dirs.home, f.dest));
    fs.mkdirSync(path.dirname(t), { recursive: true });
    cp(f.dest, t);
  }

  // Capture source version/commit from install state
  const installed = readInstalled(dirs);
  const sourceVersion = installed[user]?.version;
  const sourceCommit = installed[user]?.commit;

  fs.writeFileSync(
    path.join(dir, 'applied.json'),
    JSON.stringify(
      applied.map((f) => ({ dest: f.dest, status: f.status })),
      null,
      2
    )
  );

  // Write metadata with source version/commit if available
  const metadata: { sourceVersion?: string; sourceCommit?: string | null } = {};
  if (sourceVersion !== undefined) metadata.sourceVersion = sourceVersion;
  if (sourceCommit !== undefined) metadata.sourceCommit = sourceCommit;
  writeMetadata(dir, metadata);

  return dir;
}

// Exported pure functions for testability
export function applyProfile(
  files: PlanFile[],
  user: string,
  includeHooks = false,
  dirs: Dirs = DEFAULT_DIRS,
  dryRun = false
): { backupDir: string; filesWritten: number } {
  if (dryRun) {
    // In dry-run, just count files without writing anything
    const filesWritten = files.filter(
      (f) => f.status !== 'same' && !isExecutable(f, includeHooks)
    ).length;
    return { backupDir: '', filesWritten };
  }
  const backupDir = backup(files, user, includeHooks, dirs);
  const filesWritten = writeAtomic(files, backupDir, user, includeHooks, dirs);
  pruneBackups(user, dirs.state);
  return { backupDir, filesWritten };
}

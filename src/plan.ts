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
  // settings.json with --include-hooks: 'hooks' = merged content in `merged`,
  // 'invalid' = user's (or profile's) file is not valid JSON, skip and warn.
  merge?: 'hooks' | 'invalid';
  merged?: string;
}

// Denylist of executable-on-load dotfiles in shared/ that bypass shell gate
// These files are sourced/executed on every shell startup and pose an RCE risk
export const DANGEROUS_SHARED_DOTFILES = new Set([
  '.zshrc',
  '.zshenv',
  '.zprofile',
  '.zlogin',
  '.bashrc',
  '.bash_profile',
  '.bash_login',
  '.profile',
  '.bash_logout',
  '.xinitrc',
  '.xprofile',
]);

// Track skipped symlinks for the current plan
let currentPlanSkippedSymlinks: string[] = [];

export function getSkippedSymlinks(): string[] {
  return currentPlanSkippedSymlinks;
}

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
      const f: PlanFile = { tool, src, dest, rel, status: classify(src, dest) };
      if (f.status === 'changed' && tool === 'claude' && path.basename(dest) === 'settings.json') {
        applySettingsMerge(f);
      }
      files.push(f);
    }

    // Collect skipped symlinks for this tool
    for (const symlink of walkResult.skippedSymlinks) {
      const rel = path.relative(base, symlink);
      currentPlanSkippedSymlinks.push(path.join(root, rel));
    }
  }
  return files.filter((f) => f.status !== 'same');
}

type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);

function canon(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canon).join(',')}]`;
  if (isObj(v))
    return `{${Object.keys(v)
      .sort()
      .map((k) => JSON.stringify(k) + ':' + canon(v[k]))
      .join(',')}}`;
  return JSON.stringify(v);
}

// Merge rule: only the `hooks` key is touched; every other key of the user's file is kept
// as is and no other profile key is copied. Per event and per profile group: if the user has
// a group with the same matcher (undefined and "" equal), append only the inner hooks whose
// (type, command) is not already in a same-matcher group; otherwise append the whole group.
const matcherOf = (g: unknown): string =>
  isObj(g) && typeof g.matcher === 'string' ? g.matcher : '';
const hookKey = (h: unknown): string =>
  isObj(h) && typeof h.command === 'string'
    ? canon({ type: h.type, command: h.command })
    : canon(h);

export function mergeSettings(user: Json, profile: Json): Json {
  const out: Json = { ...user };
  const v = profile.hooks;
  if (!isObj(v)) return out;
  if (!('hooks' in out)) {
    out.hooks = v;
    return out;
  }
  if (!isObj(out.hooks)) return out;
  const hooks: Json = { ...out.hooks };
  for (const [event, groups] of Object.entries(v)) {
    if (!Array.isArray(groups)) continue;
    if (!(event in hooks)) {
      hooks[event] = groups;
      continue;
    }
    const cur = hooks[event];
    if (!Array.isArray(cur)) continue;
    const next = cur.map((g) => (isObj(g) ? { ...g } : g));
    for (const pg of groups) {
      const m = matcherOf(pg);
      const same = next.filter(
        (g): g is Json => isObj(g) && Array.isArray(g.hooks) && matcherOf(g) === m
      );
      if (!same.length || !isObj(pg) || !Array.isArray(pg.hooks)) {
        if (!next.some((g) => canon(g) === canon(pg))) next.push(pg);
        continue;
      }
      const seen = new Set(same.flatMap((g) => (g.hooks as unknown[]).map(hookKey)));
      const add = pg.hooks.filter((h) => !seen.has(hookKey(h)));
      if (add.length) same[0].hooks = [...(same[0].hooks as unknown[]), ...add];
    }
    hooks[event] = next;
  }
  out.hooks = hooks;
  return out;
}

function applySettingsMerge(f: PlanFile): void {
  try {
    const user: unknown = JSON.parse(fs.readFileSync(f.dest, 'utf8'));
    const prof: unknown = JSON.parse(fs.readFileSync(f.src, 'utf8'));
    if (!isObj(user) || !isObj(prof)) throw new Error('not an object');
    const merged = JSON.stringify(mergeSettings(user, prof), null, 2) + '\n';
    f.merge = 'hooks';
    f.merged = merged;
    if (canon(JSON.parse(merged)) === canon(user)) f.status = 'same';
  } catch {
    f.merge = 'invalid';
  }
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
// shared/ dotfiles (.zshrc, .bashrc, etc.) are sourced on shell startup → RCE on install.
//           add `--include-dotfiles` when someone explicitly requests.
export const isExecutable = (f: PlanFile, includeHooks = false, includeDotfiles = false) => {
  if (includeHooks && f.merge === 'invalid') return true;
  if (!includeHooks && f.tool === 'claude' && path.basename(f.dest) === 'settings.json') {
    return true;
  }
  if (
    !includeDotfiles &&
    f.tool === 'shared' &&
    DANGEROUS_SHARED_DOTFILES.has(path.basename(f.dest))
  ) {
    return true;
  }
  return false;
};

export function printPlan(
  files: PlanFile[],
  manifest: ReturnType<typeof readManifest>,
  includeDotfiles = false
): void {
  console.log(
    kleur.bold(`Profile: ${manifest.name}${manifest.version ? ' v' + manifest.version : ''}`)
  );
  if (manifest.description) console.log(kleur.dim('  ' + manifest.description));
  const show = (s: Status, label: string, c: (x: string) => string) => {
    const g = files.filter((f) => f.status === s);
    if (!g.length) return;
    console.log(c(`\n  ${label} (${g.length})`));
    for (const f of g) {
      const note =
        f.merge === 'hooks'
          ? '  (merged (hooks))'
          : f.merge === 'invalid'
            ? '  (invalid JSON, will not be merged)'
            : '';
      console.log(c(`    ${tildify(f.dest)}${note}`));
    }
  };
  show('new', '+ new', kleur.green);
  show('changed', '~ changed', kleur.yellow);
  const same = files.filter((f) => f.status === 'same').length;
  if (same) console.log(kleur.dim(`\n  = ${same} unchanged`));
  if (files.some((f) => isExecutable(f, false, includeDotfiles)))
    console.log(
      kleur.yellow(`\n  ⚠  settings.json present — contains hooks; skipped. Merge manually.`)
    );
  if (files.some((f) => isExecutable(f, true, false) && f.tool === 'shared'))
    console.log(
      kleur.yellow(
        `\n  ⚠  shared/ contains executable dotfiles (.zshrc, .bashrc, etc.); skipped for security. Use --include-dotfiles to merge.`
      )
    );
  const skipped = getSkippedSymlinks();
  if (skipped.length)
    console.log(
      kleur.yellow(
        `\n  ⚠  ${skipped.length} symlink${skipped.length === 1 ? '' : 's'} skipped (not followed): ${skipped.map(tildify).join(', ')}`
      )
    );
}

function write(files: PlanFile[], includeHooks = false, includeDotfiles = false): number {
  let n = 0;
  for (const f of files) {
    if (f.status === 'same' || isExecutable(f, includeHooks, includeDotfiles)) continue;
    fs.mkdirSync(path.dirname(f.dest), { recursive: true });
    place(f);
    n++;
  }
  return n;
}

function place(f: PlanFile): void {
  if (f.merge === 'hooks' && f.merged !== undefined) {
    const mode = fs.statSync(f.dest).mode;
    fs.writeFileSync(f.dest, f.merged);
    fs.chmodSync(f.dest, mode);
  } else cp(f.src, f.dest);
}

export function writeAtomic(
  files: PlanFile[],
  backupDir: string,
  user: string,
  includeHooks = false,
  dirs: Dirs = DEFAULT_DIRS,
  includeDotfiles = false
): number {
  let n = 0;
  const applied = files.filter(
    (f) => f.status !== 'same' && !isExecutable(f, includeHooks, includeDotfiles)
  );

  if (includeHooks) {
    for (const f of files.filter((f) => f.merge === 'invalid')) {
      console.warn(
        `warning: ${tildify(f.dest)} (or the profile's settings.json) is not valid JSON; skipping settings.json, other files still apply`
      );
    }
  }

  try {
    for (const f of applied) {
      fs.mkdirSync(path.dirname(f.dest), { recursive: true });
      place(f);
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
  dirs: Dirs = DEFAULT_DIRS,
  includeDotfiles = false
): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.join(dirs.state, 'backups', `${user}-${stamp}`);
  const applied = files.filter(
    (f) => f.status !== 'same' && !isExecutable(f, includeHooks, includeDotfiles)
  );
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
  dryRun = false,
  includeDotfiles = false
): { backupDir: string; filesWritten: number } {
  if (dryRun) {
    // In dry-run, just count files without writing anything
    const filesWritten = files.filter(
      (f) => f.status !== 'same' && !isExecutable(f, includeHooks, includeDotfiles)
    ).length;
    return { backupDir: '', filesWritten };
  }
  const backupDir = backup(files, user, includeHooks, dirs, includeDotfiles);
  const filesWritten = writeAtomic(files, backupDir, user, includeHooks, dirs, includeDotfiles);
  pruneBackups(user, dirs.state);
  return { backupDir, filesWritten };
}

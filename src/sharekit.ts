import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { execFileSync } from 'node:child_process';
import { parse as parseToml } from 'smol-toml';
import kleur from 'kleur';

const HOME = os.homedir();
const STATE = path.join(HOME, '.sharekit');

// Defence-in-depth: size cap for sharekit.toml to prevent DoS on pathological input.
// Typical manifests are a few KB; 512 KB is a generous cap that catches obvious abuses.
const MAX_MANIFEST_BYTES = 512 * 1024; // 512 KB

// profile/<tool>/** mirrors into these roots — one rule, not a filename allowlist
const ROOTS: Record<string, string> = {
  claude: path.join(HOME, '.claude'),
  cursor: path.join(HOME, '.cursor'),
  shared: HOME,
};

type Status = 'new' | 'changed' | 'same';
interface PlanFile {
  tool: string;
  src: string;
  dest: string;
  rel: string;
  status: Status;
}

// Track skipped symlinks during walk
interface WalkResult {
  files: string[];
  skippedSymlinks: string[];
}

export interface Finding {
  rule: string;
  file?: string;
  line: number;
  preview: string;
  severity: 'high' | 'medium' | 'low';
}

// injectable so backup/restore can target a temp dir in tests (default: real ~/.sharekit + $HOME)
type Dirs = { home: string; state: string };
const DEFAULT_DIRS: Dirs = { home: HOME, state: STATE };

export interface InstallOpts {
  includeHooks?: boolean;
  yes?: boolean;
  dryRun?: boolean;
}

const tildify = (p: string) => {
  if (!p.startsWith(HOME)) return p;
  // Normalize separators to forward slashes for cross-platform display
  return '~' + p.slice(HOME.length).split(path.sep).join('/');
};

// Track skipped symlinks for the current plan
let currentPlanSkippedSymlinks: string[] = [];

export function walkWithSymlinks(dir: string): WalkResult {
  const files: string[] = [];
  const skippedSymlinks: string[] = [];

  const traverse = (currentDir: string) => {
    for (const e of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const p = path.join(currentDir, e.name);
      if (e.isSymbolicLink()) {
        skippedSymlinks.push(p);
      } else if (e.isDirectory()) {
        traverse(p);
      } else {
        files.push(p);
      }
    }
  };

  traverse(dir);
  return { files, skippedSymlinks };
}

export function parseUserRef(user: string): { user: string; ref?: string } {
  const ref = user.includes('@') ? user.split('@').reverse()[0] : undefined;
  const userName = ref ? user.slice(0, user.lastIndexOf('@')) : user;
  return { user: userName, ref };
}

export function walk(dir: string): string[] {
  return walkWithSymlinks(dir).files;
}

// copy a file, preserving its mode (e.g. a skill's executable toggle.sh)
function cp(src: string, dest: string): void {
  fs.copyFileSync(src, dest);
  fs.chmodSync(dest, fs.statSync(src).mode);
}

// ponytail: profile lives at github.com/<user>/sharekit-profile — one convention, not a search
export function fetchProfile(
  user: string,
  ref?: string,
  baseUrl = 'https://github.com',
  cacheRoot = path.join(STATE, 'profiles')
): string {
  // Cache key: <user> for HEAD, <user>@<ref> for a pinned ref
  const cacheKey = ref ? `${user}@${ref}` : user;
  const dir = path.join(cacheRoot, cacheKey);

  if (fs.existsSync(dir)) {
    // Attempt a best-effort pull to refresh the cached checkout.
    // For mutable refs (branches), this pulls the latest. For immutable refs (tags/SHAs),
    // the pull harmlessly fails and we fall back to the cached copy.
    try {
      execFileSync('git', ['-C', dir, 'pull', '--ff-only'], { stdio: 'pipe' });
    } catch {
      // ponytail: refresh is best-effort — offline / no-remote / detached HEAD falls back to the cached copy
    }
    return dir;
  }

  fs.mkdirSync(path.dirname(dir), { recursive: true });
  const url = `${baseUrl}/${user}/sharekit-profile`;

  try {
    if (ref) {
      execFileSync('git', ['clone', '--depth', '1', '--branch', ref, '--', url, dir], {
        stdio: 'pipe',
      });
    } else {
      execFileSync('git', ['clone', '--depth', '1', '--', url, dir], { stdio: 'pipe' });
    }
  } catch (e) {
    if ((e as { code?: string }).code === 'ENOENT') {
      throw new Error('git not found — install git to use sharekit (https://git-scm.com)');
    }
    const errOut =
      ((e as { stderr?: Buffer }).stderr?.toString() ?? '') + ((e as Error).message ?? '');
    if (ref && errOut.includes('not found')) {
      throw new Error(`ref '${ref}' not found in ${user}'s profile`);
    }
    throw new Error(
      `No profile at ${url}\n` +
        `  Publish yours: a repo named "sharekit-profile" with a sharekit.toml`
    );
  }
  return dir;
}

export function readManifest(profileDir: string): {
  name: string;
  version?: string;
  description?: string;
} {
  const p = path.join(profileDir, 'sharekit.toml');
  if (!fs.existsSync(p))
    throw new Error(`Not a sharekit profile (no sharekit.toml in ${profileDir})`);

  // Defence-in-depth: reject oversized manifests before parsing to prevent DoS
  const stat = fs.statSync(p);
  if (stat.size > MAX_MANIFEST_BYTES) {
    throw new Error(
      `Invalid sharekit.toml: manifest too large (${(stat.size / 1024).toFixed(1)} KB, max ${(MAX_MANIFEST_BYTES / 1024).toFixed(0)} KB)`
    );
  }
  let parsed: Record<string, unknown>;
  try {
    parsed = parseToml(fs.readFileSync(p, 'utf8')) as Record<string, unknown>;
  } catch (e) {
    throw new Error(`Invalid sharekit.toml: ${(e as Error).message}`);
  }
  const profile = (parsed.profile ?? {}) as Record<string, string>;
  return {
    name: profile.name ?? 'unknown',
    version: profile.version,
    description: profile.description,
  };
}

// Discover published profiles: GitHub IS the registry — search for repos named "sharekit-profile".
export async function search(query?: string): Promise<void> {
  const q = encodeURIComponent(`sharekit-profile in:name${query ? ` ${query}` : ''}`);
  const url = `https://api.github.com/search/repositories?q=${q}&sort=stars&per_page=30`;
  let data: { items?: Array<Record<string, unknown>> };
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'sharekit-cli', Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    data = (await res.json()) as typeof data;
  } catch (e) {
    throw new Error(`search failed: ${(e as Error).message}`);
  }
  const profiles = (data.items ?? []).filter((r) => r.name === 'sharekit-profile');
  if (!profiles.length) {
    console.log(
      kleur.dim(
        `\n  No profiles found${query ? ` for "${query}"` : ''}. Publish yours: a repo named "sharekit-profile".\n`
      )
    );
    return;
  }
  console.log(
    kleur.bold(`\n  ${profiles.length} profile(s)${query ? ` matching "${query}"` : ''}:\n`)
  );
  for (const r of profiles) {
    const owner = (r.owner as { login?: string } | undefined)?.login ?? '?';
    const stars = (r.stargazers_count as number) || 0;
    console.log(`  ${kleur.cyan(owner)}${stars ? kleur.dim(`  ★${stars}`) : ''}`);
    if (r.description) console.log(kleur.dim(`    ${r.description as string}`));
    console.log(kleur.dim(`    → sharekit install ${owner}`));
  }
  console.log();
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
      files.push({ tool, src, dest, rel, status: classify(src, dest) });
    }

    // Collect skipped symlinks for this tool
    for (const symlink of walkResult.skippedSymlinks) {
      const rel = path.relative(base, symlink);
      currentPlanSkippedSymlinks.push(path.join(root, rel));
    }
  }
  return files;
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
const isExecutable = (f: PlanFile, includeHooks = false) =>
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

export async function confirm(q: string, autoYes = false): Promise<boolean> {
  if (autoYes) return true;
  const rl = readline.createInterface({ input, output });
  const a = await rl.question(kleur.bold(`  ${q} (y/N) `));
  rl.close();
  return a.trim().toLowerCase() === 'y';
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

// Helper: read metadata.json from backup directory
// Returns {sourceVersion?, sourceCommit?} or {} if missing/unparseable
function readMetadata(backupDir: string): { sourceVersion?: string; sourceCommit?: string | null } {
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
function writeMetadata(
  backupDir: string,
  metadata: { sourceVersion?: string; sourceCommit?: string | null }
): void {
  if (Object.keys(metadata).length === 0) {
    return;
  }
  fs.writeFileSync(path.join(backupDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
}

function backup(
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

function writeAtomic(
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

export interface BackupInfo {
  stamp: string;
  fileCount: number;
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

interface RestoreMetadata {
  filesRestored: number;
  filesRemoved: number;
  sourceVersion?: string;
  sourceCommit?: string | null;
}

function restoreBackupInternal(
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

// Install state record: captures what was installed and where
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

// Core update logic without interactive prompts (for testing and direct apply)
export function updateApply(
  user: string,
  includeHooks = false,
  dirs: Dirs = DEFAULT_DIRS
): { filesWritten: number; backupDir: string } {
  // Get the install record for this user
  const installed = readInstalled(dirs);
  const record = installed[user];

  if (!record) {
    throw new Error(`not installed — run 'sharekit install ${user}' first`);
  }

  const ref = record.ref;

  // If ref is immutable (pinned to a tag or commit), don't update
  if (isImmutableRef(ref)) {
    console.log(kleur.yellow(`\n  pinned to ${ref} — nothing to update\n`));
    return { filesWritten: 0, backupDir: '' };
  }

  // Ref is mutable (branch or HEAD), so fetch the latest
  // Use injected cache root for offline testability
  const cacheRoot = path.join(dirs.state, 'profiles');
  const dir = fetchProfile(user, ref, 'https://github.com', cacheRoot);
  const manifest = readManifest(dir);

  // Compute roots relative to injected home for testability
  const roots: Record<string, string> = {
    claude: path.join(dirs.home, '.claude'),
    cursor: path.join(dirs.home, '.cursor'),
    shared: dirs.home,
  };
  const files = plan(dir, roots);
  printPlan(files, manifest);

  const todo = files.filter((f) => f.status !== 'same' && !isExecutable(f, includeHooks));
  if (!todo.length) {
    console.log(kleur.dim('\n  Already up to date.\n'));
    return { filesWritten: 0, backupDir: '' };
  }

  const { backupDir, filesWritten } = applyProfile(files, user, includeHooks, dirs);

  // Update the install record with the new commit and timestamp
  recordInstall(user, dir, ref, manifest.version, dirs);

  return { filesWritten, backupDir };
}

// Update an installed profile to the latest version (with interactive prompts)
export async function update(
  user: string,
  opts?: InstallOpts,
  dirs: Dirs = DEFAULT_DIRS
): Promise<void> {
  const includeHooks = opts?.includeHooks ?? false;
  const yes = opts?.yes ?? false;
  const dryRun = opts?.dryRun ?? false;

  // Get the install record for this user
  const installed = readInstalled(dirs);
  const record = installed[user];

  if (!record) {
    throw new Error(`not installed — run 'sharekit install ${user}' first`);
  }

  const ref = record.ref;

  // If ref is immutable (pinned to a tag or commit), don't update
  if (isImmutableRef(ref)) {
    console.log(kleur.yellow(`\n  pinned to ${ref} — nothing to update\n`));
    return;
  }

  // Ref is mutable (branch or HEAD), so fetch the latest
  // Use injected cache root for offline testability
  const cacheRoot = path.join(dirs.state, 'profiles');
  const fetchDir = fetchProfile(user, ref, 'https://github.com', cacheRoot);
  const manifest = readManifest(fetchDir);

  // Compute roots relative to injected home for testability
  const roots: Record<string, string> = {
    claude: path.join(dirs.home, '.claude'),
    cursor: path.join(dirs.home, '.cursor'),
    shared: dirs.home,
  };
  const files = plan(fetchDir, roots);
  printPlan(files, manifest);

  const todo = files.filter((f) => f.status !== 'same' && !isExecutable(f, includeHooks));
  if (!todo.length) return void console.log(kleur.dim('\n  Already up to date.\n'));

  // If hooks present and not explicitly included, warn
  const hasHooks = files.some((f) => isExecutable(f, false));
  if (hasHooks && !includeHooks) {
    console.log(
      kleur.yellow(`\n  ⚠  This profile's settings.json contains hooks that run shell commands.`)
    );
  }

  // If hooks present and user wants to include them, ask for explicit confirm
  if (hasHooks && includeHooks) {
    if (
      !(await confirm(
        `This profile's settings.json contains hooks that run shell commands. Update with it?`,
        yes
      ))
    ) {
      return void console.log(kleur.dim('\n  Aborted.\n'));
    }
  }

  if (!(await confirm(`Apply ${todo.length} change(s)?`, yes)))
    return void console.log(kleur.dim('\n  Aborted.\n'));

  if (dryRun) {
    // For dry-run, just count files
    const filesWritten = todo.length;
    console.log(kleur.cyan(`\n  (dry-run — no files written)`));
    console.log(kleur.green(`\n  ✓ Would update ${filesWritten} file(s).`));
    console.log();
    return;
  }

  const { backupDir, filesWritten } = updateApply(user, includeHooks, dirs);

  console.log(
    kleur.green(`\n  ✓ Updated ${filesWritten} file(s).`) +
      kleur.dim(`  Backup: ${tildify(backupDir)}`)
  );
  console.log(kleur.dim(`  Undo: sharekit rollback ${user}\n`));
}

export async function install(user: string, opts?: InstallOpts): Promise<void> {
  const includeHooks = opts?.includeHooks ?? false;
  const { user: userName, ref: userRef } = parseUserRef(user);
  const yes = opts?.yes ?? false;
  const dryRun = opts?.dryRun ?? false;

  const dir = fetchProfile(userName, userRef);
  const manifest = readManifest(dir);
  const files = plan(dir);
  console.log();
  printPlan(files, manifest);

  const todo = files.filter((f) => f.status !== 'same' && !isExecutable(f, includeHooks));
  if (!todo.length) return void console.log(kleur.dim('\n  Already up to date.\n'));

  // If hooks present and not explicitly included, warn
  const hasHooks = files.some((f) => isExecutable(f, false));
  if (hasHooks && !includeHooks) {
    console.log(
      kleur.yellow(`\n  ⚠  This profile's settings.json contains hooks that run shell commands.`)
    );
  }

  // If hooks present and user wants to include them, ask for explicit confirm
  if (hasHooks && includeHooks) {
    if (
      !(await confirm(
        `This profile's settings.json contains hooks that run shell commands. Install it?`,
        yes
      ))
    ) {
      return void console.log(kleur.dim('\n  Aborted.\n'));
    }
  }

  if (!(await confirm(`Apply ${todo.length} change(s)?`, yes)))
    return void console.log(kleur.dim('\n  Aborted.\n'));

  const { backupDir, filesWritten } = applyProfile(
    files,
    userName,
    includeHooks,
    DEFAULT_DIRS,
    dryRun
  );

  // Only record install if not a dry-run
  if (!dryRun) {
    recordInstall(userName, dir, userRef ?? 'HEAD', manifest.version);
  }

  if (dryRun) {
    console.log(kleur.cyan(`\n  (dry-run — no files written)`));
  }

  console.log(
    kleur.green(`\n  ✓ Applied ${filesWritten} file(s).`) +
      (dryRun ? '' : kleur.dim(`  Backup: ${tildify(backupDir)}`))
  );
  if (!dryRun) {
    console.log(kleur.dim(`  Undo: sharekit rollback ${userName}`));
  }
  console.log();
}

export async function preview(user: string): Promise<void> {
  const { user: userName, ref: userRef } = parseUserRef(user);

  const dir = fetchProfile(userName, userRef);
  console.log();
  printPlan(plan(dir), readManifest(dir));
  console.log();
}

export async function inspect(user: string): Promise<void> {
  const userRef = user.includes('@') ? user.split('@').reverse()[0] : undefined;
  const userName = userRef ? user.slice(0, user.lastIndexOf('@')) : user;

  const dir = fetchProfile(userName, userRef);
  const manifest = readManifest(dir);
  const files = plan(dir);

  console.log();
  console.log(
    kleur.bold(`Profile: ${manifest.name}${manifest.version ? ' v' + manifest.version : ''}`)
  );
  if (manifest.description) console.log(kleur.dim('  ' + manifest.description));

  if (files.length === 0) {
    console.log(kleur.dim('\n  (empty profile)\n'));
    return;
  }

  // Group files by tool
  const byTool: Record<string, string[]> = {};
  for (const f of files) {
    if (!byTool[f.tool]) byTool[f.tool] = [];
    byTool[f.tool].push(f.rel);
  }

  // Print file tree grouped by tool
  for (const tool of Object.keys(byTool).sort()) {
    console.log(kleur.cyan(`\n  ${tool}/`));
    for (const rel of byTool[tool].sort()) {
      console.log(`    ${rel}`);
    }
  }
  console.log();
}

export async function rollback(user: string, opts?: InstallOpts): Promise<void> {
  const yes = opts?.yes ?? false;
  const dryRun = opts?.dryRun ?? false;

  const root = path.join(STATE, 'backups');
  const last = fs.existsSync(root)
    ? fs
        .readdirSync(root)
        .filter((e) => e.startsWith(user + '-'))
        .sort()
        .pop()
    : undefined;
  if (!last) return void console.log(kleur.yellow(`No backup for ${user}.`));

  const dir = path.join(root, last);
  const applied: { dest: string; status: Status }[] = JSON.parse(
    fs.readFileSync(path.join(dir, 'applied.json'), 'utf8')
  );

  let versionStr = '';
  const metadataPath = path.join(dir, 'metadata.json');
  if (fs.existsSync(metadataPath)) {
    try {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      if (metadata.sourceVersion) versionStr = ` (v${metadata.sourceVersion})`;
    } catch {
      // If metadata can't be read, just continue without version info
    }
  }

  console.log(kleur.bold(`\n  Rollback ${user}${versionStr}  (${applied.length} file(s))\n`));
  if (!(await confirm('Restore?', yes))) return void console.log(kleur.dim('\n  Aborted.\n'));

  if (dryRun) {
    console.log(kleur.cyan(`\n  (dry-run — no files restored)`));
    console.log(kleur.green(`\n  ✓ Would restore ${applied.length} file(s).`));
    console.log();
    return;
  }

  const metadata = restoreBackup(user);
  const summary = `${metadata.filesRestored} file(s) restored${
    metadata.filesRemoved > 0 ? `, ${metadata.filesRemoved} removed` : ''
  }`;
  // Handle null sourceCommit (offline cache case)
  let versionSuffix = '';
  if (metadata.sourceCommit === null) {
    versionSuffix = ' — from offline cache, exact version unknown';
  } else if (metadata.sourceVersion) {
    versionSuffix = ` (reverted to v${metadata.sourceVersion})`;
  }

  console.log(kleur.green(`\n  ✓ ${summary}${versionSuffix}`));
  console.log();
}

export async function uninstall(
  user: string,
  dirs: Dirs = DEFAULT_DIRS,
  force = false
): Promise<void> {
  const installed = readInstalled(dirs);
  const record = installed[user];

  if (!record) {
    throw new Error(`${user} is not installed.`);
  }

  // Find the latest backup for this user
  const root = path.join(dirs.state, 'backups');
  const last = fs.existsSync(root)
    ? fs
        .readdirSync(root)
        .filter((e) => e.startsWith(user + '-'))
        .sort()
        .pop()
    : undefined;

  if (!last) {
    throw new Error(`No backup found for ${user}. Cannot uninstall without restore information.`);
  }

  const backupDir = path.join(root, last);
  const applied: { dest: string; status: Status }[] = JSON.parse(
    fs.readFileSync(path.join(backupDir, 'applied.json'), 'utf8')
  );

  // Print what will be removed/restored
  const toRemove = applied.filter((a) => a.status === 'new');
  const toRestore = applied.filter((a) => a.status === 'changed');

  console.log();
  console.log(kleur.bold(`  Uninstall ${user}${record.version ? ` (v${record.version})` : ''}\n`));

  if (toRemove.length > 0) {
    console.log(kleur.red(`  - remove (${toRemove.length})`));
    for (const a of toRemove) {
      console.log(kleur.red(`    ${tildify(a.dest)}`));
    }
  }

  if (toRestore.length > 0) {
    console.log(kleur.yellow(`\n  ~ restore (${toRestore.length})`));
    for (const a of toRestore) {
      console.log(kleur.yellow(`    ${tildify(a.dest)}`));
    }
  }

  console.log();
  if (!force && !(await confirm(`Remove ${user}?`))) {
    return void console.log(kleur.dim('\n  Aborted.\n'));
  }

  // Execute the uninstall: reverse all changes
  for (const a of applied) {
    if (a.status === 'new') {
      // File was added by the profile — remove it
      fs.rmSync(a.dest, { force: true });
    } else if (a.status === 'changed') {
      // File was changed — restore from backup
      const src = path.join(backupDir, path.relative(dirs.home, a.dest));
      if (fs.existsSync(src)) {
        fs.mkdirSync(path.dirname(a.dest), { recursive: true });
        cp(src, a.dest);
      }
    }
  }

  // Remove user from installed.json
  delete installed[user];
  const stateFile = path.join(dirs.state, 'installed.json');
  fs.writeFileSync(stateFile, JSON.stringify(installed, null, 2));

  const summary = `${toRemove.length} file(s) removed${
    toRestore.length > 0 ? `, ${toRestore.length} restored` : ''
  }`;
  console.log(kleur.green(`\n  ✓ Uninstalled ${user}. ${summary}`));
  console.log();
}

export async function scan(dir?: string, force = false): Promise<void> {
  const profileDir = dir ?? './sharekit-profile';

  // Check if profile directory exists
  if (!fs.existsSync(profileDir)) {
    throw new Error(
      `No profile at ${profileDir} — run 'sharekit init' first to create a profile directory.`
    );
  }

  console.log();

  // Walk the directory and scan all files for secrets
  const allFindings: Finding[] = [];
  const files = walk(profileDir);
  for (const file of files) {
    let content: string;
    const relPath = path.relative(profileDir, file);
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code ?? 'UNKNOWN';
      console.log(kleur.yellow(`    ~ Skipped ${relPath}: ${code}`));
      continue;
    }
    const findings = scanForSecrets(content, relPath);
    allFindings.push(...findings);
  }

  // Print findings and apply gate logic (shared with init)
  printAndGateFindings(allFindings, force);
}

// Construct a preview string from a line, given match index and window params.
// Adds leading/trailing ellipsis when substring is clipped.
function truncatePreview(
  line: string,
  idx: number,
  contextBefore = 5,
  maxLen = 40,
  addLeadingEllipsis = true
): string {
  const start = Math.max(0, idx - contextBefore);
  const end = Math.min(line.length, idx + maxLen);
  const leading = addLeadingEllipsis && start > 0 ? '…' : '';
  const trailing = end < line.length ? '…' : '';
  return leading + line.substring(start, end) + trailing;
}

// Shared helper: print findings and apply gate logic (high-severity blocks unless force=true)
function printAndGateFindings(findings: Finding[], force = false): void {
  if (findings.length === 0) {
    console.log(kleur.green('  ✓ No secrets detected.\n'));
    return;
  }

  // Print warnings if secrets found
  console.log(kleur.yellow(`\n  ⚠  Secret patterns detected:`));
  for (const finding of findings) {
    console.log(
      kleur.yellow(`    ${finding.file}:${finding.line} [${finding.rule}] ${finding.preview}`)
    );
  }
  console.log(
    kleur.yellow(`\n  ⚠  Review and redact secrets before pushing to a public repository.\n`)
  );

  // Gate: block export if high-severity findings and no --force
  const highSeverityFindings = findings.filter((f) => f.severity === 'high');
  if (highSeverityFindings.length > 0 && !force) {
    throw new Error(
      `Secrets export blocked: ${highSeverityFindings.length} high-severity finding(s) detected. ` +
        `Review and remove secrets, or re-run with --force to override.`
    );
  }
}

export function scanForSecrets(content: string, fileLabel?: string): Finding[] {
  const findings: Finding[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Rule 1: Private key blocks (HIGH)
    if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(line)) {
      const preview = line.substring(0, 40) + (line.length > 40 ? '…' : '');
      findings.push({
        rule: 'Private Key Block',
        file: fileLabel,
        line: lineNum,
        preview,
        severity: 'high',
      });
      continue;
    }

    // Rule 2: AWS access key (HIGH)
    const awsMatch = /AKIA[0-9A-Z]{16}/.exec(line);
    if (awsMatch) {
      const preview = truncatePreview(line, awsMatch.index, 5, 20);
      findings.push({
        rule: 'AWS Access Key ID',
        file: fileLabel,
        line: lineNum,
        preview,
        severity: 'high',
      });
      continue;
    }

    // Rule 3: GitHub PAT ghp_ format (HIGH) — at least 20 chars after ghp_
    const githubGhpMatch = /ghp_[A-Za-z0-9_]{20,}/.exec(line);
    if (githubGhpMatch) {
      const preview = truncatePreview(line, githubGhpMatch.index, 5, 40);
      findings.push({
        rule: 'GitHub Personal Access Token',
        file: fileLabel,
        line: lineNum,
        preview,
        severity: 'high',
      });
      continue;
    }

    // Rule 4: GitHub PAT github_pat_ format (HIGH) — at least 20 chars after prefix
    const githubPatMatch = /github_pat_[A-Za-z0-9_]{20,}/.exec(line);
    if (githubPatMatch) {
      const preview = truncatePreview(line, githubPatMatch.index, 5, 40);
      findings.push({
        rule: 'GitHub Personal Access Token',
        file: fileLabel,
        line: lineNum,
        preview,
        severity: 'high',
      });
      continue;
    }

    // Rule 5: Slack tokens (HIGH)
    const slackMatch = /xox[baprs]-[A-Za-z0-9-]{10,}/.exec(line);
    if (slackMatch) {
      const preview = truncatePreview(line, slackMatch.index, 5, 40);
      findings.push({
        rule: 'Slack Token',
        file: fileLabel,
        line: lineNum,
        preview,
        severity: 'high',
      });
      continue;
    }

    // Rule 6: Google API keys AIza format (HIGH)
    const googleMatch = /AIza[0-9A-Za-z\-_]{35}/.exec(line);
    if (googleMatch) {
      const preview = truncatePreview(line, googleMatch.index, 5, 40);
      findings.push({
        rule: 'Google API Key',
        file: fileLabel,
        line: lineNum,
        preview,
        severity: 'high',
      });
      continue;
    }

    // Rule 7: Bearer token (HIGH)
    const bearerMatch = /Bearer [A-Za-z0-9._\-]{20,}/.exec(line);
    if (bearerMatch) {
      const preview = truncatePreview(line, bearerMatch.index, 0, 30, false);
      findings.push({
        rule: 'Bearer Token',
        file: fileLabel,
        line: lineNum,
        preview,
        severity: 'high',
      });
      continue;
    }

    // Rule 8: Home directory path leak (LOW)
    const homeDirMatch = /(\/Users\/[a-zA-Z0-9_-]+|\/home\/[a-zA-Z0-9_-]+)/.exec(line);
    if (homeDirMatch) {
      const preview = truncatePreview(line, homeDirMatch.index, 5, 40);
      findings.push({
        rule: 'Home Directory Path Leak',
        file: fileLabel,
        line: lineNum,
        preview,
        severity: 'low',
      });
      continue;
    }

    // Rule 9: Generic KEY=value with sensitive key names, including export prefix (MEDIUM)
    // Match both "KEY=value" and "export KEY=value"
    const envMatch = /(?:^|\s)(?:export\s+)?([A-Z_]+?)=(.*)$/.exec(line);
    if (envMatch) {
      const keyName = envMatch[1].toUpperCase();
      const value = envMatch[2];

      // Check if key name contains sensitive keywords
      if (/(SECRET|TOKEN|PASSWORD|API_KEY|APIKEY|ACCESS_KEY)/i.test(keyName)) {
        // Ignore if value is empty or a placeholder
        const placeholders = ['""', "''", 'xxx', '<', 'changeme', 'your-', 'your_'];
        const isPlaceholder =
          value === '' ||
          value === '""' ||
          value === "''" ||
          placeholders.some((p) => value.startsWith(p));

        if (!isPlaceholder) {
          const preview = value.substring(0, 8) + (value.length > 8 ? '…' : '');
          findings.push({
            rule: 'Env Var: Sensitive Key',
            file: fileLabel,
            line: lineNum,
            preview: `${keyName}=${preview}`,
            severity: 'medium',
          });
          continue;
        }
      }
    }
  }

  return findings;
}

export function init(
  profileDir: string,
  skillNames: string[] = [],
  sourceRoot = HOME,
  force = false
): void {
  // Check if profileDir already exists
  if (fs.existsSync(profileDir)) {
    throw new Error(`Profile directory already exists: ${profileDir}`);
  }

  const username = os.userInfo().username;
  const profileRoot = path.join(profileDir);
  fs.mkdirSync(profileRoot, { recursive: true });

  const allFindings: Finding[] = [];

  // 1. Create sharekit.toml
  const tomlContent = `[profile]
name = "${username}"
version = "0.1.0"
description = "My AI coding setup"
`;
  fs.writeFileSync(path.join(profileRoot, 'sharekit.toml'), tomlContent);
  console.log(kleur.green(`  + ${tildify(path.join(profileRoot, 'sharekit.toml'))}`));

  // 2. Copy CLAUDE.md from source root if it exists
  const sourceClaude = path.join(sourceRoot, '.claude', 'CLAUDE.md');
  const destClaude = path.join(profileRoot, 'claude', 'CLAUDE.md');
  fs.mkdirSync(path.dirname(destClaude), { recursive: true });
  if (fs.existsSync(sourceClaude)) {
    cp(sourceClaude, destClaude);
    console.log(kleur.green(`  + ${tildify(destClaude)}`));
    const content = fs.readFileSync(destClaude, 'utf8');
    const findings = scanForSecrets(content, tildify(destClaude));
    allFindings.push(...findings);
  } else {
    fs.writeFileSync(destClaude, '# My AI coding instructions\n');
    console.log(kleur.green(`  + ${tildify(destClaude)} (placeholder)`));
  }

  // 3. Scaffold cursor/ directory
  const destCursorRules = path.join(profileRoot, 'cursor', '.cursorrules');
  fs.mkdirSync(path.dirname(destCursorRules), { recursive: true });
  const sourceCursorRules = path.join(sourceRoot, '.cursor', '.cursorrules');
  if (fs.existsSync(sourceCursorRules)) {
    cp(sourceCursorRules, destCursorRules);
    console.log(kleur.green(`  + ${tildify(destCursorRules)}`));
    const content = fs.readFileSync(destCursorRules, 'utf8');
    const findings = scanForSecrets(content, tildify(destCursorRules));
    allFindings.push(...findings);
  } else {
    fs.writeFileSync(destCursorRules, '# Cursor IDE rules\n');
    console.log(kleur.green(`  + ${tildify(destCursorRules)} (placeholder)`));
  }

  // 4. Scaffold shared/ directory with .gitkeep
  const destShared = path.join(profileRoot, 'shared');
  fs.mkdirSync(destShared, { recursive: true });
  fs.writeFileSync(path.join(destShared, '.gitkeep'), '');
  console.log(kleur.green(`  + ${tildify(destShared)}/`));

  // 5. Copy skills if specified
  let skillCount = 0;
  for (const skillName of skillNames) {
    const sourceSkill = path.join(sourceRoot, '.claude', 'skills', skillName);
    if (!fs.existsSync(sourceSkill)) {
      console.log(kleur.yellow(`  ~ skill '${skillName}' not found at ${tildify(sourceSkill)}`));
      continue;
    }
    const destSkillBase = path.join(profileRoot, 'claude', 'skills', skillName);
    fs.mkdirSync(destSkillBase, { recursive: true });
    for (const file of walk(sourceSkill)) {
      const rel = path.relative(sourceSkill, file);
      const dest = path.join(destSkillBase, rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      cp(file, dest);
      console.log(kleur.green(`  + ${tildify(dest)}`));
      const content = fs.readFileSync(dest, 'utf8');
      const findings = scanForSecrets(content, tildify(dest));
      allFindings.push(...findings);
      skillCount++;
    }
  }

  console.log(
    kleur.green(
      `\n  ✓ Created profile at ${tildify(profileRoot)}` +
        ` (sharekit.toml, CLAUDE.md, cursor/, shared/${skillCount > 0 ? `, ${skillCount} skill file(s)` : ''})`
    )
  );

  // Print findings and apply gate logic (shared with scan)
  printAndGateFindings(allFindings, force);
}

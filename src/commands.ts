import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import kleur from 'kleur';
import { parseUserRef, fetchProfile, readManifest } from './fetch.js';
import { plan, printPlan, isExecutable, applyProfile } from './plan.js';
import { restoreBackup, listBackups, restoreBackupToStamp } from './backup.js';
import { recordInstall, readInstalled, list, isImmutableRef } from './state.js';
import { scanForSecrets, printAndGateFindings, type Finding } from './scanner.js';
import { walk, tildify, Dirs, DEFAULT_DIRS, cp, ROOTS } from './paths.js';

export interface InstallOpts {
  includeHooks?: boolean;
  yes?: boolean;
  dryRun?: boolean;
}

export async function confirm(q: string, autoYes = false): Promise<boolean> {
  if (autoYes) return true;
  const rl = readline.createInterface({ input, output });
  try {
    const a = await rl.question(kleur.bold(`  ${q} (y/N) `));
    return a.trim().toLowerCase() === 'y';
  } finally {
    rl.close(); // always release the interface, even if question() rejects (EOF/piped stdin)
  }
}

// Discover published profiles: GitHub IS the registry — search for repos named "sharekit-profile".
export async function search(query?: string): Promise<void> {
  const q = encodeURIComponent(`sharekit-profile in:name${query ? ` ${query}` : ''}`);
  const url = `https://api.github.com/search/repositories?q=${q}&sort=stars&per_page=30`;
  let data: { items?: Array<Record<string, unknown>> };
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'sharekit-cli', Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(15_000), // don't hang forever on a stalled GitHub response
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
    kleur.bold(
      `\n  ${profiles.length} profile(s)${query ? ` matching "${query}"` : ''} (showing up to 30):\n`
    )
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
  const { user: userName, ref: userRef } = parseUserRef(user);

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
  const HOME = os.homedir();
  const STATE = path.join(HOME, '.sharekit');

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

  // Read and parse applied.json with safe error handling
  let applied: { dest: string; status: string }[];
  const appliedPath = path.join(dir, 'applied.json');
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
      return { dest, status };
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Backup data is corrupt or unreadable: ${msg}`);
  }

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

  // Read and parse applied.json with safe error handling
  let applied: { dest: string; status: string }[];
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
      return { dest, status };
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Backup data is corrupt or unreadable: ${msg}`);
  }

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

  // Resolve home directory once for bounds checking
  const resolvedHome = path.resolve(dirs.home);

  // Execute the uninstall: reverse all changes
  for (const a of applied) {
    // Bounds-check: ensure dest is within dirs.home
    const resolvedDest = path.resolve(a.dest);
    if (!resolvedDest.startsWith(resolvedHome + path.sep)) {
      console.warn(`Skipping out-of-bounds entry: ${a.dest}`);
      continue;
    }

    if (a.status === 'new') {
      // File was added by the profile — remove it
      fs.rmSync(resolvedDest, { force: true });
    } else if (a.status === 'changed') {
      // File was changed — restore from backup
      const src = path.join(backupDir, path.relative(resolvedHome, resolvedDest));
      if (fs.existsSync(src)) {
        fs.mkdirSync(path.dirname(resolvedDest), { recursive: true });
        cp(src, resolvedDest);
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

export function init(
  profileDir: string,
  skillNames: string[] = [],
  sourceRoot = os.homedir(),
  force = false
): void {
  // Check if profileDir already exists
  if (fs.existsSync(profileDir)) {
    if (!force) {
      throw new Error(`Profile directory already exists: ${profileDir}. Use --force to overwrite.`);
    }
    console.warn(kleur.yellow(`  Overwriting existing ${path.basename(profileDir)}/ ...`));
    fs.rmSync(profileDir, { recursive: true, force: true });
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

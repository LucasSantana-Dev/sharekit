import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { execSync } from "node:child_process";
import TOML from "@iarna/toml";
import kleur from "kleur";

const HOME = os.homedir();
const STATE = path.join(HOME, ".sharekit");

// profile/<tool>/** mirrors into these roots — one rule, not a filename allowlist
const ROOTS: Record<string, string> = {
  claude: path.join(HOME, ".claude"),
  cursor: path.join(HOME, ".cursor"),
  shared: HOME,
};

type Status = "new" | "changed" | "same";
interface PlanFile { tool: string; src: string; dest: string; rel: string; status: Status; }

const tildify = (p: string) => (p.startsWith(HOME) ? "~" + p.slice(HOME.length) : p);

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isSymbolicLink()) return []; // skip symlinks: don't follow into arbitrary files; dir-links would EISDIR on copy
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

// copy a file, preserving its mode (e.g. a skill's executable toggle.sh)
function cp(src: string, dest: string): void {
  fs.copyFileSync(src, dest);
  fs.chmodSync(dest, fs.statSync(src).mode);
}

// ponytail: profile lives at github.com/<user>/sharekit-profile — one convention, not a search
export function fetchProfile(user: string): string {
  const dir = path.join(STATE, "profiles", user);
  if (fs.existsSync(dir)) {
    try {
      execSync(`git -C "${dir}" pull --ff-only`, { stdio: "pipe" });
    } catch {
      // ponytail: refresh is best-effort — offline / no-remote falls back to the cached copy
    }
    return dir;
  }
  fs.mkdirSync(path.dirname(dir), { recursive: true });
  const url = `https://github.com/${user}/sharekit-profile`;
  try {
    execSync(`git clone --depth 1 "${url}" "${dir}"`, { stdio: "pipe" });
  } catch (e) {
    if ((e as { status?: number }).status === 127) {
      throw new Error("git not found — install git to use sharekit (https://git-scm.com)");
    }
    throw new Error(
      `No profile at ${url}\n` +
        `  Publish yours: a repo named "sharekit-profile" with a sharekit.toml`,
    );
  }
  return dir;
}

export function readManifest(profileDir: string): { name: string; version?: string; description?: string } {
  const p = path.join(profileDir, "sharekit.toml");
  if (!fs.existsSync(p)) throw new Error(`Not a sharekit profile (no sharekit.toml in ${profileDir})`);
  let parsed: ReturnType<typeof TOML.parse>;
  try {
    parsed = TOML.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    throw new Error(`Invalid sharekit.toml: ${(e as Error).message}`);
  }
  const profile = (parsed.profile ?? {}) as Record<string, string>;
  return { name: profile.name ?? "unknown", version: profile.version, description: profile.description };
}

export function plan(profileDir: string, roots = ROOTS): PlanFile[] {
  const files: PlanFile[] = [];
  for (const [tool, root] of Object.entries(roots)) {
    const base = path.join(profileDir, tool);
    if (!fs.existsSync(base)) continue;
    for (const src of walk(base)) {
      const rel = path.relative(base, src);
      const dest = path.join(root, rel);
      files.push({ tool, src, dest, rel, status: classify(src, dest) });
    }
  }
  return files;
}

function classify(src: string, dest: string): Status {
  if (!fs.existsSync(dest)) return "new";
  return fs.readFileSync(src).equals(fs.readFileSync(dest)) ? "same" : "changed";
}

// ponytail: settings.json carries hooks (arbitrary shell). v1 never auto-installs it.
//           add `--include-hooks` when someone actually asks.
const isExecutable = (f: PlanFile) => f.tool === "claude" && path.basename(f.dest) === "settings.json";

export function printPlan(files: PlanFile[], manifest: ReturnType<typeof readManifest>): void {
  console.log(kleur.bold(`Profile: ${manifest.name}${manifest.version ? " v" + manifest.version : ""}`));
  if (manifest.description) console.log(kleur.dim("  " + manifest.description));
  const show = (s: Status, label: string, c: (x: string) => string) => {
    const g = files.filter((f) => f.status === s);
    if (!g.length) return;
    console.log(c(`\n  ${label} (${g.length})`));
    for (const f of g) console.log(c(`    ${tildify(f.dest)}`));
  };
  show("new", "+ new", kleur.green);
  show("changed", "~ changed", kleur.yellow);
  const same = files.filter((f) => f.status === "same").length;
  if (same) console.log(kleur.dim(`\n  = ${same} unchanged`));
  if (files.some(isExecutable))
    console.log(kleur.yellow(`\n  ⚠  settings.json present — contains hooks; skipped. Merge manually.`));
}

async function confirm(q: string): Promise<boolean> {
  const rl = readline.createInterface({ input, output });
  const a = await rl.question(kleur.bold(`  ${q} (y/N) `));
  rl.close();
  return a.trim().toLowerCase() === "y";
}

function backup(files: PlanFile[], user: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = path.join(STATE, "backups", `${user}-${stamp}`);
  const applied = files.filter((f) => f.status !== "same" && !isExecutable(f));
  fs.mkdirSync(dir, { recursive: true });
  for (const f of applied.filter((f) => f.status === "changed")) {
    const t = path.join(dir, path.relative(HOME, f.dest));
    fs.mkdirSync(path.dirname(t), { recursive: true });
    cp(f.dest, t);
  }
  fs.writeFileSync(
    path.join(dir, "applied.json"),
    JSON.stringify(applied.map((f) => ({ dest: f.dest, status: f.status })), null, 2),
  );
  return dir;
}

function write(files: PlanFile[]): number {
  let n = 0;
  for (const f of files) {
    if (f.status === "same" || isExecutable(f)) continue;
    fs.mkdirSync(path.dirname(f.dest), { recursive: true });
    cp(f.src, f.dest);
    n++;
  }
  return n;
}

export async function install(user: string): Promise<void> {
  const dir = fetchProfile(user);
  const manifest = readManifest(dir);
  const files = plan(dir);
  console.log();
  printPlan(files, manifest);
  const todo = files.filter((f) => f.status !== "same" && !isExecutable(f));
  if (!todo.length) return void console.log(kleur.dim("\n  Already up to date.\n"));
  if (!(await confirm(`Apply ${todo.length} change(s)?`))) return void console.log(kleur.dim("\n  Aborted.\n"));
  const b = backup(files, user);
  const n = write(files);
  console.log(kleur.green(`\n  ✓ Applied ${n} file(s).`) + kleur.dim(`  Backup: ${tildify(b)}`));
  console.log(kleur.dim(`  Undo: sharekit rollback ${user}\n`));
}

export async function preview(user: string): Promise<void> {
  const dir = fetchProfile(user);
  console.log();
  printPlan(plan(dir), readManifest(dir));
  console.log();
}

export async function rollback(user: string): Promise<void> {
  const root = path.join(STATE, "backups");
  const last = fs.existsSync(root)
    ? fs.readdirSync(root).filter((e) => e.startsWith(user + "-")).sort().pop()
    : undefined;
  if (!last) return void console.log(kleur.yellow(`No backup for ${user}.`));
  const dir = path.join(root, last);
  const applied: { dest: string; status: Status }[] = JSON.parse(fs.readFileSync(path.join(dir, "applied.json"), "utf8"));
  console.log(kleur.bold(`\n  Rollback ${user} → ${tildify(dir)}  (${applied.length} file(s))\n`));
  if (!(await confirm("Restore?"))) return void console.log(kleur.dim("\n  Aborted.\n"));
  for (const a of applied) {
    if (a.status === "new") fs.rmSync(a.dest, { force: true }); // ponytail: leaves empty parent dirs; harmless
    else {
      const src = path.join(dir, path.relative(HOME, a.dest));
      if (fs.existsSync(src)) {
        fs.mkdirSync(path.dirname(a.dest), { recursive: true }); // dest dir may have been removed since install
        cp(src, a.dest);
      }
    }
  }
  console.log(kleur.green("\n  ✓ Restored.\n"));
}

export function init(profileDir: string, skillNames: string[] = [], sourceRoot = HOME): void {
  // Check if profileDir already exists
  if (fs.existsSync(profileDir)) {
    throw new Error(`Profile directory already exists: ${profileDir}`);
  }

  const username = os.userInfo().username;
  const profileRoot = path.join(profileDir);
  fs.mkdirSync(profileRoot, { recursive: true });

  // 1. Create sharekit.toml
  const tomlContent = `[profile]
name = "${username}"
version = "0.1.0"
description = "My AI coding setup"
`;
  fs.writeFileSync(path.join(profileRoot, "sharekit.toml"), tomlContent);
  console.log(kleur.green(`  + ${tildify(path.join(profileRoot, "sharekit.toml"))}`));

  // 2. Copy CLAUDE.md from source root if it exists
  const sourceClaude = path.join(sourceRoot, ".claude", "CLAUDE.md");
  const destClaude = path.join(profileRoot, "claude", "CLAUDE.md");
  fs.mkdirSync(path.dirname(destClaude), { recursive: true });
  if (fs.existsSync(sourceClaude)) {
    cp(sourceClaude, destClaude);
    console.log(kleur.green(`  + ${tildify(destClaude)}`));
  } else {
    fs.writeFileSync(destClaude, "# My AI coding instructions\n");
    console.log(kleur.green(`  + ${tildify(destClaude)} (placeholder)`));
  }

  // 3. Copy skills if specified
  let skillCount = 0;
  for (const skillName of skillNames) {
    const sourceSkill = path.join(sourceRoot, ".claude", "skills", skillName);
    if (!fs.existsSync(sourceSkill)) {
      console.log(kleur.yellow(`  ~ skill '${skillName}' not found at ${tildify(sourceSkill)}`));
      continue;
    }
    const destSkillBase = path.join(profileRoot, "claude", "skills", skillName);
    fs.mkdirSync(destSkillBase, { recursive: true });
    for (const file of walk(sourceSkill)) {
      const rel = path.relative(sourceSkill, file);
      const dest = path.join(destSkillBase, rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      cp(file, dest);
      console.log(kleur.green(`  + ${tildify(dest)}`));
      skillCount++;
    }
  }

  console.log(
    kleur.green(
      `\n  ✓ Created profile at ${tildify(profileRoot)}` +
        ` (sharekit.toml, CLAUDE.md${skillCount > 0 ? `, ${skillCount} skill file(s)` : ""})`,
    ),
  );
}

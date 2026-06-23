import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import kleur from "kleur";
import type { ResolvedFile } from "./profile.js";

export type FileStatus = "new" | "update" | "unchanged";

export interface FileDiff {
  file: ResolvedFile;
  status: FileStatus;
}

export function computeDiff(files: ResolvedFile[]): FileDiff[] {
  return files.map((f) => {
    if (!fs.existsSync(f.dest)) return { file: f, status: "new" };

    if (f.type === "dir") {
      return { file: f, status: "update" };
    }

    const srcContent = fs.readFileSync(f.src, "utf8");
    const destContent = fs.readFileSync(f.dest, "utf8");
    const status: FileStatus = srcContent === destContent ? "unchanged" : "update";
    return { file: f, status };
  });
}

export function printDiff(diffs: FileDiff[]): void {
  const home = os.homedir();
  const tildify = (p: string) => p.startsWith(home) ? `~${p.slice(home.length)}` : p;

  const byStatus = {
    new: diffs.filter((d) => d.status === "new"),
    update: diffs.filter((d) => d.status === "update"),
    unchanged: diffs.filter((d) => d.status === "unchanged"),
  };

  if (byStatus.new.length) {
    console.log(kleur.green().bold(`\n  + New files (${byStatus.new.length})`));
    for (const d of byStatus.new) {
      console.log(kleur.green(`    + ${tildify(d.file.dest)}`));
    }
  }

  if (byStatus.update.length) {
    console.log(kleur.yellow().bold(`\n  ~ Updates (${byStatus.update.length})`));
    for (const d of byStatus.update) {
      console.log(kleur.yellow(`    ~ ${tildify(d.file.dest)}`));
    }
  }

  if (byStatus.unchanged.length) {
    console.log(kleur.dim(`\n  = Unchanged (${byStatus.unchanged.length})`));
    for (const d of byStatus.unchanged) {
      console.log(kleur.dim(`    = ${tildify(d.file.dest)}`));
    }
  }

  const actionable = byStatus.new.length + byStatus.update.length;
  console.log();
  if (actionable === 0) {
    console.log(kleur.dim("  Already up to date."));
  } else {
    console.log(kleur.bold(`  ${actionable} file(s) will change.`));
  }
}

export function hasHooks(profileDir: string): boolean {
  const settingsPath = path.join(profileDir, "claude", "settings.json");
  if (!fs.existsSync(settingsPath)) return false;
  try {
    const s = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    return Boolean(s.hooks && Object.keys(s.hooks).length > 0);
  } catch {
    return false;
  }
}

import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import kleur from "kleur";
import type { FileDiff } from "../lib/diff.js";

interface ApplyOptions {
  includeHooks: boolean;
}

export async function applyFiles(diffs: FileDiff[], opts: ApplyOptions): Promise<void> {
  for (const diff of diffs) {
    if (diff.status === "unchanged") continue;

    const { src, dest, type } = diff.file;

    // Security: skip settings.json (contains hooks) unless explicitly opted in
    if (!opts.includeHooks && path.basename(dest) === "settings.json") {
      console.log(kleur.dim(`    skipped  ${path.basename(dest)} (hooks excluded)`));
      continue;
    }

    fs.mkdirSync(path.dirname(dest), { recursive: true });

    if (type === "dir") {
      if (fs.existsSync(dest)) {
        execSync(`cp -r "${src}/." "${dest}/"`);
      } else {
        execSync(`cp -r "${src}" "${dest}"`);
      }
    } else {
      fs.copyFileSync(src, dest);
    }

    const symbol = diff.status === "new" ? kleur.green("+") : kleur.yellow("~");
    console.log(`    ${symbol}  ${path.basename(dest)}`);
  }
}

export async function runApply(_args: string[]): Promise<void> {
  console.log(kleur.dim("Run `sharekit install <username>` to preview and apply a profile."));
}

import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import kleur from "kleur";
import { fetchProfile } from "../lib/fetch.js";
import { parseManifest, resolveFiles } from "../lib/profile.js";
import { computeDiff, printDiff, hasHooks } from "../lib/diff.js";
import { createBackup } from "../lib/backup.js";
import { applyFiles } from "./apply.js";

export async function runInstall(args: string[]): Promise<void> {
  const username = args[0];
  if (!username) {
    console.error(kleur.red("Usage: sharekit install <username>"));
    process.exit(1);
  }

  console.log(kleur.bold(`\nsharekit — fetching profile for ${kleur.cyan(username)}...\n`));

  const profileDir = await fetchProfile(username);
  const manifest = parseManifest(profileDir);
  const files = resolveFiles(profileDir, manifest);
  const diffs = computeDiff(files);

  console.log(kleur.bold(`Profile: ${manifest.profile.name} v${manifest.profile.version}`));
  if (manifest.profile.description) {
    console.log(kleur.dim(`  ${manifest.profile.description}`));
  }

  printDiff(diffs);

  if (hasHooks(profileDir)) {
    console.log(kleur.yellow().bold("\n  ⚠  This profile includes Claude Code hooks (settings.json)."));
    console.log(kleur.yellow("     Hooks execute shell commands automatically. Review before applying."));
    console.log(kleur.dim("     Hooks will NOT be installed in this version. Use --include-hooks to override.\n"));
  }

  const actionable = diffs.filter((d) => d.status !== "unchanged");
  if (actionable.length === 0) {
    console.log(kleur.dim("Nothing to do.\n"));
    return;
  }

  const rl = readline.createInterface({ input, output });
  const answer = await rl.question(kleur.bold("  Apply? (y/N) "));
  rl.close();

  if (answer.toLowerCase() !== "y") {
    console.log(kleur.dim("\n  Aborted.\n"));
    return;
  }

  const backupDir = createBackup(files, username);
  console.log(kleur.dim(`\n  Backup → ${backupDir}`));

  await applyFiles(diffs, { includeHooks: false });

  console.log(kleur.green().bold(`\n  ✓ Profile installed.\n`));
  console.log(kleur.dim(`  To undo: ${kleur.white("sharekit rollback")}\n`));
}

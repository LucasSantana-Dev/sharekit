import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import kleur from "kleur";
import { lastBackupFor, restoreBackup } from "../lib/backup.js";

export async function runRollback(args: string[]): Promise<void> {
  const username = args[0];
  if (!username) {
    console.error(kleur.red("Usage: sharekit rollback <username>"));
    process.exit(1);
  }

  const backup = lastBackupFor(username);
  if (!backup) {
    console.log(kleur.yellow(`No backup found for ${username}.`));
    return;
  }

  console.log(kleur.bold(`\nRollback to: ${kleur.cyan(backup)}\n`));

  const rl = readline.createInterface({ input, output });
  const answer = await rl.question(kleur.bold("  Restore? (y/N) "));
  rl.close();

  if (answer.toLowerCase() !== "y") {
    console.log(kleur.dim("\n  Aborted.\n"));
    return;
  }

  restoreBackup(backup);
  console.log(kleur.green().bold("\n  ✓ Restored.\n"));
}

import kleur from "kleur";
import { fetchProfile } from "../lib/fetch.js";
import { parseManifest, resolveFiles } from "../lib/profile.js";
import { computeDiff, printDiff, hasHooks } from "../lib/diff.js";

export async function runPreview(args: string[]): Promise<void> {
  const username = args[0];
  if (!username) {
    console.error(kleur.red("Usage: sharekit preview <username>"));
    process.exit(1);
  }

  console.log(kleur.bold(`\nsharekit preview — ${kleur.cyan(username)}\n`));

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
    console.log(kleur.yellow().bold("\n  ⚠  Hooks detected in settings.json (excluded from install by default)."));
  }
}

#!/usr/bin/env node
import kleur from "kleur";

const VERSION = "0.1.0";

const USAGE = `${kleur.bold("sharekit")} v${VERSION} — share your AI coding setup

${kleur.bold("Commands:")}
  ${kleur.cyan("install")} <username>    Fetch, preview, and apply a profile
  ${kleur.cyan("preview")} <username>    Show what would change without applying
  ${kleur.cyan("rollback")} <username>   Restore files from last backup

${kleur.bold("Examples:")}
  sharekit install lucassantana
  sharekit preview lucassantana
  sharekit rollback lucassantana

${kleur.bold("Publishing your profile:")}
  Create a GitHub repo named ${kleur.cyan("sharekit-profile")} with a ${kleur.cyan("sharekit.toml")} manifest.
  See: https://github.com/LucasSantana-Dev/sharekit-profile for an example.
`;

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);

  if (!cmd || cmd === "--help" || cmd === "-h") {
    console.log(USAGE);
    return;
  }

  if (cmd === "--version" || cmd === "-V") {
    console.log(VERSION);
    return;
  }

  switch (cmd) {
    case "install": {
      const { runInstall } = await import("./commands/install.js");
      return runInstall(rest);
    }
    case "preview": {
      const { runPreview } = await import("./commands/preview.js");
      return runPreview(rest);
    }
    case "rollback": {
      const { runRollback } = await import("./commands/rollback.js");
      return runRollback(rest);
    }
    default:
      console.error(kleur.red(`unknown command: ${cmd}\n`));
      console.log(USAGE);
      process.exit(1);
  }
}

main().catch((err: Error) => {
  console.error(kleur.red(`\nerror: ${err.message}\n`));
  process.exit(1);
});

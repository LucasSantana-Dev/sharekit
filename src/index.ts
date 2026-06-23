#!/usr/bin/env node
import kleur from "kleur";
import { install, preview, rollback } from "./sharekit.js";

const VERSION = "0.1.0";
const USAGE = `${kleur.bold("sharekit")} v${VERSION} — share your AI coding setup

  ${kleur.cyan("install")}  <user>   fetch, preview, apply a profile
  ${kleur.cyan("preview")}  <user>   show changes, apply nothing
  ${kleur.cyan("rollback")} <user>   restore the last backup

  Publish yours: a GitHub repo named ${kleur.cyan("sharekit-profile")} with a ${kleur.cyan("sharekit.toml")}.
`;

const cmds: Record<string, (u: string) => Promise<void>> = { install, preview, rollback };
const [cmd, arg] = process.argv.slice(2);

async function main() {
  if (!cmd || cmd === "-h" || cmd === "--help") return void console.log(USAGE);
  if (cmd === "-V" || cmd === "--version") return void console.log(VERSION);
  const fn = cmds[cmd];
  if (!fn) {
    console.error(kleur.red(`unknown command: ${cmd}`));
    return void console.log(USAGE);
  }
  if (!arg) {
    console.error(kleur.red(`usage: sharekit ${cmd} <user>`));
    process.exit(1);
  }
  await fn(arg);
}

main().catch((e: Error) => {
  console.error(kleur.red(`\nerror: ${e.message}\n`));
  process.exit(1);
});

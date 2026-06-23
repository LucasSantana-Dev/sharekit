#!/usr/bin/env node
import kleur from 'kleur';
import { install, preview, rollback, init } from './sharekit.js';

const VERSION = '0.2.0';
const USAGE = `${kleur.bold('sharekit')} v${VERSION} — share your AI coding setup

  ${kleur.cyan('init')}     [skill...]              scaffold a publishable profile in ./sharekit-profile
  ${kleur.cyan('install')}  <user>[@<ref>] [opts]  fetch, preview, apply a profile
                              --include-hooks      also install settings.json with shell hooks
  ${kleur.cyan('preview')}  <user>[@<ref>]         show changes, apply nothing
  ${kleur.cyan('rollback')} <user>                 restore the last backup

  Publish yours: a GitHub repo named ${kleur.cyan('sharekit-profile')} with a ${kleur.cyan('sharekit.toml')}.
  Pin to a branch/tag: ${kleur.cyan('sharekit install user@v1.0')} or ${kleur.cyan('sharekit install user@stable')}.
`;

type CmdFn = (arg: string, opts?: any) => Promise<void> | void;
const cmds: Record<string, CmdFn> = { install, preview, rollback };
const argv = process.argv.slice(2);
const [cmd, ...rest] = argv;

async function main() {
  if (!cmd || cmd === '-h' || cmd === '--help') return void console.log(USAGE);
  if (cmd === '-V' || cmd === '--version') return void console.log(VERSION);

  if (cmd === 'init') {
    console.log();
    init('./sharekit-profile', rest);
    return;
  }

  const fn = cmds[cmd];
  if (!fn) {
    console.error(kleur.red(`unknown command: ${cmd}`));
    return void console.log(USAGE);
  }
  const arg = rest[0];
  if (!arg) {
    console.error(kleur.red(`usage: sharekit ${cmd} <user>${cmd === 'install' ? '[@<ref>]' : ''}`));
    process.exit(1);
  }

  // Parse options for install command
  const opts: any = {};
  if (cmd === 'install') {
    if (rest.includes('--include-hooks')) {
      opts.includeHooks = true;
    }
  }

  await fn(arg, opts);
}

main().catch((e: Error) => {
  console.error(kleur.red(`\nerror: ${e.message}\n`));
  process.exit(1);
});

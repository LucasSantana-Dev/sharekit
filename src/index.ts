#!/usr/bin/env node
import kleur from 'kleur';
import { install, preview, rollback, init, search, scan, type InstallOpts } from './sharekit.js';

const VERSION = '0.3.0';
const USAGE = `${kleur.bold('sharekit')} v${VERSION} — share your AI coding setup

  ${kleur.cyan('init')}     [skill...]              scaffold a publishable profile in ./sharekit-profile
                              --force              override high-severity secret blocking
  ${kleur.cyan('scan')}     [dir]                   scan an existing profile for secrets
                              --force              exit 0 even if high-severity findings detected
  ${kleur.cyan('install')}  <user>[@<ref>] [opts]  fetch, preview, apply a profile
                              --include-hooks      also install settings.json with shell hooks
  ${kleur.cyan('preview')}  <user>[@<ref>]         show changes, apply nothing
  ${kleur.cyan('rollback')} <user>                 restore the last backup
  ${kleur.cyan('search')}   [query]                discover published profiles on GitHub

  Publish yours: a GitHub repo named ${kleur.cyan('sharekit-profile')} with a ${kleur.cyan('sharekit.toml')}.
  Pin to a branch/tag: ${kleur.cyan('sharekit install user@v1.0')} or ${kleur.cyan('sharekit install user@stable')}.
`;

type CmdFn = (arg: string, opts?: InstallOpts) => Promise<void>;
const cmds: Record<string, CmdFn> = { install, preview, rollback };
const argv = process.argv.slice(2);
const [cmd, ...rest] = argv;

async function main() {
  if (!cmd || cmd === '-h' || cmd === '--help') return void console.log(USAGE);
  if (cmd === '-V' || cmd === '--version') return void console.log(VERSION);

  if (cmd === 'init') {
    console.log();
    const flags = rest.filter((x) => x.startsWith('--'));
    const skillNames = rest.filter((x) => !x.startsWith('--'));
    const force = flags.includes('--force');
    init('./sharekit-profile', skillNames, undefined, force);
    return;
  }

  if (cmd === 'search') {
    await search(rest.find((x) => !x.startsWith('--')));
    return;
  }

  if (cmd === 'scan') {
    console.log();
    const flags = rest.filter((x) => x.startsWith('--'));
    const dir = rest.find((x) => !x.startsWith('--'));
    const force = flags.includes('--force');
    await scan(dir, force);
    return;
  }

  const fn = cmds[cmd];
  if (!fn) {
    console.error(kleur.red(`unknown command: ${cmd}`));
    return void console.log(USAGE);
  }
  // Separate flags from positionals so flags work in any position
  const flags = rest.filter((x) => x.startsWith('--'));
  const arg = rest.find((x) => !x.startsWith('--'));
  if (!arg) {
    const showRef = cmd === 'install' || cmd === 'preview';
    console.error(kleur.red(`usage: sharekit ${cmd} <user>${showRef ? '[@<ref>]' : ''}`));
    process.exit(1);
  }

  const opts: InstallOpts = {};
  if (cmd === 'install' && flags.includes('--include-hooks')) {
    opts.includeHooks = true;
  }

  await fn(arg, opts);
}

main().catch((e: Error) => {
  console.error(kleur.red(`\nerror: ${e.message}\n`));
  process.exit(1);
});

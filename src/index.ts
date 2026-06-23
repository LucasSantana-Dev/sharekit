#!/usr/bin/env node
import kleur from 'kleur';
import {
  install,
  preview,
  rollback,
  init,
  search,
  scan,
  listBackups,
  restoreBackupToStamp,
  type InstallOpts,
} from './sharekit.js';

const VERSION = '0.3.0';
const USAGE = `${kleur.bold('sharekit')} v${VERSION} — share your AI coding setup

  ${kleur.cyan('init')}     [skill...]              scaffold a publishable profile in ./sharekit-profile
                              --force              override high-severity secret blocking
  ${kleur.cyan('scan')}     [dir]                   scan an existing profile for secrets
                              --force              exit 0 even if high-severity findings detected
  ${kleur.cyan('install')}  <user>[@<ref>] [opts]  fetch, preview, apply a profile
                              --include-hooks      also install settings.json with shell hooks
  ${kleur.cyan('preview')}  <user>[@<ref>]         show changes, apply nothing
  ${kleur.cyan('rollback')} <user> [opts]          restore the last backup
                              --list               list available backups
                              --to <stamp>         restore a specific backup by timestamp
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
    // Positional arg (optional directory) separated from flags by -- prefix
    const flags = rest.filter((x) => x.startsWith('--'));
    const dir = rest.find((x) => !x.startsWith('--'));
    const force = flags.includes('--force');
    await scan(dir, force);
    return;
  }

  if (cmd === 'rollback') {
    console.log();
    // Parse flags and positional user argument
    let i = 0;
    let user: string | undefined;
    let listMode = false;
    let toStamp: string | undefined;

    while (i < rest.length) {
      const arg = rest[i];
      if (arg === '--list') {
        listMode = true;
        i++;
      } else if (arg === '--to') {
        if (i + 1 >= rest.length) {
          console.error(kleur.red('error: --to requires a stamp argument'));
          process.exit(1);
        }
        toStamp = rest[i + 1];
        i += 2;
      } else if (!arg.startsWith('--')) {
        user = arg;
        i++;
      } else {
        console.error(kleur.red(`unknown flag: ${arg}`));
        process.exit(1);
      }
    }

    if (!user) {
      console.error(kleur.red('usage: sharekit rollback <user> [--list] [--to <stamp>]'));
      process.exit(1);
    }

    if (listMode) {
      const backups = listBackups(user);
      if (backups.length === 0) {
        console.log(kleur.yellow(`  No backups found for ${user}.\n`));
        return;
      }
      console.log(kleur.bold(`\n  Backups for ${user} (newest first):\n`));
      for (let idx = 0; idx < backups.length; idx++) {
        const b = backups[idx];
        // Format timestamp for display: convert ISO-like format to readable date
        const dateStr = b.stamp
          .replace(/([0-9]{4})-([0-9]{2})-([0-9]{2})T/, '$1-$2-$3 ')
          .replace(/T/g, ' ')
          .replace(/-/g, ':')
          .replace(/([0-9]{2}):([0-9]{2}):([0-9]{2}):/, '$1:$2:$3 ');
        console.log(kleur.dim(`  ${idx + 1}. ${dateStr}`));
        console.log(kleur.dim(`     ${b.fileCount} file(s) — stamp: ${b.stamp}`));
      }
      console.log();
      return;
    }

    if (toStamp) {
      restoreBackupToStamp(user, toStamp);
      console.log(kleur.green('\n  ✓ Restored.\n'));
      return;
    }

    // Default: restore latest
    await rollback(user);
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

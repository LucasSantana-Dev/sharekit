import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { plan, applyProfile, pruneBackups, parseUserRef } from '../src/sharekit.ts';

test('pruneBackups keeps only the 5 most recent for the user', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-prune-'));
  const backups = path.join(tmp, 'backups');
  fs.mkdirSync(backups, { recursive: true });
  const stamps = [
    '2026-01-01',
    '2026-02-01',
    '2026-03-01',
    '2026-04-01',
    '2026-05-01',
    '2026-06-01',
    '2026-07-01',
  ];
  for (const s of stamps) fs.mkdirSync(path.join(backups, `alice-${s}`));
  fs.mkdirSync(path.join(backups, 'bob-2026-01-01')); // another user — must be untouched

  pruneBackups('alice', tmp); // state dir is the parent of backups/

  const remaining = fs
    .readdirSync(backups)
    .filter((e) => e.startsWith('alice-'))
    .sort();
  assert.deepEqual(remaining, [
    'alice-2026-03-01',
    'alice-2026-04-01',
    'alice-2026-05-01',
    'alice-2026-06-01',
    'alice-2026-07-01',
  ]);
  assert.ok(fs.existsSync(path.join(backups, 'bob-2026-01-01')), 'other users untouched');
  fs.rmSync(tmp, { recursive: true });
});

test('applyProfile installs settings.json only when includeHooks is set', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-hooks-'));
  const profile = path.join(tmp, 'profile');
  fs.mkdirSync(path.join(profile, 'claude'), { recursive: true });
  fs.writeFileSync(path.join(profile, 'claude', 'CLAUDE.md'), 'rules');
  fs.writeFileSync(path.join(profile, 'claude', 'settings.json'), '{"hooks":{}}');

  const settingsAfter = (label: string, includeHooks: boolean) => {
    const home = path.join(tmp, label);
    const roots = {
      claude: path.join(home, '.claude'),
      cursor: path.join(home, '.cursor'),
      shared: home,
    };
    const dirs = { home, state: path.join(home, 'state') };
    applyProfile(plan(profile, roots), 'u', includeHooks, dirs);
    return path.join(home, '.claude', 'settings.json');
  };

  assert.ok(!fs.existsSync(settingsAfter('without', false)), 'settings.json skipped by default');
  assert.ok(
    fs.existsSync(settingsAfter('with', true)),
    'settings.json installed with --include-hooks'
  );
  fs.rmSync(tmp, { recursive: true });
});

test('parseUserRef splits user and ref', () => {
  const { user: u1, ref: r1 } = parseUserRef('alice');
  assert.equal(u1, 'alice', 'user only: no ref');
  assert.equal(r1, undefined, 'user only: ref is undefined');

  const { user: u2, ref: r2 } = parseUserRef('alice@v1.0');
  assert.equal(u2, 'alice', 'user@ref: user part');
  assert.equal(r2, 'v1.0', 'user@ref: ref part');

  const { user: u3, ref: r3 } = parseUserRef('alice@a@b');
  assert.equal(u3, 'alice@a', 'user@a@b: user part (takes last @)');
  assert.equal(r3, 'b', 'user@a@b: ref is last segment');
});

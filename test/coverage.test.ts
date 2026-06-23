import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  confirm,
  plan,
  applyProfile,
  recordInstall,
  readInstalled,
  uninstall,
  restoreBackup,
  scan,
} from '../src/sharekit.ts';

// Builds a temp profile + home/state and returns the pieces used across tests.
function setup(label: string) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `sk-cov-${label}-`));
  const profile = path.join(tmp, 'profile');
  const home = path.join(tmp, 'home');
  const state = path.join(tmp, 'state');
  fs.mkdirSync(path.join(profile, 'claude'), { recursive: true });
  fs.writeFileSync(path.join(profile, 'claude', 'CLAUDE.md'), 'profile content\n');
  fs.writeFileSync(path.join(profile, 'sharekit.toml'), '[profile]\nname="acme"\nversion="1.0"\n');
  const roots = { claude: path.join(home, '.claude'), shared: home };
  const dirs = { home, state };
  return { tmp, profile, home, state, roots, dirs };
}

// #85 — --yes (autoYes) auto-confirms without reading stdin
test('confirm(autoYes=true) returns true without prompting', async () => {
  // No stdin is provided; if this read the terminal it would hang the test.
  assert.equal(await confirm('proceed?', true), true);
});

// #84 — --dry-run writes nothing (no files, no backup, returns empty backupDir)
test('applyProfile dry-run writes no files and creates no backup', () => {
  const { home, state, profile, roots, dirs } = setup('dry');
  const files = plan(profile, roots);
  const res = applyProfile(files, 'acme', false, dirs, true /* dryRun */);

  assert.equal(res.backupDir, '', 'dry-run returns no backup dir');
  assert.ok(res.filesWritten > 0, 'still reports what WOULD be written');
  assert.ok(!fs.existsSync(path.join(home, '.claude', 'CLAUDE.md')), 'no file written to home');
  assert.ok(
    !fs.existsSync(path.join(state, 'backups')) ||
      fs.readdirSync(path.join(state, 'backups')).length === 0,
    'no backup created'
  );
});

// #86 — writeAtomic restores the backup and rethrows when a write fails mid-way
test('apply restores pre-install state when a later write fails', (t) => {
  const { home, profile, roots, dirs } = setup('atomic');
  // First, a clean apply so a baseline + backup machinery exist.
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(home, '.claude', 'CLAUDE.md'), 'ORIGINAL\n'); // pre-install content

  // Second profile file that lands in a directory we will lock to force a write failure.
  fs.writeFileSync(path.join(profile, 'claude', 'second.md'), 'second\n');

  const files = plan(profile, roots);
  // Lock the dest dir AFTER planning so the second write (a new file) fails with EACCES.
  const lockDir = path.join(home, '.claude');
  // Make CLAUDE.md (changed) the obstacle: chmod it read-only so copyFileSync over it fails.
  // (skip if running as root, where perms are bypassed)
  if (process.getuid && process.getuid() === 0) return t.skip('root bypasses file perms');
  fs.chmodSync(path.join(lockDir, 'CLAUDE.md'), 0o444);

  let threw = false;
  try {
    applyProfile(files, 'acme', false, dirs); // not dry-run
  } catch {
    threw = true;
  } finally {
    fs.chmodSync(path.join(lockDir, 'CLAUDE.md'), 0o644);
  }

  assert.ok(threw, 'apply rethrows the write failure');
  // The changed file must be back to its pre-install content (restored from backup), not partial.
  assert.equal(
    fs.readFileSync(path.join(home, '.claude', 'CLAUDE.md'), 'utf8'),
    'ORIGINAL\n',
    'pre-install content restored'
  );
});

// #87 — uninstall restores the BACKUP (pre-install) state, even after a post-install edit
test('uninstall restores pre-install state from backup, deletes new files', async () => {
  const { home, profile, state, roots, dirs } = setup('uninstall');
  // Pre-install: CLAUDE.md exists with original content (a "changed" file on apply).
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(home, '.claude', 'CLAUDE.md'), 'ORIGINAL\n');
  // Profile also adds a brand-new file.
  fs.writeFileSync(path.join(profile, 'claude', 'NEW.md'), 'new file\n');

  const files = plan(profile, roots);
  applyProfile(files, 'acme', false, dirs);
  recordInstall('acme', profile, 'HEAD', '1.0', dirs);

  // Post-install: user edits the applied file.
  fs.writeFileSync(path.join(home, '.claude', 'CLAUDE.md'), 'MANUALLY EDITED\n');

  await uninstall('acme', dirs, true /* force: skip prompt */);

  assert.equal(
    fs.readFileSync(path.join(home, '.claude', 'CLAUDE.md'), 'utf8'),
    'ORIGINAL\n',
    'restored to pre-install backup content (not the edited or profile content)'
  );
  assert.ok(!fs.existsSync(path.join(home, '.claude', 'NEW.md')), 'new file removed');
  assert.equal(readInstalled(dirs)['acme'], undefined, 'install record deleted');
});

// #88 — restoreBackup surfaces sourceCommit: null (the offline-cache signal the rollback message uses)
test('restoreBackup returns sourceCommit:null when the backup metadata has it', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-cov-null-'));
  const home = path.join(tmp, 'home');
  const state = path.join(tmp, 'state');
  fs.mkdirSync(home, { recursive: true });
  const backupDir = path.join(state, 'backups', 'acme-2026-01-01T00-00-00-000Z');
  fs.mkdirSync(backupDir, { recursive: true });
  fs.writeFileSync(path.join(backupDir, 'applied.json'), '[]');
  // metadata from an offline-cache install: version known, commit unresolved
  fs.writeFileSync(
    path.join(backupDir, 'metadata.json'),
    JSON.stringify({ sourceVersion: '1.0', sourceCommit: null })
  );

  const meta = restoreBackup('acme', { home, state });
  assert.equal(meta.sourceCommit, null, 'null commit surfaced for the offline-cache message');
  assert.equal(meta.sourceVersion, '1.0');
});

// #90 — scan error paths: missing dir and an unforced high-severity finding both reject
test('scan rejects on a missing profile dir', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-cov-scan-'));
  await assert.rejects(
    () => scan(path.join(tmp, 'does-not-exist'), false),
    /No profile|not exist/i
  );
});

test('scan blocks on a high-severity finding without --force', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-cov-scanhi-'));
  fs.mkdirSync(path.join(tmp, 'claude'), { recursive: true });
  // a private-key block is HIGH severity → scan must throw (exit non-zero) without --force
  fs.writeFileSync(
    path.join(tmp, 'claude', 'CLAUDE.md'),
    '-----BEGIN RSA PRIVATE KEY-----\nFAKE\n-----END RSA PRIVATE KEY-----\n'
  );
  await assert.rejects(() => scan(tmp, false));
  // with --force it must NOT throw
  await assert.doesNotReject(() => scan(tmp, true));
});

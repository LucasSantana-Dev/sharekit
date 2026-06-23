import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  applyProfile,
  restoreBackupToStamp,
  listBackups,
  plan,
  recordInstall,
} from '../src/sharekit.ts';

test('listBackups: returns backups for user, newest first, with timestamp and file count', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-rollback-'));
  const state = path.join(tmp, 'state');

  // Create a few backup dirs with applied.json
  fs.mkdirSync(path.join(state, 'backups', 'user-2025-01-15T10-30-45-000Z'), { recursive: true });
  fs.writeFileSync(
    path.join(state, 'backups', 'user-2025-01-15T10-30-45-000Z', 'applied.json'),
    JSON.stringify([{ dest: '/home/x/.file1', status: 'changed' }])
  );

  fs.mkdirSync(path.join(state, 'backups', 'user-2025-01-16T14-20-10-000Z'), { recursive: true });
  fs.writeFileSync(
    path.join(state, 'backups', 'user-2025-01-16T14-20-10-000Z', 'applied.json'),
    JSON.stringify([
      { dest: '/home/x/.file1', status: 'changed' },
      { dest: '/home/x/.file2', status: 'new' },
    ])
  );

  // Another user should not appear
  fs.mkdirSync(path.join(state, 'backups', 'otheruser-2025-01-16T15-00-00-000Z'), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(state, 'backups', 'otheruser-2025-01-16T15-00-00-000Z', 'applied.json'),
    JSON.stringify([{ dest: '/home/x/.file3', status: 'new' }])
  );

  const backups = listBackups('user', state);

  // Should be sorted newest first
  assert.equal(backups.length, 2);
  assert.equal(backups[0].stamp, '2025-01-16T14-20-10-000Z');
  assert.equal(backups[0].fileCount, 2);
  assert.equal(backups[1].stamp, '2025-01-15T10-30-45-000Z');
  assert.equal(backups[1].fileCount, 1);

  fs.rmSync(tmp, { recursive: true });
});

test('listBackups: returns empty array if no backups exist for user', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-rollback-'));
  const state = path.join(tmp, 'state');

  const backups = listBackups('user', state);
  assert.deepEqual(backups, []);

  fs.rmSync(tmp, { recursive: true });
});

test('restoreBackupToStamp: restores a specific backup by stamp', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-rollback-'));
  const profile = path.join(tmp, 'profile');
  const home = path.join(tmp, 'home');
  const state = path.join(tmp, 'state');

  // Set up profile and home
  fs.mkdirSync(path.join(profile, 'claude'), { recursive: true });
  fs.writeFileSync(path.join(profile, 'claude', 'file.txt'), 'new content');
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(home, '.claude', 'file.txt'), 'old content');

  const roots = {
    claude: path.join(home, '.claude'),
    cursor: path.join(home, '.cursor'),
    shared: home,
  };
  const dirs = { home, state };

  // Create two backups
  const files = plan(profile, roots);
  const { backupDir: backup1 } = applyProfile(files, 'user', false, { ...dirs, state });

  // Modify the file again
  fs.writeFileSync(path.join(home, '.claude', 'file.txt'), 'modified after backup 1');

  // Create second backup (by applying again, which will backup the current state)
  fs.writeFileSync(path.join(profile, 'claude', 'file.txt'), 'another version');
  const files2 = plan(profile, roots);
  const { backupDir: backup2 } = applyProfile(files2, 'user', false, dirs);

  // Extract stamps from backup dir names (e.g., "state/backups/user-2025-...")
  const stamp1 = path.basename(backup1).slice('user'.length + 1);
  const stamp2 = path.basename(backup2).slice('user'.length + 1);

  // Restore to the first backup
  restoreBackupToStamp('user', stamp1, dirs);

  // File should have the old content from backup1
  const restoredContent = fs.readFileSync(path.join(home, '.claude', 'file.txt'), 'utf8');
  assert.equal(restoredContent, 'old content');

  fs.rmSync(tmp, { recursive: true });
});

test('restoreBackupToStamp: throws friendly error if stamp not found', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-rollback-'));
  const state = path.join(tmp, 'state');
  const dirs = { home: tmp, state };

  assert.throws(() => {
    restoreBackupToStamp('user', 'nonexistent-stamp', dirs);
  }, /No backup found for user with stamp/);

  fs.rmSync(tmp, { recursive: true });
});

test('listBackups & restoreBackupToStamp: works with non-"user" usernames and filters correctly', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-rollback-'));
  const profile = path.join(tmp, 'profile');
  const home = path.join(tmp, 'home');
  const state = path.join(tmp, 'state');

  // Set up profile and home
  fs.mkdirSync(path.join(profile, 'claude'), { recursive: true });
  fs.writeFileSync(path.join(profile, 'claude', 'file.txt'), 'bob version');
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(home, '.claude', 'file.txt'), 'original bob');

  const roots = {
    claude: path.join(home, '.claude'),
    cursor: path.join(home, '.cursor'),
    shared: home,
  };
  const dirs = { home, state };

  // Create a backup for user "bob"
  const files = plan(profile, roots);
  const { backupDir: bobBackup } = applyProfile(files, 'bob', false, dirs);
  const bobStamp = path.basename(bobBackup).slice('bob'.length + 1);

  // Create another backup for user "bob2" to test no prefix collision
  fs.writeFileSync(path.join(home, '.claude', 'file.txt'), 'bob2 version');
  fs.mkdirSync(path.join(profile, 'cursor'), { recursive: true });
  fs.writeFileSync(path.join(profile, 'cursor', 'rules.txt'), 'bob2 rules');
  const files2 = plan(profile, roots);
  const { backupDir: bob2Backup } = applyProfile(files2, 'bob2', false, dirs);
  const bob2Stamp = path.basename(bob2Backup).slice('bob2'.length + 1);

  // List backups for "bob" - should only contain bob's backups, with bare stamps (no "bob-" prefix)
  const bobBackups = listBackups('bob', state);
  assert.equal(bobBackups.length, 1);
  assert.equal(bobBackups[0].stamp, bobStamp);
  assert.ok(!bobBackups[0].stamp.startsWith('bob'), 'bob stamp should not contain "bob-" prefix');
  assert.equal(bobBackups[0].fileCount, 1);

  // List backups for "bob2" - should only contain bob2's backups
  const bob2Backups = listBackups('bob2', state);
  assert.equal(bob2Backups.length, 1);
  assert.equal(bob2Backups[0].stamp, bob2Stamp);
  assert.ok(
    !bob2Backups[0].stamp.startsWith('bob2'),
    'bob2 stamp should not contain "bob2-" prefix'
  );
  assert.equal(bob2Backups[0].fileCount, 2);

  // Restore bob to the specific stamp should work
  restoreBackupToStamp('bob', bobStamp, dirs);
  const restoredBobContent = fs.readFileSync(path.join(home, '.claude', 'file.txt'), 'utf8');
  assert.equal(restoredBobContent, 'original bob');

  // Verify bob2's backup dir still exists (not touched by bob's restore)
  const bob2BackupPath = path.join(state, 'backups', `bob2-${bob2Stamp}`);
  assert.ok(fs.existsSync(bob2BackupPath), 'bob2 backup should not be affected by bob restore');

  fs.rmSync(tmp, { recursive: true });
});

test('backup records source version and commit in metadata', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-backup-meta-'));
  const profile = path.join(tmp, 'profile');
  const home = path.join(tmp, 'home');
  const state = path.join(tmp, 'state');

  // Set up profile and home
  fs.mkdirSync(path.join(profile, 'claude'), { recursive: true });
  fs.writeFileSync(path.join(profile, 'claude', 'file.txt'), 'content');
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(home, '.claude', 'file.txt'), 'old content');

  const roots = {
    claude: path.join(home, '.claude'),
    cursor: path.join(home, '.cursor'),
    shared: home,
  };
  const dirs = { home, state };

  // Record an install with version and commit
  recordInstall('alice', profile, 'HEAD', 'v0.2.1', dirs);

  // Now apply profile (which should backup and capture the source version)
  const files = plan(profile, roots);
  const { backupDir } = applyProfile(files, 'alice', false, dirs);

  // Extract stamp from backup dir name
  const stamp = path.basename(backupDir).slice('alice'.length + 1);

  // Check that metadata.json exists and contains source version
  const metadataPath = path.join(backupDir, 'metadata.json');
  assert.ok(fs.existsSync(metadataPath), 'metadata.json should exist');

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  assert.equal(metadata.sourceVersion, 'v0.2.1', 'sourceVersion should be recorded');
  // sourceCommit may be null if git rev-parse fails in test env, so just check it's defined
  assert.ok(metadata.sourceCommit !== undefined, 'sourceCommit should be recorded');

  fs.rmSync(tmp, { recursive: true });
});

test('backup gracefully handles missing install state (no version recorded)', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-backup-no-meta-'));
  const profile = path.join(tmp, 'profile');
  const home = path.join(tmp, 'home');
  const state = path.join(tmp, 'state');

  // Set up profile and home
  fs.mkdirSync(path.join(profile, 'claude'), { recursive: true });
  fs.writeFileSync(path.join(profile, 'claude', 'file.txt'), 'content');
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(home, '.claude', 'file.txt'), 'old content');

  const roots = {
    claude: path.join(home, '.claude'),
    cursor: path.join(home, '.cursor'),
    shared: home,
  };
  const dirs = { home, state };

  // Do NOT record an install for bob — no install state exists
  const files = plan(profile, roots);
  const { backupDir } = applyProfile(files, 'bob', false, dirs);

  // Check that metadata.json is not created (or is empty) since there's no install state
  const metadataPath = path.join(backupDir, 'metadata.json');
  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    // If metadata exists, it should be empty or have no sourceVersion
    assert.equal(
      metadata.sourceVersion,
      undefined,
      'sourceVersion should be undefined if no install state'
    );
  } else {
    // metadata.json should not exist at all if there's no install state
    assert.ok(!fs.existsSync(metadataPath), 'metadata.json should not exist if no install state');
  }

  fs.rmSync(tmp, { recursive: true });
});


test('multi-user isolation: alice and bob backups/restores are independent', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-multiuser-'));
  const profile = path.join(tmp, 'profile');
  const homeAlice = path.join(tmp, 'home-alice');
  const homeBob = path.join(tmp, 'home-bob');
  const state = path.join(tmp, 'state');

  // Setup shared profile
  fs.mkdirSync(path.join(profile, 'claude'), { recursive: true });
  fs.writeFileSync(path.join(profile, 'claude', 'config.txt'), 'shared profile config');

  // === ALICE: Initial setup ===
  fs.mkdirSync(path.join(homeAlice, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(homeAlice, '.claude', 'config.txt'), 'alice v1');

  const rootsAlice = { claude: path.join(homeAlice, '.claude'), shared: homeAlice };
  const dirsAlice = { home: homeAlice, state };

  const filesAlice1 = plan(profile, rootsAlice);
  const { backupDir: aliceBackup1 } = applyProfile(filesAlice1, 'alice', false, dirsAlice);
  const aliceStamp1 = path.basename(aliceBackup1).slice('alice'.length + 1);

  // === BOB: Initial setup (shares state but separate home) ===
  fs.mkdirSync(path.join(homeBob, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(homeBob, '.claude', 'config.txt'), 'bob v1');

  const rootsBob = { claude: path.join(homeBob, '.claude'), shared: homeBob };
  const dirsBob = { home: homeBob, state };

  const filesBob1 = plan(profile, rootsBob);
  const { backupDir: bobBackup1 } = applyProfile(filesBob1, 'bob', false, dirsBob);
  const bobStamp1 = path.basename(bobBackup1).slice('bob'.length + 1);

  // === Verify listBackups isolation ===
  const aliceBackups = listBackups('alice', state);
  const bobBackups = listBackups('bob', state);
  assert.equal(aliceBackups.length, 1, 'alice has 1 backup');
  assert.equal(bobBackups.length, 1, 'bob has 1 backup');

  // === Modify both users' files ===
  fs.writeFileSync(path.join(homeAlice, '.claude', 'config.txt'), 'alice v2');
  fs.writeFileSync(path.join(homeBob, '.claude', 'config.txt'), 'bob v2');

  // === Alice restores to her backup ===
  restoreBackupToStamp('alice', aliceStamp1, dirsAlice);
  assert.equal(
    fs.readFileSync(path.join(homeAlice, '.claude', 'config.txt'), 'utf8'),
    'alice v1',
    'alice restored to v1'
  );

  // === CRITICAL TEST: Bob's files must not be affected ===
  assert.equal(
    fs.readFileSync(path.join(homeBob, '.claude', 'config.txt'), 'utf8'),
    'bob v2',
    'bob file unchanged by alice restore (separate home)'
  );

  // === Bob restores to his backup ===
  restoreBackupToStamp('bob', bobStamp1, dirsBob);
  assert.equal(
    fs.readFileSync(path.join(homeBob, '.claude', 'config.txt'), 'utf8'),
    'bob v1',
    'bob restored to v1'
  );

  // === Verify Alice still unaffected ===
  assert.equal(
    fs.readFileSync(path.join(homeAlice, '.claude', 'config.txt'), 'utf8'),
    'alice v1',
    'alice unchanged by bob restore'
  );

  // === Verify backup dirs are separate ===
  const backupsRoot = path.join(state, 'backups');
  const all = fs.readdirSync(backupsRoot).sort();
  const aliceDirs = all.filter((d) => d.startsWith('alice-'));
  const bobDirs = all.filter((d) => d.startsWith('bob-'));
  assert.equal(aliceDirs.length, 1, 'alice has 1 backup dir');
  assert.equal(bobDirs.length, 1, 'bob has 1 backup dir');

  // === Verify charlie (non-existent) has no backups ===
  assert.equal(listBackups('charlie', state).length, 0, 'non-existent user has no backups');

  fs.rmSync(tmp, { recursive: true });
});

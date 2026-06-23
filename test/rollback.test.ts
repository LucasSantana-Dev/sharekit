import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { applyProfile, restoreBackupToStamp, listBackups, plan } from '../src/sharekit.ts';

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
  const stamp1 = path.basename(backup1).replace(/^user-/, '');
  const stamp2 = path.basename(backup2).replace(/^user-/, '');

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

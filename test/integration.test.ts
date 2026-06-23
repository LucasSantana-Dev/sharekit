import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import {
  plan,
  applyProfile,
  restoreBackup,
  recordInstall,
  readInstalled,
  list,
  update,
} from '../src/sharekit.ts';

// Exercises the REAL exported helpers (not a hand-rolled copy) via injected dirs,
// so it fails if applyProfile / restoreBackup / the applied.json contract regress.
test('integration: applyProfile mirrors all roots, restoreBackup reverses it', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-int-'));
  const profile = path.join(tmp, 'profile');
  const home = path.join(tmp, 'home');
  const state = path.join(tmp, 'state');

  // a profile touching all three tool roots
  fs.mkdirSync(path.join(profile, 'claude'), { recursive: true });
  fs.writeFileSync(path.join(profile, 'claude', 'CLAUDE.md'), 'profile instructions');
  fs.mkdirSync(path.join(profile, 'cursor'), { recursive: true });
  fs.writeFileSync(path.join(profile, 'cursor', '.cursorrules'), 'cursor rules');
  fs.mkdirSync(path.join(profile, 'shared'), { recursive: true });
  fs.writeFileSync(path.join(profile, 'shared', '.somefile'), 'shared content');

  // a pre-existing file that will be CHANGED (to exercise backup + restore)
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(home, '.claude', 'CLAUDE.md'), 'old instructions');

  const roots = {
    claude: path.join(home, '.claude'),
    cursor: path.join(home, '.cursor'),
    shared: home,
  };
  const dirs = { home, state };

  const files = plan(profile, roots);
  const { filesWritten, backupDir } = applyProfile(files, 'testuser', false, dirs);

  // mirrored into ~/.claude, ~/.cursor, ~
  assert.equal(
    fs.readFileSync(path.join(home, '.claude', 'CLAUDE.md'), 'utf8'),
    'profile instructions'
  );
  assert.equal(fs.readFileSync(path.join(home, '.cursor', '.cursorrules'), 'utf8'), 'cursor rules');
  assert.equal(fs.readFileSync(path.join(home, '.somefile'), 'utf8'), 'shared content');
  assert.equal(filesWritten, 3);

  // backup landed under the injected state dir and kept the original
  assert.ok(backupDir.startsWith(state), 'backup lives under the injected state dir');
  assert.equal(
    fs.readFileSync(path.join(backupDir, '.claude', 'CLAUDE.md'), 'utf8'),
    'old instructions'
  );

  // restore: changed file reverts, new files are removed
  restoreBackup('testuser', dirs);
  assert.equal(
    fs.readFileSync(path.join(home, '.claude', 'CLAUDE.md'), 'utf8'),
    'old instructions'
  );
  assert.ok(!fs.existsSync(path.join(home, '.cursor', '.cursorrules')), 'new cursor file removed');
  assert.ok(!fs.existsSync(path.join(home, '.somefile')), 'new shared file removed');

  fs.rmSync(tmp, { recursive: true });
});

test('recordInstall writes install state with resolved commit SHA and timestamp', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-state-'));
  const state = path.join(tmp, 'state');
  const profileDir = path.join(tmp, 'profile');
  fs.mkdirSync(profileDir, { recursive: true });

  // Initialize a git repo in profileDir with a commit
  execSync('git init', { cwd: profileDir, stdio: 'pipe' });
  execSync('git config user.email test@example.com', { cwd: profileDir, stdio: 'pipe' });
  execSync('git config user.name Test', { cwd: profileDir, stdio: 'pipe' });
  fs.writeFileSync(path.join(profileDir, 'test.txt'), 'content');
  execSync('git add test.txt', { cwd: profileDir, stdio: 'pipe' });
  execSync('git commit -m "test"', { cwd: profileDir, stdio: 'pipe' });

  // Record an install with resolved commit
  const user = 'testuser';
  const ref = 'main';
  const version = '1.0.0';

  recordInstall(user, profileDir, ref, version, { home: tmp, state });

  // Verify the state file was created with correct structure
  const stateFile = path.join(state, 'installed.json');
  assert.ok(fs.existsSync(stateFile), 'installed.json should exist');

  const installed = readInstalled({ home: tmp, state });
  assert.ok(installed[user], `record for user ${user} should exist`);
  assert.equal(installed[user].user, user);
  assert.equal(installed[user].ref, ref);
  assert.equal(installed[user].version, version);
  assert.ok(installed[user].commit, 'commit SHA should be resolved');
  assert.ok(installed[user].appliedAt, 'appliedAt timestamp should exist');
  assert.match(installed[user].appliedAt, /^\d{4}-\d{2}-\d{2}T/); // ISO format

  // Verify that re-recording the same user overwrites (doesn't duplicate)
  const newVersion = '2.0.0';
  recordInstall(user, profileDir, ref, newVersion, { home: tmp, state });
  const installed2 = readInstalled({ home: tmp, state });
  assert.equal(Object.keys(installed2).length, 1, 'should have exactly one user record');
  assert.equal(installed2[user].version, newVersion, 'version should be updated');

  fs.rmSync(tmp, { recursive: true });
});

test('recordInstall gracefully falls back to commit=null if git rev-parse fails', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-state-ng-'));
  const state = path.join(tmp, 'state');
  const profileDir = path.join(tmp, 'profile');
  fs.mkdirSync(profileDir, { recursive: true });
  // profileDir is not a git repo, so rev-parse will fail

  const user = 'testuser';
  const ref = 'main';
  const version = '1.0.0';

  // Should not throw; should record with commit: null
  recordInstall(user, profileDir, ref, version, { home: tmp, state });

  const installed = readInstalled({ home: tmp, state });
  assert.ok(installed[user], 'record should exist');
  assert.strictEqual(installed[user].commit, null, 'commit should be null when git fails');

  fs.rmSync(tmp, { recursive: true });
});

test('list shows installed profiles with version, short SHA, and date', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-list-'));
  const state = path.join(tmp, 'state');

  // Create install records: one with commit, one with null commit
  const installed = {
    user1: {
      user: 'user1',
      ref: 'main',
      commit: 'abc123def456abc123def456abc123def456abc1',
      version: '1.0.0',
      appliedAt: '2025-06-23T10:30:00.000Z',
    },
    user2: {
      user: 'user2',
      ref: 'v2.0',
      commit: null,
      version: '2.0.0',
      appliedAt: '2025-06-22T14:15:00.000Z',
    },
  };

  const stateFile = path.join(state, 'installed.json');
  fs.mkdirSync(state, { recursive: true });
  fs.writeFileSync(stateFile, JSON.stringify(installed, null, 2));

  // Capture console output
  const output: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    output.push(args.join(' '));
  };

  // Call list
  list({ home: tmp, state });

  console.log = originalLog;

  // Verify output includes both users with expected format
  const outputStr = output.join('\n');
  assert.ok(outputStr.includes('user1'), 'should list user1');
  assert.ok(outputStr.includes('user2'), 'should list user2');
  assert.ok(outputStr.includes('1.0.0'), 'should show version for user1');
  assert.ok(outputStr.includes('2.0.0'), 'should show version for user2');
  assert.ok(outputStr.includes('abc123d'), 'should show short SHA (7 chars) for user1');
  assert.ok(outputStr.includes('?'), 'should show ? for null commit in user2');

  fs.rmSync(tmp, { recursive: true });
});

test('list shows friendly message when nothing is installed', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-list-empty-'));
  const state = path.join(tmp, 'state');

  // No installed.json file exists

  const output: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    output.push(args.join(' '));
  };

  // Call list
  list({ home: tmp, state });

  console.log = originalLog;

  const outputStr = output.join('\n');
  assert.ok(outputStr.toLowerCase().includes('nothing installed'), 'should show friendly message');

  fs.rmSync(tmp, { recursive: true });
});

test('update throws friendly error if user not installed', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-update-not-inst-'));
  const state = path.join(tmp, 'state');

  // No install record for this user
  assert.rejects(
    async () => {
      await update('unknown-user', false, { home: tmp, state });
    },
    { message: /not installed/ }
  );

  fs.rmSync(tmp, { recursive: true });
});

test('update returns "nothing to update" for pinned ref (tag)', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-update-pinned-'));
  const state = path.join(tmp, 'state');

  // Create a local git profile for testing
  const profileDir = path.join(tmp, 'profile');
  fs.mkdirSync(profileDir, { recursive: true });
  execSync('git init', { cwd: profileDir, stdio: 'pipe' });
  execSync('git config user.email test@example.com', { cwd: profileDir, stdio: 'pipe' });
  execSync('git config user.name Test', { cwd: profileDir, stdio: 'pipe' });
  fs.writeFileSync(path.join(profileDir, 'test.txt'), 'content');
  execSync('git add test.txt', { cwd: profileDir, stdio: 'pipe' });
  execSync('git commit -m "test"', { cwd: profileDir, stdio: 'pipe' });

  // Create install record with pinned ref
  const installed = {
    testuser: {
      user: 'testuser',
      ref: 'v1.0.0',
      commit: 'abc123def456abc123def456abc123def456abc1',
      version: '1.0.0',
      appliedAt: new Date().toISOString(),
    },
  };

  const stateFile = path.join(state, 'installed.json');
  fs.mkdirSync(state, { recursive: true });
  fs.writeFileSync(stateFile, JSON.stringify(installed, null, 2));

  // Capture console output
  const output: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    output.push(args.join(' '));
  };

  // Try to update a pinned ref (should not throw, just print message)
  await update('testuser', false, { home: tmp, state });

  console.log = originalLog;

  const outputStr = output.join('\n');
  assert.ok(outputStr.includes('pinned to v1.0.0'), 'should show pinned message');
  assert.ok(outputStr.toLowerCase().includes('nothing to update'), 'should say nothing to update');

  fs.rmSync(tmp, { recursive: true });
});

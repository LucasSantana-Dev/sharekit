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

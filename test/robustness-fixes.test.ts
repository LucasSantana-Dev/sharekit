import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import {
  plan,
  readInstalled,
  list,
  fetchProfile,
  updateApply,
  isImmutableRef,
  rollback,
  uninstall,
  recordInstall,
  restoreBackupToStamp,
} from '../src/sharekit.ts';

// FIX 1: Guard classify() against unreadable files (#46)
test('plan does not crash when dest file is unreadable', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-unreadable-'));
  const profile = path.join(tmp, 'profile');
  const home = path.join(tmp, 'home');
  fs.mkdirSync(path.join(profile, 'claude'), { recursive: true });
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });

  // Source file that will be compared
  fs.writeFileSync(path.join(profile, 'claude', 'test.txt'), 'new content');

  // Destination file that exists but is unreadable
  const destFile = path.join(home, '.claude', 'test.txt');
  fs.writeFileSync(destFile, 'old content');
  fs.chmodSync(destFile, 0o000);

  try {
    const roots = {
      claude: path.join(home, '.claude'),
      cursor: path.join(home, '.cursor'),
      shared: home,
    };
    const files = plan(profile, roots);
    assert.ok(files.length > 0, 'plan should return files');
    const testFile = files.find((f) => f.rel === 'test.txt');
    assert.ok(testFile, 'should have classified the file');
    // When dest is unreadable (catch block), classify() degrades to 'changed' (conservative)
    assert.equal(testFile.status, 'changed', 'unreadable dest should degrade to changed status');
  } finally {
    // Cleanup: restore permissions before rm
    fs.chmodSync(destFile, 0o644);
  }
});

// FIX 2: Surface corrupt installed.json (#50)
test('readInstalled distinguishes missing from corrupt state file', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-corrupt-'));
  const stateDir = path.join(tmp, 'state');
  fs.mkdirSync(stateDir, { recursive: true });

  // Case 1: missing file → return {} silently
  const result1 = readInstalled({ home: tmp, state: stateDir });
  assert.deepEqual(result1, {}, 'missing file returns empty object');

  // Case 2: file exists but is corrupt JSON → warn + return {}
  const stateFile = path.join(stateDir, 'installed.json');
  fs.writeFileSync(stateFile, 'not valid json {{{');

  const stderrSpy: string[] = [];
  const originalStderr = console.error;
  console.error = (...args: unknown[]) => stderrSpy.push(args.join(' '));

  try {
    const result2 = readInstalled({ home: tmp, state: stateDir });
    // Verify warning was emitted
    assert.ok(stderrSpy.length > 0, 'console.error should have been called');
    const warning = stderrSpy.join('');
    assert.match(warning, /corrupt/, 'warning should mention "corrupt"');
    assert.match(warning, /installed\.json/, 'warning should mention the file path');
    // Corrupt file still returns {} to allow graceful fallback
    assert.deepEqual(result2, {}, 'corrupt file returns empty object (graceful fallback)');
  } finally {
    console.error = originalStderr;
  }
});

// FIX 3: Harden CLI async error handling in main() (#51)
test('update command error propagates and exits non-zero', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-cli-error-'));
  const stateDir = path.join(tmp, '.sharekit');
  fs.mkdirSync(stateDir, { recursive: true });

  // Simulate a state where user is not installed
  const stateFile = path.join(stateDir, 'installed.json');
  fs.writeFileSync(stateFile, JSON.stringify({}));

  // Try to update a non-existent user; should throw
  try {
    await updateApply('nonexistent', false, { home: tmp, state: stateDir });
    assert.fail('should have thrown');
  } catch (e) {
    assert.ok(e instanceof Error);
    assert.match((e as Error).message, /not installed/);
  }
});

// FIX 4: Ref/update correctness — cached branch refresh + isImmutableRef heuristic (#52)
test('cached mutable branch (e.g. @stable) gets refreshed on update', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-branch-refresh-'));
  const origin = path.join(tmp, 'acme', 'sharekit-profile');
  fs.mkdirSync(origin, { recursive: true });
  const git = (cmd: string) => execSync(`git ${cmd}`, { cwd: origin, stdio: 'pipe' });
  git('init -q');
  git('config user.email t@t.t');
  git('config user.name t');

  // Create initial commit on stable branch
  fs.writeFileSync(path.join(origin, 'f.txt'), 'v1\n');
  fs.writeFileSync(path.join(origin, 'sharekit.toml'), '[profile]\nname="acme"\nversion="1.0"\n');
  git('add .');
  git('commit -qm c1');
  git('branch stable');

  // Advance main ahead
  fs.writeFileSync(path.join(origin, 'f.txt'), 'v2\n');
  git('commit -qam c2');

  const baseUrl = `file://${tmp}`;
  const cache = path.join(tmp, 'cache');

  // First fetch of stable (should be at v1)
  const stableDir1 = fetchProfile('acme', 'stable', baseUrl, cache);
  const v1 = fs.readFileSync(path.join(stableDir1, 'f.txt'), 'utf8');
  assert.equal(v1, 'v1\n', 'first fetch pins to original commit');

  // Now advance stable branch
  execSync('git checkout stable', { cwd: origin, stdio: 'pipe' });
  fs.writeFileSync(path.join(origin, 'f.txt'), 'v2-stable\n');
  execSync('git commit -qam c3', { cwd: origin, stdio: 'pipe' });

  // Fetch again with cached dir (should pull the update)
  const stableDir2 = fetchProfile('acme', 'stable', baseUrl, cache);
  const v2 = fs.readFileSync(path.join(stableDir2, 'f.txt'), 'utf8');
  assert.equal(v2, 'v2-stable\n', 'second fetch refreshes the cached branch');
});

test('isImmutableRef: HIGH-CONFIDENCE immutable cases (anchored semver + hex SHA)', () => {
  // HIGH-CONFIDENCE immutable: anchored dotted semver tags
  assert.equal(isImmutableRef('v1.0.0'), true, 'v1.0.0 is immutable');
  assert.equal(isImmutableRef('1.2'), true, '1.2 is immutable');
  assert.equal(isImmutableRef('v2.0'), true, 'v2.0 is immutable');
  assert.equal(isImmutableRef('2.1.3'), true, '2.1.3 is immutable');

  // HIGH-CONFIDENCE immutable: hex commit SHA
  assert.equal(
    isImmutableRef('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1'),
    true,
    '40-char hex SHA is immutable'
  );
  assert.equal(isImmutableRef('abc1234'), true, '7-char hex SHA is immutable');
});

test('isImmutableRef: AMBIGUOUS cases bias toward MUTABLE (safe because #52a pull is best-effort)', () => {
  // Ambiguous branch-like names: treated as MUTABLE to avoid wrongly skipping real branches
  assert.equal(isImmutableRef('v2-wip'), false, 'v2-wip (branch) is mutable');
  assert.equal(isImmutableRef('v3-feature'), false, 'v3-feature (branch) is mutable');
  assert.equal(
    isImmutableRef('release-2'),
    false,
    'release-2 (loose tag, could be branch) is mutable'
  );
  assert.equal(isImmutableRef('stable-1'), false, 'stable-1 (loose tag) is mutable');
  assert.equal(isImmutableRef('v2'), false, 'v2 (bare version, could be branch) is mutable');

  // Known mutable branch names
  assert.equal(isImmutableRef('main'), false, 'main branch is mutable');
  assert.equal(isImmutableRef('develop'), false, 'develop branch is mutable');
  assert.equal(isImmutableRef('HEAD'), false, 'HEAD is mutable');
  assert.equal(isImmutableRef('stable'), false, 'stable branch is mutable');
});

// FIX 5: Test corrupt applied.json parsing in rollback and uninstall (#124)
// Helper: create a backup directory with given applied.json content
function setupBackupDir(
  user: string,
  appliedContent: string
): { tmp: string; state: string; home: string } {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-corrupt-applied-'));
  const home = path.join(tmp, 'home');
  const state = path.join(tmp, 'state');
  const backupDir = path.join(state, 'backups', `${user}-2025-01-15T10-30-45-000Z`);

  // Set up home and backup directory
  fs.mkdirSync(home, { recursive: true });
  fs.mkdirSync(backupDir, { recursive: true });

  // Write corrupt applied.json
  fs.writeFileSync(path.join(backupDir, 'applied.json'), appliedContent);

  // Record user in installed.json so uninstall thinks they're installed
  fs.mkdirSync(state, { recursive: true });
  const installed = {
    [user]: { ref: 'main', commit: 'abc123', version: '1.0.0', timestamp: '2025-01-15T10:30:45Z' },
  };
  fs.writeFileSync(path.join(state, 'installed.json'), JSON.stringify(installed));

  return { tmp, state, home };
}

test('uninstall throws when applied.json contains invalid JSON syntax', async () => {
  const user = 'testuser';
  const { tmp, state, home } = setupBackupDir(user, '{{{invalid json');

  try {
    await uninstall(user, { home, state }, true);
    assert.fail('should have thrown');
  } catch (e) {
    assert.ok(e instanceof Error);
    assert.match((e as Error).message, /Backup data is corrupt or unreadable/);
    assert.match((e as Error).message, /not valid JSON/);
  } finally {
    fs.rmSync(tmp, { recursive: true });
  }
});

test('uninstall throws when applied.json is not an array', async () => {
  const user = 'testuser';
  const { tmp, state, home } = setupBackupDir(user, '{}');

  try {
    await uninstall(user, { home, state }, true);
    assert.fail('should have thrown');
  } catch (e) {
    assert.ok(e instanceof Error);
    assert.match((e as Error).message, /Backup data is corrupt or unreadable/);
    assert.match((e as Error).message, /must be an array/);
  } finally {
    fs.rmSync(tmp, { recursive: true });
  }
});

test('uninstall throws when applied.json array contains non-object', async () => {
  const user = 'testuser';
  const { tmp, state, home } = setupBackupDir(user, '[null, "string", 123]');

  try {
    await uninstall(user, { home, state }, true);
    assert.fail('should have thrown');
  } catch (e) {
    assert.ok(e instanceof Error);
    assert.match((e as Error).message, /Backup data is corrupt or unreadable/);
    assert.match((e as Error).message, /not an object/);
  } finally {
    fs.rmSync(tmp, { recursive: true });
  }
});

test('uninstall throws when applied.json element missing dest field', async () => {
  const user = 'testuser';
  const { tmp, state, home } = setupBackupDir(user, '[{"status": "new"}]');

  try {
    await uninstall(user, { home, state }, true);
    assert.fail('should have thrown');
  } catch (e) {
    assert.ok(e instanceof Error);
    assert.match((e as Error).message, /Backup data is corrupt or unreadable/);
    assert.match((e as Error).message, /dest must be a string/);
  } finally {
    fs.rmSync(tmp, { recursive: true });
  }
});

test('uninstall throws when applied.json element missing status field', async () => {
  const user = 'testuser';
  const { tmp, state, home } = setupBackupDir(user, '[{"dest": "/path/to/file"}]');

  try {
    await uninstall(user, { home, state }, true);
    assert.fail('should have thrown');
  } catch (e) {
    assert.ok(e instanceof Error);
    assert.match((e as Error).message, /Backup data is corrupt or unreadable/);
    assert.match((e as Error).message, /status must be a string/);
  } finally {
    fs.rmSync(tmp, { recursive: true });
  }
});

test('uninstall throws when applied.json dest is not a string', async () => {
  const user = 'testuser';
  const { tmp, state, home } = setupBackupDir(user, '[{"dest": 123, "status": "new"}]');

  try {
    await uninstall(user, { home, state }, true);
    assert.fail('should have thrown');
  } catch (e) {
    assert.ok(e instanceof Error);
    assert.match((e as Error).message, /Backup data is corrupt or unreadable/);
    assert.match((e as Error).message, /dest must be a string/);
  } finally {
    fs.rmSync(tmp, { recursive: true });
  }
});

test('uninstall throws when applied.json status is not a string', async () => {
  const user = 'testuser';
  const { tmp, state, home } = setupBackupDir(user, '[{"dest": "/path/to/file", "status": true}]');

  try {
    await uninstall(user, { home, state }, true);
    assert.fail('should have thrown');
  } catch (e) {
    assert.ok(e instanceof Error);
    assert.match((e as Error).message, /Backup data is corrupt or unreadable/);
    assert.match((e as Error).message, /status must be a string/);
  } finally {
    fs.rmSync(tmp, { recursive: true });
  }
});

test('restoreBackupToStamp throws when applied.json contains invalid JSON', () => {
  const user = 'testuser';
  const { tmp, state, home } = setupBackupDir(user, '{{{invalid json');

  try {
    restoreBackupToStamp(user, '2025-01-15T10-30-45-000Z', { home, state });
    assert.fail('should have thrown');
  } catch (e) {
    assert.ok(e instanceof Error);
    assert.match((e as Error).message, /Backup data is corrupt or unreadable/);
    assert.match((e as Error).message, /not valid JSON/);
  } finally {
    fs.rmSync(tmp, { recursive: true });
  }
});

test('restoreBackupToStamp throws when applied.json is not an array', () => {
  const user = 'testuser';
  const { tmp, state, home } = setupBackupDir(user, 'null');

  try {
    restoreBackupToStamp(user, '2025-01-15T10-30-45-000Z', { home, state });
    assert.fail('should have thrown');
  } catch (e) {
    assert.ok(e instanceof Error);
    assert.match((e as Error).message, /Backup data is corrupt or unreadable/);
    assert.match((e as Error).message, /must be an array/);
  } finally {
    fs.rmSync(tmp, { recursive: true });
  }
});

test('restoreBackupToStamp throws when applied.json element has invalid dest type', () => {
  const user = 'testuser';
  const { tmp, state, home } = setupBackupDir(user, '[{"dest": null, "status": "changed"}]');

  try {
    restoreBackupToStamp(user, '2025-01-15T10-30-45-000Z', { home, state });
    assert.fail('should have thrown');
  } catch (e) {
    assert.ok(e instanceof Error);
    assert.match((e as Error).message, /Backup data is corrupt or unreadable/);
    assert.match((e as Error).message, /dest must be a string/);
  } finally {
    fs.rmSync(tmp, { recursive: true });
  }
});

test('restoreBackupToStamp throws when applied.json element has invalid status type', () => {
  const user = 'testuser';
  const { tmp, state, home } = setupBackupDir(
    user,
    '[{"dest": "/path/file", "status": ["array"]}]'
  );

  try {
    restoreBackupToStamp(user, '2025-01-15T10-30-45-000Z', { home, state });
    assert.fail('should have thrown');
  } catch (e) {
    assert.ok(e instanceof Error);
    assert.match((e as Error).message, /Backup data is corrupt or unreadable/);
    assert.match((e as Error).message, /status must be a string/);
  } finally {
    fs.rmSync(tmp, { recursive: true });
  }
});

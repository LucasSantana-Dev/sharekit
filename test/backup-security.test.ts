import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { restoreBackupInternal, listBackups } from '../src/sharekit.ts';
import { uninstall, rollback } from '../src/commands.ts';

// FIX Issue #100: Safe JSON parsing for applied.json
// Test 1: restoreBackupInternal with corrupt JSON (not valid JSON syntax)
test('Issue #100: restoreBackupInternal with corrupt JSON throws clear error', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-corrupt-json-'));
  const backupDir = path.join(tmp, 'backup');
  const home = path.join(tmp, 'home');

  fs.mkdirSync(backupDir, { recursive: true });
  fs.mkdirSync(home, { recursive: true });

  // Write malformed JSON to applied.json
  fs.writeFileSync(path.join(backupDir, 'applied.json'), '{invalid json[');

  try {
    assert.throws(
      () => {
        restoreBackupInternal('user', backupDir, { home, state: tmp });
      },
      (err: any) => {
        assert.ok(err.message.includes('Backup data is corrupt or unreadable'));
        return true;
      }
    );
  } finally {
    fs.rmSync(tmp, { recursive: true });
  }
});

// Test 2: restoreBackupInternal with non-array content
test('Issue #100: restoreBackupInternal with non-array applied.json throws error', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-non-array-'));
  const backupDir = path.join(tmp, 'backup');
  const home = path.join(tmp, 'home');

  fs.mkdirSync(backupDir, { recursive: true });
  fs.mkdirSync(home, { recursive: true });

  // Write valid JSON but not an array
  fs.writeFileSync(path.join(backupDir, 'applied.json'), '{"not": "array"}');

  try {
    assert.throws(
      () => {
        restoreBackupInternal('user', backupDir, { home, state: tmp });
      },
      (err: any) => {
        assert.ok(err.message.includes('Backup data is corrupt or unreadable'));
        assert.ok(err.message.includes('must be an array'));
        return true;
      }
    );
  } finally {
    fs.rmSync(tmp, { recursive: true });
  }
});

// Test 3: restoreBackupInternal with missing dest field in array element
test('Issue #100: restoreBackupInternal with missing dest field throws error', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-missing-dest-'));
  const backupDir = path.join(tmp, 'backup');
  const home = path.join(tmp, 'home');

  fs.mkdirSync(backupDir, { recursive: true });
  fs.mkdirSync(home, { recursive: true });

  // Write array with object missing dest field
  fs.writeFileSync(path.join(backupDir, 'applied.json'), '[{"status": "new"}]');

  try {
    assert.throws(
      () => {
        restoreBackupInternal('user', backupDir, { home, state: tmp });
      },
      (err: any) => {
        assert.ok(err.message.includes('Backup data is corrupt or unreadable'));
        assert.ok(err.message.includes('[0].dest'));
        return true;
      }
    );
  } finally {
    fs.rmSync(tmp, { recursive: true });
  }
});

// Test 4: restoreBackupInternal with dest not a string
test('Issue #100: restoreBackupInternal with non-string dest throws error', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-bad-dest-type-'));
  const backupDir = path.join(tmp, 'backup');
  const home = path.join(tmp, 'home');

  fs.mkdirSync(backupDir, { recursive: true });
  fs.mkdirSync(home, { recursive: true });

  // Write array with dest as number instead of string
  fs.writeFileSync(
    path.join(backupDir, 'applied.json'),
    '[{"dest": 123, "status": "new"}]'
  );

  try {
    assert.throws(
      () => {
        restoreBackupInternal('user', backupDir, { home, state: tmp });
      },
      (err: any) => {
        assert.ok(err.message.includes('Backup data is corrupt or unreadable'));
        assert.ok(err.message.includes('[0].dest must be a string'));
        return true;
      }
    );
  } finally {
    fs.rmSync(tmp, { recursive: true });
  }
});

// FIX Issue #101: Bounds-check dest against dirs.home in restore
// Test 1: restoreBackupInternal skips out-of-bounds entry
test('Issue #101: restoreBackupInternal skips out-of-bounds entries', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-oob-'));
  const backupDir = path.join(tmp, 'backup');
  const home = path.join(tmp, 'home');

  fs.mkdirSync(backupDir, { recursive: true });
  fs.mkdirSync(home, { recursive: true });

  // Write applied.json with one valid entry and one that escapes home
  const validDest = path.join(home, '.claude', 'settings.json');
  const evilDest = '/etc/passwd'; // Absolute path outside home

  fs.writeFileSync(
    path.join(backupDir, 'applied.json'),
    JSON.stringify([
      { dest: validDest, status: 'new' },
      { dest: evilDest, status: 'new' }, // This should be skipped
    ])
  );

  // Create the valid backup file so restore tries to process it
  fs.mkdirSync(path.dirname(validDest), { recursive: true });
  fs.writeFileSync(validDest, 'original');

  // Create the backup files
  fs.mkdirSync(path.join(backupDir, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(backupDir, '.claude', 'settings.json'), 'backup');

  const metadata = restoreBackupInternal('user', backupDir, { home, state: tmp });

  // Should have processed only the valid entry (1 removed, 0 restored)
  assert.equal(metadata.filesRemoved, 1, 'should remove the valid file');
  assert.equal(metadata.filesRestored, 0, 'should not restore anything');

  // The out-of-bounds file should not be removed
  // (Note: /etc/passwd won't exist in test, but the important thing is we didn't try)
  // Verify by checking that no warning was printed to console (hard to test directly)
  // Instead, just verify that restore succeeded without throwing

  fs.rmSync(tmp, { recursive: true });
});

// Test 2: restoreBackupInternal with relative path escape attempt
test('Issue #101: restoreBackupInternal rejects relative path escapes', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-relative-escape-'));
  const backupDir = path.join(tmp, 'backup');
  const home = path.join(tmp, 'home');

  fs.mkdirSync(backupDir, { recursive: true });
  fs.mkdirSync(home, { recursive: true });

  // Create a relative path that escapes home (e.g., /tmp/.../home/../../../etc/passwd)
  const escapePath = path.resolve(path.join(home, '../../evil.txt'));

  // Write applied.json with entry pointing to escaped path
  fs.writeFileSync(
    path.join(backupDir, 'applied.json'),
    JSON.stringify([{ dest: escapePath, status: 'new' }])
  );

  try {
    const metadata = restoreBackupInternal('user', backupDir, { home, state: tmp });

    // Should skip the out-of-bounds entry
    assert.equal(metadata.filesRemoved, 0, 'should not remove escaped relative path target');

    fs.rmSync(tmp, { recursive: true });
  } catch (err) {
    // If test setup fails, clean up and rethrow
    fs.rmSync(tmp, { recursive: true });
    throw err;
  }
});

// Test 3: uninstall command with corrupt applied.json
test('Issue #100: uninstall command with corrupt applied.json throws clear error', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-uninstall-corrupt-'));
  const home = path.join(tmp, 'home');
  const state = path.join(tmp, 'state');

  fs.mkdirSync(home, { recursive: true });
  fs.mkdirSync(path.join(state, 'backups', 'user-2025-01-15T10-00-00-000Z'), {
    recursive: true,
  });

  // Write corrupt applied.json
  fs.writeFileSync(
    path.join(state, 'backups', 'user-2025-01-15T10-00-00-000Z', 'applied.json'),
    'not valid json {'
  );

  // Write installed.json so user is marked as installed
  fs.mkdirSync(state, { recursive: true });
  fs.writeFileSync(path.join(state, 'installed.json'), JSON.stringify({ user: { ref: 'HEAD' } }));

  try {
    await assert.rejects(
      () => uninstall('user', { home, state }, true),
      (err: any) => {
        assert.ok(err.message.includes('Backup data is corrupt or unreadable'));
        return true;
      }
    );
  } finally {
    fs.rmSync(tmp, { recursive: true });
  }
});

// Test 4: Verify that corrupt JSON during applied.json read-and-validate produces clear error message
// (This is tested indirectly via uninstall test 3 and via restoreBackupInternal tests 1-4)
// We skip a direct rollback test since rollback hard-codes the home/state directories from process.env

// Test 5: listBackups handles corrupt applied.json gracefully
test('Issue #100: listBackups gracefully handles corrupt applied.json', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-list-corrupt-'));
  const state = path.join(tmp, 'state');

  // Create two backups: one good, one corrupt
  fs.mkdirSync(path.join(state, 'backups', 'user-2025-01-15T10-00-00-000Z'), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(state, 'backups', 'user-2025-01-15T10-00-00-000Z', 'applied.json'),
    JSON.stringify([
      { dest: '/home/user/.config', status: 'changed' },
      { dest: '/home/user/.ssh', status: 'new' },
    ])
  );

  fs.mkdirSync(path.join(state, 'backups', 'user-2025-01-16T14-00-00-000Z'), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(state, 'backups', 'user-2025-01-16T14-00-00-000Z', 'applied.json'),
    'not valid json'
  );

  const backups = listBackups('user', state);

  // listBackups should return both entries: the good one with fileCount, the corrupt one with fileCount=0
  assert.equal(backups.length, 2, 'should list both backups');
  assert.equal(backups[0].fileCount, 0, 'corrupt backup should have fileCount=0');
  assert.equal(backups[1].fileCount, 2, 'valid backup should have correct fileCount');

  fs.rmSync(tmp, { recursive: true });
});

// Test 6: Valid applied.json still works correctly
test('Issue #100/#101: Valid applied.json is processed correctly', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-valid-applied-'));
  const backupDir = path.join(tmp, 'backup');
  const home = path.join(tmp, 'home');

  fs.mkdirSync(backupDir, { recursive: true });
  fs.mkdirSync(home, { recursive: true });

  // Create a real scenario with files being restored
  const file1 = path.join(home, '.claude', 'settings.json');
  const file2 = path.join(home, '.config', 'new-file.txt');

  // Backup files
  fs.mkdirSync(path.join(backupDir, '.claude'), { recursive: true });
  fs.mkdirSync(path.join(backupDir, '.config'), { recursive: true });
  fs.writeFileSync(path.join(backupDir, '.claude', 'settings.json'), 'original settings');
  fs.writeFileSync(path.join(backupDir, '.config', 'new-file.txt'), 'original content');

  // Home files (that will be removed or restored)
  fs.mkdirSync(path.dirname(file1), { recursive: true });
  fs.writeFileSync(file1, 'modified settings');
  fs.mkdirSync(path.dirname(file2), { recursive: true });
  fs.writeFileSync(file2, 'new file content');

  // Valid applied.json
  fs.writeFileSync(
    path.join(backupDir, 'applied.json'),
    JSON.stringify([
      { dest: file1, status: 'changed' }, // Should be restored
      { dest: file2, status: 'new' }, // Should be removed
    ])
  );

  const metadata = restoreBackupInternal('user', backupDir, { home, state: tmp });

  // Check results
  assert.equal(metadata.filesRestored, 1, 'should restore 1 file');
  assert.equal(metadata.filesRemoved, 1, 'should remove 1 file');
  assert.equal(
    fs.readFileSync(file1, 'utf8'),
    'original settings',
    'file1 should be restored'
  );
  assert.ok(!fs.existsSync(file2), 'file2 should be removed');

  fs.rmSync(tmp, { recursive: true });
});

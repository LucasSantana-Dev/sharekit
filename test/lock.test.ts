import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { acquireLock, releaseLock } from '../src/state.js';

// Test 1: acquireLock throws when lock is held by a live process (portable across macOS/Linux)
test('acquireLock throws when another process holds the lock', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-lock-'));
  const lockPath = path.join(tmp, '.lock');

  // Write the current process's PID to the lock file (this process is definitely alive)
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  fs.writeFileSync(lockPath, process.pid.toString());

  // Try to acquire the same lock — should fail
  let errorThrown = false;
  let errorMessage = '';
  try {
    acquireLock(lockPath);
  } catch (e) {
    errorThrown = true;
    errorMessage = e instanceof Error ? e.message : String(e);
  }

  assert.ok(errorThrown, 'acquireLock should throw when lock is held by live process');
  assert.ok(
    errorMessage.includes('another sharekit process is running'),
    'error should mention another process is running'
  );
  assert.ok(errorMessage.includes(process.pid.toString()), 'error should include the PID');
  assert.ok(errorMessage.includes('retry'), 'error should suggest retrying');
  assert.ok(errorMessage.includes('delete'), 'error should suggest deleting the lock file');

  // Cleanup
  fs.rmSync(tmp, { recursive: true, force: true });
});

// Test 2: stale lock (dead PID) is cleaned and acquisition succeeds
test('acquireLock cleans up stale lock and acquires successfully', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-lock-'));
  const lockPath = path.join(tmp, '.lock');

  // Write a dead PID (very unlikely to exist) to the lock file
  const deadPid = '999999999';
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  fs.writeFileSync(lockPath, deadPid);

  // Try to acquire the lock — should succeed (cleaning up stale lock)
  acquireLock(lockPath);

  // Verify that the lock file now contains the current process PID
  assert.ok(fs.existsSync(lockPath), 'lock file should exist');
  const content = fs.readFileSync(lockPath, 'utf8').trim();
  assert.equal(content, process.pid.toString(), 'lock file should contain current PID');

  // Cleanup
  fs.rmSync(tmp, { recursive: true, force: true });
});

// Test 3: release lock removes the lock file
test('releaseLock removes the lock file', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-lock-'));
  const lockPath = path.join(tmp, '.lock');

  // Create a lock file
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  fs.writeFileSync(lockPath, process.pid.toString());
  assert.ok(fs.existsSync(lockPath), 'lock file should exist before release');

  // Release the lock
  releaseLock(lockPath);

  // Verify that the lock file is gone
  assert.ok(!fs.existsSync(lockPath), 'lock file should be removed after release');

  // Cleanup
  fs.rmSync(tmp, { recursive: true, force: true });
});

// Test 4: releaseLock silently succeeds even if lock file doesn't exist
test('releaseLock succeeds even if lock file does not exist', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-lock-'));
  const lockPath = path.join(tmp, '.lock');

  // Don't create the lock file, just try to release
  assert.doesNotThrow(() => {
    releaseLock(lockPath);
  }, 'releaseLock should not throw if lock file does not exist');

  // Cleanup
  fs.rmSync(tmp, { recursive: true, force: true });
});

// Test 5: acquireLock creates lock directory if it doesn't exist
test('acquireLock creates the lock directory if needed', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-lock-'));
  const lockPath = path.join(tmp, 'subdir', '.lock');

  // Don't create the directory beforehand
  assert.ok(!fs.existsSync(path.dirname(lockPath)), 'lock directory should not exist yet');

  // Acquire the lock
  acquireLock(lockPath);

  // Verify that the directory and file were created
  assert.ok(fs.existsSync(lockPath), 'lock file should be created');
  const content = fs.readFileSync(lockPath, 'utf8').trim();
  assert.equal(content, process.pid.toString(), 'lock file should contain current PID');

  // Cleanup
  fs.rmSync(tmp, { recursive: true, force: true });
});

// Test 6: acquireLock treats non-numeric PID as stale and cleans up
test('acquireLock treats non-numeric lock content as stale', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-lock-'));
  const lockPath = path.join(tmp, '.lock');

  // Write non-numeric content (corrupted lock file)
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  fs.writeFileSync(lockPath, 'corrupted-pid-data');

  // Try to acquire the lock — should succeed (cleaning up corrupted lock)
  acquireLock(lockPath);

  // Verify that the lock file now contains the current process PID
  assert.ok(fs.existsSync(lockPath), 'lock file should exist');
  const content = fs.readFileSync(lockPath, 'utf8').trim();
  assert.equal(content, process.pid.toString(), 'lock file should contain current PID');

  // Cleanup
  fs.rmSync(tmp, { recursive: true, force: true });
});

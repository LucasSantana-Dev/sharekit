import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { plan, applyProfile, restoreBackup } from '../src/sharekit.ts';

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

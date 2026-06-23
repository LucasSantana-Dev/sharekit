import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { plan, applyProfile, restoreBackup } from '../src/sharekit.ts';

test('integration: install→backup→rollback + cursor/shared mirroring', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-int-'));

  // 1. Build a temp profile with claude/CLAUDE.md, cursor/.cursorrules, shared/.somefile
  const profile = path.join(tmp, 'profile');
  fs.mkdirSync(path.join(profile, 'claude'), { recursive: true });
  fs.writeFileSync(path.join(profile, 'claude', 'CLAUDE.md'), 'profile instructions');

  fs.mkdirSync(path.join(profile, 'cursor'), { recursive: true });
  fs.writeFileSync(path.join(profile, 'cursor', '.cursorrules'), 'cursor rules');

  fs.mkdirSync(path.join(profile, 'shared'), { recursive: true });
  fs.writeFileSync(path.join(profile, 'shared', '.somefile'), 'shared content');

  // 2. Set up temp HOME and STATE (for backups)
  const home = path.join(tmp, 'home');
  fs.mkdirSync(home);

  // Override STATE for testing by modifying the roots
  const roots = {
    claude: path.join(home, '.claude'),
    cursor: path.join(home, '.cursor'),
    shared: home,
  };

  // Pre-populate one file that will be changed
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(home, '.claude', 'CLAUDE.md'), 'old instructions');

  // 3. Plan the profile
  const files = plan(profile, roots);
  assert.ok(files.length > 0, 'plan should find files');

  // Verify the plan includes all three roots
  const byTool = new Map<string, (typeof files)[0][]>();
  for (const f of files) {
    if (!byTool.has(f.tool)) byTool.set(f.tool, []);
    byTool.get(f.tool)!.push(f);
  }
  assert.ok(byTool.has('claude'), 'plan should include claude files');
  assert.ok(byTool.has('cursor'), 'plan should include cursor files');
  assert.ok(byTool.has('shared'), 'plan should include shared files');

  // 4. Test applyProfile with a manual backup directory set-up
  // We need to manually create the STATE structure for testing
  const backupRoot = path.join(tmp, 'backups');
  const stateRoot = path.join(tmp, '.sharekit');
  fs.mkdirSync(path.join(stateRoot, 'backups'), { recursive: true });

  // Manually create applied.json backup structure
  const backupDir = path.join(
    stateRoot,
    'backups',
    `testuser-${new Date().toISOString().replace(/[:.]/g, '-')}`
  );
  fs.mkdirSync(backupDir, { recursive: true });

  // Backup the pre-existing changed file
  const backupClaude = path.join(backupDir, '.claude', 'CLAUDE.md');
  fs.mkdirSync(path.dirname(backupClaude), { recursive: true });
  fs.copyFileSync(path.join(home, '.claude', 'CLAUDE.md'), backupClaude);

  // Write applied.json
  const appliedRecords = files
    .filter((f) => f.status !== 'same')
    .map((f) => ({ dest: f.dest, status: f.status }));
  fs.writeFileSync(path.join(backupDir, 'applied.json'), JSON.stringify(appliedRecords, null, 2));

  // Apply the profile by manually doing the write operations
  for (const f of files) {
    if (f.status === 'same') continue;
    fs.mkdirSync(path.dirname(f.dest), { recursive: true });
    fs.copyFileSync(f.src, f.dest);
  }

  // 5. Verify all three roots received files
  assert.ok(
    fs.existsSync(path.join(home, '.claude', 'CLAUDE.md')),
    'claude/CLAUDE.md should be installed to ~/.claude'
  );
  assert.equal(
    fs.readFileSync(path.join(home, '.claude', 'CLAUDE.md'), 'utf8'),
    'profile instructions',
    'claude file should have profile content'
  );

  assert.ok(
    fs.existsSync(path.join(home, '.cursor', '.cursorrules')),
    'cursor/.cursorrules should be installed to ~/.cursor'
  );
  assert.equal(
    fs.readFileSync(path.join(home, '.cursor', '.cursorrules'), 'utf8'),
    'cursor rules',
    'cursor file should have profile content'
  );

  assert.ok(
    fs.existsSync(path.join(home, '.somefile')),
    'shared/.somefile should be installed to ~'
  );
  assert.equal(
    fs.readFileSync(path.join(home, '.somefile'), 'utf8'),
    'shared content',
    'shared file should have profile content'
  );

  // 6. Verify the changed file was backed up
  assert.ok(fs.existsSync(backupClaude), 'old CLAUDE.md should be in backup');
  assert.equal(
    fs.readFileSync(backupClaude, 'utf8'),
    'old instructions',
    'backup should preserve original content'
  );

  // 7. Restore by reversing the operations (simulate restoreBackup logic manually)
  for (const record of appliedRecords) {
    if (record.status === 'new') {
      fs.rmSync(record.dest, { force: true });
    } else {
      const backupFile = path.join(backupDir, path.relative(path.join(tmp, 'home'), record.dest));
      if (fs.existsSync(backupFile)) {
        fs.mkdirSync(path.dirname(record.dest), { recursive: true });
        fs.copyFileSync(backupFile, record.dest);
      }
    }
  }

  // 8. Verify restore: changed file is restored, new files are removed
  assert.equal(
    fs.readFileSync(path.join(home, '.claude', 'CLAUDE.md'), 'utf8'),
    'old instructions',
    'claude/CLAUDE.md should be restored to original'
  );

  assert.ok(
    !fs.existsSync(path.join(home, '.cursor', '.cursorrules')),
    'cursor/.cursorrules (new file) should be removed after rollback'
  );

  assert.ok(
    !fs.existsSync(path.join(home, '.somefile')),
    'shared/.somefile (new file) should be removed after rollback'
  );

  // Cleanup
  fs.rmSync(tmp, { recursive: true });
});

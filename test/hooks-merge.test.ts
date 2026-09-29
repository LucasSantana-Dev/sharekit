import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { plan, applyProfile } from '../src/sharekit.ts';
import { restoreBackupInternal } from '../src/backup.ts';

const profileSettings = {
  model: 'profile-model',
  env: { FOO: 'bar' },
  hooks: {
    Stop: [{ hooks: [{ type: 'command', command: 'echo stop' }] }],
    PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'echo pre' }] }],
  },
};

const userHookGroup = { hooks: [{ type: 'command', command: 'echo mine' }] };
const userSettings = {
  permissions: { allow: ['Bash(ls:*)'] },
  model: 'opus',
  hooks: { Stop: [userHookGroup] },
};

function setup(userRaw?: string) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-merge-'));
  const profile = path.join(tmp, 'profile');
  fs.mkdirSync(path.join(profile, 'claude'), { recursive: true });
  fs.writeFileSync(path.join(profile, 'claude', 'settings.json'), JSON.stringify(profileSettings));
  fs.writeFileSync(path.join(profile, 'claude', 'CLAUDE.md'), 'profile md');
  const home = path.join(tmp, 'home');
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  const settingsPath = path.join(home, '.claude', 'settings.json');
  if (userRaw !== undefined) fs.writeFileSync(settingsPath, userRaw);
  const roots = {
    claude: path.join(home, '.claude'),
    cursor: path.join(home, '.cursor'),
    shared: home,
  };
  const dirs = { home, state: path.join(home, 'state') };
  return { tmp, profile, roots, dirs, settingsPath };
}

const read = (p: string) => JSON.parse(fs.readFileSync(p, 'utf8'));

test('include-hooks merges profile hooks into existing settings.json, keeping user keys', () => {
  const s = setup(JSON.stringify(userSettings, null, 2));
  applyProfile(plan(s.profile, s.roots), 'u', true, s.dirs);
  const out = read(s.settingsPath);
  assert.deepEqual(out.permissions, userSettings.permissions);
  assert.equal(out.model, 'opus', 'existing user value never overridden');
  assert.deepEqual(out.env, profileSettings.env, 'missing key added from profile');
  assert.deepEqual(out.hooks.Stop, [userHookGroup, profileSettings.hooks.Stop[0]]);
  assert.deepEqual(out.hooks.PreToolUse, profileSettings.hooks.PreToolUse);
  assert.equal(fs.readFileSync(path.join(s.roots.claude, 'CLAUDE.md'), 'utf8'), 'profile md');
});

test('include-hooks merge is idempotent (no duplicate groups on second run)', () => {
  const s = setup(JSON.stringify(userSettings));
  applyProfile(plan(s.profile, s.roots), 'u', true, s.dirs);
  const first = fs.readFileSync(s.settingsPath, 'utf8');
  assert.ok(first.includes('echo mine'));
  assert.equal(read(s.settingsPath).hooks.Stop.length, 2);
  const second = plan(s.profile, s.roots);
  assert.ok(!second.some((f) => f.rel === 'settings.json'), 'settings.json now classified same');
  applyProfile(second, 'u', true, s.dirs);
  assert.equal(fs.readFileSync(s.settingsPath, 'utf8'), first);
});

test('include-hooks with invalid user JSON leaves file untouched and warns', () => {
  const raw = '{ not json,,';
  const s = setup(raw);
  const warn = mock.method(console, 'warn', () => {});
  try {
    const r = applyProfile(plan(s.profile, s.roots), 'u', true, s.dirs);
    assert.equal(fs.readFileSync(s.settingsPath, 'utf8'), raw);
    assert.equal(r.filesWritten, 1, 'other files still applied');
    assert.ok(fs.existsSync(path.join(s.roots.claude, 'CLAUDE.md')));
    assert.ok(warn.mock.calls.some((c) => /settings\.json/.test(String(c.arguments[0]))));
  } finally {
    warn.mock.restore();
  }
});

test('include-hooks with no user settings.json writes the profile file as-is', () => {
  const s = setup();
  applyProfile(plan(s.profile, s.roots), 'u', true, s.dirs);
  assert.deepEqual(read(s.settingsPath), profileSettings);
});

test('plan marks existing settings.json as merged (hooks)', () => {
  const s = setup(JSON.stringify(userSettings));
  const f = plan(s.profile, s.roots).find((x) => x.rel === 'settings.json');
  assert.equal(f?.merge, 'hooks');
});

test('rollback restores the exact original settings.json bytes after merge', () => {
  const raw = JSON.stringify(userSettings, null, 4) + '\n\n';
  const s = setup(raw);
  const { backupDir } = applyProfile(plan(s.profile, s.roots), 'u', true, s.dirs);
  assert.notEqual(fs.readFileSync(s.settingsPath, 'utf8'), raw);
  restoreBackupInternal('u', backupDir, s.dirs);
  assert.equal(fs.readFileSync(s.settingsPath, 'utf8'), raw);
});

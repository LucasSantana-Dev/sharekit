import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { plan } from '../src/sharekit.ts';
import { rootsFor } from '../src/paths.ts';

test('plan mirrors the tree and classifies new vs changed', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-'));
  const profile = path.join(tmp, 'profile');
  const home = path.join(tmp, 'home');
  fs.mkdirSync(path.join(profile, 'claude', 'skills', 'foo'), { recursive: true });
  fs.writeFileSync(path.join(profile, 'claude', 'CLAUDE.md'), 'new content');
  fs.writeFileSync(path.join(profile, 'claude', 'skills', 'foo', 'SKILL.md'), 'x');

  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(home, '.claude', 'CLAUDE.md'), 'old content'); // pre-existing → changed

  const roots = {
    claude: path.join(home, '.claude'),
    cursor: path.join(home, '.cursor'),
    shared: home,
  };
  const byRel = Object.fromEntries(plan(profile, roots).map((f) => [f.rel, f]));

  assert.equal(byRel['CLAUDE.md'].status, 'changed');
  assert.equal(byRel['CLAUDE.md'].dest, path.join(home, '.claude', 'CLAUDE.md'));
  assert.equal(byRel[path.join('skills', 'foo', 'SKILL.md')].status, 'new'); // arbitrary nested file, no allowlist
  assert.equal(Object.keys(byRel).length, 2);
});

test('plan: skips symlinks and does not include them in plan results', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-plan-symlink-'));
  const profile = path.join(tmp, 'profile');
  const home = path.join(tmp, 'home');
  fs.mkdirSync(path.join(profile, 'claude'), { recursive: true });
  fs.writeFileSync(path.join(profile, 'claude', 'CLAUDE.md'), 'content');
  fs.writeFileSync(path.join(profile, 'claude', 'real-file.txt'), 'real');
  fs.symlinkSync(
    path.join(profile, 'claude', 'real-file.txt'),
    path.join(profile, 'claude', 'linked-file.txt'),
    'file'
  );
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  const roots = {
    claude: path.join(home, '.claude'),
    cursor: path.join(home, '.cursor'),
    shared: home,
  };
  const planResult = plan(profile, roots);
  assert.equal(planResult.length, 2);
  const files = planResult.map((f) => f.rel).sort();
  assert.ok(files.includes('CLAUDE.md'));
  assert.ok(files.includes('real-file.txt'));
  assert.ok(!files.includes('linked-file.txt'));
  fs.rmSync(tmp, { recursive: true });
});

test('plan: maps opencode/ and gjc/ to injected roots via rootsFor()', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-plan-roots-'));
  const profile = path.join(tmp, 'profile');
  const tmpHome = path.join(tmp, 'home');

  // Create profile with opencode and gjc files
  fs.mkdirSync(path.join(profile, 'opencode'), { recursive: true });
  fs.mkdirSync(path.join(profile, 'gjc'), { recursive: true });
  fs.writeFileSync(path.join(profile, 'opencode', 'settings.json'), '{"opencode": "settings"}');
  fs.writeFileSync(path.join(profile, 'gjc', 'config.toml'), '[gjc]\nkey = "value"');

  // Build roots for tmpHome (including new opencode and gjc mappings)
  const roots = rootsFor(tmpHome);

  // Ensure target directories exist so plan can compute status
  fs.mkdirSync(path.dirname(roots.opencode), { recursive: true });
  fs.mkdirSync(path.dirname(roots.gjc), { recursive: true });

  const planResult = plan(profile, roots);
  const byDest = Object.fromEntries(planResult.map((f) => [f.dest, f]));

  // Verify opencode/settings.json maps to ~/.config/opencode/settings.json
  const expectedOpencodeFile = path.join(tmpHome, '.config', 'opencode', 'settings.json');
  assert.ok(byDest[expectedOpencodeFile], 'opencode file should be in plan');
  assert.equal(byDest[expectedOpencodeFile].tool, 'opencode', 'tool should be opencode');

  // Verify gjc/config.toml maps to ~/.gjc/config.toml
  const expectedGjcFile = path.join(tmpHome, '.gjc', 'config.toml');
  assert.ok(byDest[expectedGjcFile], 'gjc file should be in plan');
  assert.equal(byDest[expectedGjcFile].tool, 'gjc', 'tool should be gjc');

  fs.rmSync(tmp, { recursive: true });
});

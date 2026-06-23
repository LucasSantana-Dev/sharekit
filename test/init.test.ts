import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { init } from '../src/sharekit.ts';
import TOML from '@iarna/toml';

test('init scaffolds a publishable profile from source root', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-init-'));
  const sourceRoot = path.join(tmp, 'source');
  const profileDir = path.join(tmp, 'sharekit-profile');

  // Set up a fake source ~/.claude with CLAUDE.md and a skill
  fs.mkdirSync(path.join(sourceRoot, '.claude', 'skills', 'foo'), { recursive: true });
  fs.writeFileSync(path.join(sourceRoot, '.claude', 'CLAUDE.md'), '# My instructions\nSecond line');
  fs.writeFileSync(
    path.join(sourceRoot, '.claude', 'skills', 'foo', 'SKILL.md'),
    'foo skill content'
  );
  fs.mkdirSync(path.join(sourceRoot, '.claude', 'skills', 'foo', 'subdir'), { recursive: true });
  fs.writeFileSync(
    path.join(sourceRoot, '.claude', 'skills', 'foo', 'subdir', 'nested.txt'),
    'nested'
  );

  // Run init with skill "foo"
  init(profileDir, ['foo'], sourceRoot);

  // Verify sharekit.toml was created
  assert(fs.existsSync(path.join(profileDir, 'sharekit.toml')));
  const toml = TOML.parse(fs.readFileSync(path.join(profileDir, 'sharekit.toml'), 'utf8'));
  assert.equal(toml.profile.name, os.userInfo().username);
  assert.equal(toml.profile.version, '0.1.0');

  // Verify CLAUDE.md was copied
  assert.equal(
    fs.readFileSync(path.join(profileDir, 'claude', 'CLAUDE.md'), 'utf8'),
    '# My instructions\nSecond line'
  );

  // Verify skill files were copied recursively
  assert.equal(
    fs.readFileSync(path.join(profileDir, 'claude', 'skills', 'foo', 'SKILL.md'), 'utf8'),
    'foo skill content'
  );
  assert.equal(
    fs.readFileSync(
      path.join(profileDir, 'claude', 'skills', 'foo', 'subdir', 'nested.txt'),
      'utf8'
    ),
    'nested'
  );

  // Cleanup
  fs.rmSync(tmp, { recursive: true });
});

test('init errors if profile directory already exists', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-init-'));
  const profileDir = path.join(tmp, 'sharekit-profile');
  fs.mkdirSync(profileDir);

  assert.throws(
    () => {
      init(profileDir, [], tmp);
    },
    { message: /already exists/ }
  );

  fs.rmSync(tmp, { recursive: true });
});

test("init creates placeholder CLAUDE.md if source doesn't have one", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-init-'));
  const sourceRoot = path.join(tmp, 'source');
  const profileDir = path.join(tmp, 'sharekit-profile');

  fs.mkdirSync(sourceRoot); // No .claude directory

  init(profileDir, [], sourceRoot);

  const claudeMd = fs.readFileSync(path.join(profileDir, 'claude', 'CLAUDE.md'), 'utf8');
  assert(claudeMd.includes('My AI coding instructions'));

  fs.rmSync(tmp, { recursive: true });
});

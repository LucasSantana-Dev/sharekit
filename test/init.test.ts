import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { init } from '../src/sharekit.ts';
import { parse as parseToml } from 'smol-toml';

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
  const toml = parseToml(fs.readFileSync(path.join(profileDir, 'sharekit.toml'), 'utf8')) as {
    profile: { name: string; version: string };
  };
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

test('init errors if profile directory already exists (no --force)', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-init-'));
  const profileDir = path.join(tmp, 'sharekit-profile');
  fs.mkdirSync(profileDir);

  assert.throws(
    () => {
      init(profileDir, [], tmp);
    },
    { message: /already exists.*--force/i }
  );

  fs.rmSync(tmp, { recursive: true });
});

test('init --force overwrites existing partial profile directory', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-init-force-'));
  const profileDir = path.join(tmp, 'sharekit-profile');

  // Create a partial/corrupt existing profile
  fs.mkdirSync(path.join(profileDir, 'stale-dir'), { recursive: true });
  fs.writeFileSync(path.join(profileDir, 'stale-file.txt'), 'leftover content');

  // --force should succeed without throwing
  init(profileDir, [], tmp, true);

  // Fresh profile should exist; stale files should be gone
  assert.ok(fs.existsSync(path.join(profileDir, 'sharekit.toml')), 'fresh sharekit.toml created');
  assert.ok(!fs.existsSync(path.join(profileDir, 'stale-file.txt')), 'stale files removed');
  assert.ok(!fs.existsSync(path.join(profileDir, 'stale-dir')), 'stale dirs removed');

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

test('init escapes username with special characters in TOML', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-init-escape-'));
  const sourceRoot = path.join(tmp, 'source');
  const profileDir = path.join(tmp, 'sharekit-profile');

  fs.mkdirSync(sourceRoot);

  init(profileDir, [], sourceRoot);

  // Verify sharekit.toml was created and is valid TOML
  const tomlPath = path.join(profileDir, 'sharekit.toml');
  assert(fs.existsSync(tomlPath));
  const tomlContent = fs.readFileSync(tomlPath, 'utf8');

  // Parse TOML and verify it's valid (would throw if not)
  const toml = parseToml(tomlContent) as {
    profile: { name: string; version: string };
  };

  // The profile name should match the current user
  assert.equal(toml.profile.name, os.userInfo().username);
  assert.equal(toml.profile.version, '0.1.0');

  fs.rmSync(tmp, { recursive: true });
});

test('init scaffolds opencode/ and gjc/ directories with placeholder configs', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-init-roots-'));
  const sourceRoot = path.join(tmp, 'source');
  const profileDir = path.join(tmp, 'sharekit-profile');

  fs.mkdirSync(sourceRoot);

  init(profileDir, [], sourceRoot);

  // Verify opencode/ was created with placeholder
  assert(fs.existsSync(path.join(profileDir, 'opencode')));
  assert(fs.existsSync(path.join(profileDir, 'opencode', 'config.json')));
  const opencodeContent = fs.readFileSync(path.join(profileDir, 'opencode', 'config.json'), 'utf8');
  assert(opencodeContent.includes('opencode configuration'));

  // Verify gjc/ was created with placeholder
  assert(fs.existsSync(path.join(profileDir, 'gjc')));
  assert(fs.existsSync(path.join(profileDir, 'gjc', 'config.toml')));
  const gjcContent = fs.readFileSync(path.join(profileDir, 'gjc', 'config.toml'), 'utf8');
  assert(gjcContent.includes('gjc configuration'));

  fs.rmSync(tmp, { recursive: true });
});

test('init copies opencode/ and gjc/ configs from source root if present', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-init-roots-src-'));
  const sourceRoot = path.join(tmp, 'source');
  const profileDir = path.join(tmp, 'sharekit-profile');

  // Set up source with opencode and gjc configs
  fs.mkdirSync(path.join(sourceRoot, '.config', 'opencode'), { recursive: true });
  fs.mkdirSync(path.join(sourceRoot, '.gjc'), { recursive: true });
  fs.writeFileSync(
    path.join(sourceRoot, '.config', 'opencode', 'settings.json'),
    '{"opencode": "settings"}'
  );
  fs.writeFileSync(path.join(sourceRoot, '.gjc', 'config.toml'), '[gjc]\nkey = "value"');

  init(profileDir, [], sourceRoot);

  // Verify configs were copied from source
  assert.equal(
    fs.readFileSync(path.join(profileDir, 'opencode', 'settings.json'), 'utf8'),
    '{"opencode": "settings"}'
  );
  assert.equal(
    fs.readFileSync(path.join(profileDir, 'gjc', 'config.toml'), 'utf8'),
    '[gjc]\nkey = "value"'
  );

  fs.rmSync(tmp, { recursive: true });
});

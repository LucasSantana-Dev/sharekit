import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { plan, applyProfile, DANGEROUS_SHARED_DOTFILES, isExecutable } from '../src/sharekit.ts';

test('dotfiles: .zshrc and similar files are gated in shared/ by default', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-dotfiles-'));
  const profile = path.join(tmp, 'profile');
  const home = path.join(tmp, 'home');
  const state = path.join(tmp, 'state');

  // Create profile with dangerous dotfiles in shared/
  fs.mkdirSync(path.join(profile, 'shared'), { recursive: true });
  fs.writeFileSync(path.join(profile, 'shared', '.zshrc'), 'evil zsh config');
  fs.writeFileSync(path.join(profile, 'shared', '.bashrc'), 'evil bash config');
  fs.writeFileSync(path.join(profile, 'shared', 'normal-file.txt'), 'safe file');

  const roots = {
    claude: path.join(home, '.claude'),
    cursor: path.join(home, '.cursor'),
    opencode: path.join(home, '.config', 'opencode'),
    gjc: path.join(home, '.gjc'),
    shared: home,
  };
  const dirs = { home, state };

  const files = plan(profile, roots);

  // .zshrc and .bashrc should be marked as executable (gated)
  const zshrc = files.find((f) => f.rel === '.zshrc');
  const bashrc = files.find((f) => f.rel === '.bashrc');
  const normalFile = files.find((f) => f.rel === 'normal-file.txt');

  assert.ok(zshrc, '.zshrc should be in plan');
  assert.ok(bashrc, '.bashrc should be in plan');
  assert.ok(normalFile, 'normal-file.txt should be in plan');

  // Test isExecutable: by default includeDotfiles=false, so dotfiles are gated
  assert.ok(isExecutable(zshrc!, false, false), '.zshrc should be gated by default');
  assert.ok(isExecutable(bashrc!, false, false), '.bashrc should be gated by default');
  assert.ok(!isExecutable(normalFile!, false, false), 'normal-file.txt should NOT be gated');

  // Test applyProfile with includeDotfiles=false (default)
  const { filesWritten: filesWritten1 } = applyProfile(
    files,
    'testuser',
    false,
    dirs,
    false,
    false
  );

  // Only normal-file.txt should be written (not .zshrc, .bashrc)
  assert.equal(filesWritten1, 1, 'should write only normal-file.txt');
  assert.ok(
    fs.existsSync(path.join(home, 'normal-file.txt')),
    'normal-file.txt should be installed'
  );
  assert.ok(!fs.existsSync(path.join(home, '.zshrc')), '.zshrc should NOT be installed');
  assert.ok(!fs.existsSync(path.join(home, '.bashrc')), '.bashrc should NOT be installed');

  fs.rmSync(tmp, { recursive: true });
});

test('dotfiles: with includeDotfiles=true, dangerous files ARE installed', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-dotfiles-include-'));
  const profile = path.join(tmp, 'profile');
  const home = path.join(tmp, 'home');
  const state = path.join(tmp, 'state');

  // Create profile with dangerous dotfiles in shared/
  fs.mkdirSync(path.join(profile, 'shared'), { recursive: true });
  fs.writeFileSync(path.join(profile, 'shared', '.zshrc'), 'zsh config');
  fs.writeFileSync(path.join(profile, 'shared', 'normal-file.txt'), 'safe file');

  const roots = {
    claude: path.join(home, '.claude'),
    cursor: path.join(home, '.cursor'),
    opencode: path.join(home, '.config', 'opencode'),
    gjc: path.join(home, '.gjc'),
    shared: home,
  };
  const dirs = { home, state };

  const files = plan(profile, roots);

  // With includeDotfiles=true, isExecutable should return false for dotfiles
  const zshrc = files.find((f) => f.rel === '.zshrc');
  assert.ok(
    !isExecutable(zshrc!, false, true),
    '.zshrc should NOT be gated when includeDotfiles=true'
  );

  // Apply with includeDotfiles=true
  const { filesWritten } = applyProfile(files, 'testuser', false, dirs, false, true);

  // Both files should be written
  assert.equal(filesWritten, 2, 'should write both .zshrc and normal-file.txt');
  assert.ok(
    fs.existsSync(path.join(home, 'normal-file.txt')),
    'normal-file.txt should be installed'
  );
  assert.ok(
    fs.existsSync(path.join(home, '.zshrc')),
    '.zshrc SHOULD be installed with includeDotfiles=true'
  );

  fs.rmSync(tmp, { recursive: true });
});

test('dotfiles: claude/settings.json gating unchanged', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-settings-'));
  const profile = path.join(tmp, 'profile');
  const home = path.join(tmp, 'home');
  const state = path.join(tmp, 'state');

  // Create profile with settings.json in claude/
  fs.mkdirSync(path.join(profile, 'claude'), { recursive: true });
  fs.writeFileSync(path.join(profile, 'claude', 'settings.json'), '{"hooks": []}');

  const roots = {
    claude: path.join(home, '.claude'),
    cursor: path.join(home, '.cursor'),
    opencode: path.join(home, '.config', 'opencode'),
    gjc: path.join(home, '.gjc'),
    shared: home,
  };
  const dirs = { home, state };

  const files = plan(profile, roots);
  const settings = files.find((f) => f.rel === 'settings.json');

  assert.ok(settings, 'settings.json should be in plan');

  // settings.json should still be gated by includeHooks, not includeDotfiles
  assert.ok(isExecutable(settings!, false, false), 'settings.json should be gated by includeHooks');
  assert.ok(
    isExecutable(settings!, false, true),
    'settings.json should be gated even with includeDotfiles=true'
  );
  assert.ok(
    !isExecutable(settings!, true, false),
    'settings.json should NOT be gated with includeHooks=true'
  );

  fs.rmSync(tmp, { recursive: true });
});

test('empty profile: install should fail when no files are present (#151)', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-empty-'));
  const profile = path.join(tmp, 'profile');

  // Create profile with no tool directories
  fs.mkdirSync(profile, { recursive: true });
  fs.writeFileSync(path.join(profile, 'sharekit.toml'), '[profile]\nname = "empty"\n');

  const roots = {
    claude: path.join(tmp, 'home', '.claude'),
    cursor: path.join(tmp, 'home', '.cursor'),
    opencode: path.join(tmp, 'home', '.config', 'opencode'),
    gjc: path.join(tmp, 'home', '.gjc'),
    shared: path.join(tmp, 'home'),
  };

  const files = plan(profile, roots);
  assert.equal(files.length, 0, 'plan should have zero files for empty profile');

  fs.rmSync(tmp, { recursive: true });
});

test('DANGEROUS_SHARED_DOTFILES denylist is exported and contains expected files', () => {
  assert.ok(DANGEROUS_SHARED_DOTFILES instanceof Set, 'DANGEROUS_SHARED_DOTFILES should be a Set');
  assert.ok(DANGEROUS_SHARED_DOTFILES.has('.zshrc'), '.zshrc should be in denylist');
  assert.ok(DANGEROUS_SHARED_DOTFILES.has('.bashrc'), '.bashrc should be in denylist');
  assert.ok(DANGEROUS_SHARED_DOTFILES.has('.zshenv'), '.zshenv should be in denylist');
  assert.ok(DANGEROUS_SHARED_DOTFILES.has('.profile'), '.profile should be in denylist');
  assert.ok(DANGEROUS_SHARED_DOTFILES.has('.xinitrc'), '.xinitrc should be in denylist');
});

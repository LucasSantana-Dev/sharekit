import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { tildify, walkWithSymlinks, HOME } from '../src/paths.ts';

test('tildify with no maxLen returns full home-relative path', () => {
  const shortPath = path.join(HOME, '.claude', 'CLAUDE.md');
  const result = tildify(shortPath);
  assert.equal(result, '~/.claude/CLAUDE.md');
});

test('tildify with maxLen longer than path returns full path unchanged', () => {
  const shortPath = path.join(HOME, '.claude');
  const result = tildify(shortPath, 50);
  assert.equal(result, '~/.claude');
});

test('tildify with maxLen truncates long paths with ellipsis in middle', () => {
  const longPath = path.join(
    HOME,
    '.claude',
    'skills',
    'very-long-skill-name',
    'nested',
    'deeply',
    'SKILL.md'
  );
  const result = tildify(longPath, 20);
  assert.equal(result.length, 20, 'truncated result is exactly maxLen');
  assert.match(result, /\.\.\./, 'truncated result contains ellipsis');
  assert.ok(result.startsWith('~'), 'truncated result starts with tilde');
  assert.ok(result.endsWith('.md'), 'truncated result ends with file extension from original path');
});

test('tildify does not truncate paths not under HOME', () => {
  const externalPath = '/tmp/some/path';
  const result = tildify(externalPath, 10);
  assert.equal(result, externalPath, 'external paths passed through even with maxLen');
});

test('walkWithSymlinks detects and skips symlink loops', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-walk-loop-'));
  const loopDir = path.join(tmp, 'a');
  fs.mkdirSync(loopDir);

  // Create symlink that points to parent (creates loop: a/loop -> a)
  const symlink = path.join(loopDir, 'loop');
  fs.symlinkSync(loopDir, symlink);

  // Create a regular file in the directory to verify we still find it
  const regularFile = path.join(loopDir, 'file.txt');
  fs.writeFileSync(regularFile, 'test');

  const result = walkWithSymlinks(loopDir);

  assert.ok(result.files.includes(regularFile), 'regular files are found');
  assert.ok(result.skippedSymlinks.includes(symlink), 'symlink is tracked as skipped');
  // If symlink loop is not handled, this would hang or cause infinite recursion
  // The test itself passing (not timing out) is the main verification

  fs.rmSync(tmp, { recursive: true });
});

test('walkWithSymlinks prevents symlink loop traversal', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-walk-complex-'));
  const aDir = path.join(tmp, 'a');
  const subDir = path.join(aDir, 'subdir');
  fs.mkdirSync(aDir);
  fs.mkdirSync(subDir);

  // Create files
  fs.writeFileSync(path.join(aDir, 'a.txt'), 'a');
  fs.writeFileSync(path.join(subDir, 'sub.txt'), 'sub');

  // Create a symlink from subdir that points back up, creating potential loop
  fs.symlinkSync(aDir, path.join(subDir, 'loop-back'));

  const result = walkWithSymlinks(aDir);

  // Should find both real files
  assert.ok(
    result.files.some((f) => f.includes('a.txt')),
    'finds file in root dir'
  );
  assert.ok(
    result.files.some((f) => f.includes('sub.txt')),
    'finds file in subdir'
  );
  // Should skip the symlink that creates the loop
  assert.ok(
    result.skippedSymlinks.some((s) => s.includes('loop-back')),
    'skips symlink that would create loop'
  );

  fs.rmSync(tmp, { recursive: true });
});

test('walkWithSymlinks handles normal directories without symlinks', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-walk-normal-'));
  const subdir = path.join(tmp, 'subdir');
  fs.mkdirSync(subdir);

  fs.writeFileSync(path.join(tmp, 'file1.txt'), 'content1');
  fs.writeFileSync(path.join(subdir, 'file2.txt'), 'content2');

  const result = walkWithSymlinks(tmp);

  assert.equal(result.files.length, 2, 'finds both files');
  assert.equal(result.skippedSymlinks.length, 0, 'no symlinks skipped');
  assert.ok(
    result.files.some((f) => f.includes('file1.txt')),
    'finds file1.txt'
  );
  assert.ok(
    result.files.some((f) => f.includes('file2.txt')),
    'finds file2.txt'
  );

  fs.rmSync(tmp, { recursive: true });
});

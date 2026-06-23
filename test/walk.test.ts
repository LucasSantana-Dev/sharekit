import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { walk } from '../src/sharekit.ts';

test('walk: returns empty array for empty directory', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-walk-empty-'));
  try {
    const files = walk(tmp);
    assert.deepEqual(files, []);
  } finally {
    fs.rmSync(tmp, { recursive: true });
  }
});

test('walk: recursively finds all files in nested directories', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-walk-nested-'));
  try {
    fs.writeFileSync(path.join(tmp, 'file1.txt'), 'content1');
    fs.mkdirSync(path.join(tmp, 'dir1'));
    fs.writeFileSync(path.join(tmp, 'dir1', 'file2.txt'), 'content2');
    fs.mkdirSync(path.join(tmp, 'dir1', 'subdir'));
    fs.writeFileSync(path.join(tmp, 'dir1', 'subdir', 'file3.txt'), 'content3');
    fs.mkdirSync(path.join(tmp, 'dir2'));
    fs.writeFileSync(path.join(tmp, 'dir2', 'file4.txt'), 'content4');

    const files = walk(tmp).sort();
    const expected = [
      path.join(tmp, 'file1.txt'),
      path.join(tmp, 'dir1', 'file2.txt'),
      path.join(tmp, 'dir1', 'subdir', 'file3.txt'),
      path.join(tmp, 'dir2', 'file4.txt'),
    ].sort();

    assert.deepEqual(files, expected);
  } finally {
    fs.rmSync(tmp, { recursive: true });
  }
});

test('walk: skips symlinks', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-walk-symlink-'));
  try {
    fs.writeFileSync(path.join(tmp, 'file1.txt'), 'content1');
    fs.mkdirSync(path.join(tmp, 'dir1'));
    fs.writeFileSync(path.join(tmp, 'dir1', 'file2.txt'), 'content2');

    fs.symlinkSync(
      path.join(tmp, 'file1.txt'),
      path.join(tmp, 'linked_file'),
      'file'
    );
    fs.symlinkSync(
      path.join(tmp, 'dir1'),
      path.join(tmp, 'linked_dir'),
      'dir'
    );

    const files = walk(tmp).sort();
    const expected = [
      path.join(tmp, 'file1.txt'),
      path.join(tmp, 'dir1', 'file2.txt'),
    ].sort();

    assert.deepEqual(files, expected, 'symlinks should be skipped');
  } finally {
    fs.rmSync(tmp, { recursive: true });
  }
});

test('walk: handles nested empty directories', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-walk-empty-nested-'));
  try {
    fs.writeFileSync(path.join(tmp, 'file1.txt'), 'content1');
    fs.mkdirSync(path.join(tmp, 'empty_dir1'));
    fs.mkdirSync(path.join(tmp, 'dir_with_file'));
    fs.writeFileSync(path.join(tmp, 'dir_with_file', 'file2.txt'), 'content2');
    fs.mkdirSync(path.join(tmp, 'dir_with_file', 'empty_subdir'));

    const files = walk(tmp).sort();
    const expected = [
      path.join(tmp, 'file1.txt'),
      path.join(tmp, 'dir_with_file', 'file2.txt'),
    ].sort();

    assert.deepEqual(files, expected, 'empty directories should not appear in results');
  } finally {
    fs.rmSync(tmp, { recursive: true });
  }
});

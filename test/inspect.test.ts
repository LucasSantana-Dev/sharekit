import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { inspect, readManifest, plan } from '../src/sharekit.ts';

// Test offline: inspect reads a cached profile and outputs manifest + file tree
test('inspect: outputs manifest and file tree grouped by tool', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-inspect-'));
  const profileDir = path.join(tmp, 'testprofile');

  // Create a minimal profile with multiple tools
  fs.mkdirSync(path.join(profileDir, 'claude', 'skills', 'demo'), { recursive: true });
  fs.writeFileSync(path.join(profileDir, 'claude', 'CLAUDE.md'), 'claude instructions');
  fs.writeFileSync(path.join(profileDir, 'claude', 'skills', 'demo', 'SKILL.md'), 'skill docs');

  fs.mkdirSync(path.join(profileDir, 'cursor'), { recursive: true });
  fs.writeFileSync(path.join(profileDir, 'cursor', '.cursorrules'), 'cursor rules');

  fs.mkdirSync(path.join(profileDir, 'shared'), { recursive: true });
  fs.writeFileSync(path.join(profileDir, 'shared', '.gitignore'), '*.log');

  // Create sharekit.toml
  fs.writeFileSync(
    path.join(profileDir, 'sharekit.toml'),
    `[profile]
name = "test-profile"
version = "1.0.0"
description = "Test profile for inspect"
`
  );

  // Mock console.log to capture output
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: any[]) => logs.push(args.join(' '));

  try {
    // Create a fake profile cache directory
    const cacheDir = path.join(tmp, 'cache');
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.cpSync(profileDir, path.join(cacheDir, 'testuser'), { recursive: true });

    // Test that readManifest works on the profile
    const manifest = readManifest(profileDir);
    assert.equal(manifest.name, 'test-profile');
    assert.equal(manifest.version, '1.0.0');
    assert.equal(manifest.description, 'Test profile for inspect');

    // Test that plan groups files by tool
    const files = plan(profileDir);
    assert.ok(files.length > 0, 'plan should return files');

    // Verify files are grouped correctly
    const byTool: Record<string, string[]> = {};
    for (const f of files) {
      if (!byTool[f.tool]) byTool[f.tool] = [];
      byTool[f.tool].push(f.rel);
    }

    assert.ok(byTool['claude'], 'should have claude tool');
    assert.ok(byTool['cursor'], 'should have cursor tool');
    assert.ok(byTool['shared'], 'should have shared tool');

    // Verify file structure
    assert.ok(
      byTool['claude'].some((f) => f.includes('CLAUDE.md')),
      'claude should contain CLAUDE.md'
    );
    assert.ok(
      byTool['claude'].some((f) => f.includes('skills/demo/SKILL.md')),
      'claude should contain skills/demo/SKILL.md'
    );
    assert.ok(byTool['cursor'].includes('.cursorrules'), 'cursor should contain .cursorrules');
    assert.ok(byTool['shared'].includes('.gitignore'), 'shared should contain .gitignore');
  } finally {
    console.log = originalLog;
    fs.rmSync(tmp, { recursive: true });
  }
});

// Test offline: inspect on empty profile
test('inspect: handles empty profile gracefully', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-inspect-empty-'));
  const profileDir = path.join(tmp, 'empty-profile');

  fs.mkdirSync(profileDir, { recursive: true });
  fs.writeFileSync(
    path.join(profileDir, 'sharekit.toml'),
    `[profile]
name = "empty-profile"
version = "0.1.0"
description = "Empty test profile"
`
  );

  try {
    const manifest = readManifest(profileDir);
    assert.equal(manifest.name, 'empty-profile');

    const files = plan(profileDir);
    assert.equal(files.length, 0, 'empty profile should have no files');
  } finally {
    fs.rmSync(tmp, { recursive: true });
  }
});

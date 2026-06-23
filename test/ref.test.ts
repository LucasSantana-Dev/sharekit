import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import { fetchProfile, isImmutableRef } from '../src/sharekit.ts';

test('isImmutableRef: SHAs (any case) and dotted semver are immutable; branches are not', () => {
  // #82 — uppercase/mixed-case hex SHAs must be recognized as immutable
  assert.equal(isImmutableRef('abc1234'), true, 'lowercase SHA');
  assert.equal(isImmutableRef('ABC1234DEF'), true, 'uppercase SHA');
  assert.equal(isImmutableRef('AbC1234dEf90'), true, 'mixed-case SHA');
  assert.equal(isImmutableRef('v1.0.0'), true, 'dotted semver tag');
  assert.equal(isImmutableRef('1.2'), true, 'numeric tag');
  // ambiguous/branch names → mutable (safe: best-effort pull no-ops on tags)
  assert.equal(isImmutableRef('main'), false);
  assert.equal(isImmutableRef('v2-wip'), false, 'version-like branch');
  assert.equal(isImmutableRef('release-2'), false, 'non-dotted tag → treated mutable');
});

// #7 — install <user>@<ref>: `git clone --depth 1 --branch <ref>` resolves a TAG and a BRANCH.
// Build a local origin at <tmp>/acme/sharekit-profile with tag v1 + branch stable at c1, main ahead at c2.
test('fetchProfile pins to a tag and a branch via --branch', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-ref-'));
  const origin = path.join(tmp, 'acme', 'sharekit-profile');
  fs.mkdirSync(origin, { recursive: true });
  const git = (cmd: string) => execSync(`git ${cmd}`, { cwd: origin, stdio: 'pipe' });
  git('init -q');
  git('config user.email t@t.t');
  git('config user.name t');
  fs.writeFileSync(path.join(origin, 'f.txt'), 'v1\n');
  fs.writeFileSync(path.join(origin, 'sharekit.toml'), '[profile]\nname="acme"\nversion="1.0"\n');
  git('add .');
  git('commit -qm c1');
  git('tag v1');
  git('branch stable');
  fs.writeFileSync(path.join(origin, 'f.txt'), 'v2-HEAD\n');
  git('commit -qam c2'); // main now ahead of v1/stable

  const baseUrl = `file://${tmp}`;
  const cache = path.join(tmp, 'cache');

  const tagDir = fetchProfile('acme', 'v1', baseUrl, cache);
  assert.equal(fs.readFileSync(path.join(tagDir, 'f.txt'), 'utf8'), 'v1\n', 'tag pins to c1');

  const branchDir = fetchProfile('acme', 'stable', baseUrl, cache);
  assert.equal(fs.readFileSync(path.join(branchDir, 'f.txt'), 'utf8'), 'v1\n', 'branch pins to c1');

  const headDir = fetchProfile('acme', undefined, baseUrl, cache);
  assert.equal(fs.readFileSync(path.join(headDir, 'f.txt'), 'utf8'), 'v2-HEAD\n', 'no ref → HEAD');

  // cache keys are distinct per ref
  assert.ok(fs.existsSync(path.join(cache, 'acme@v1')));
  assert.ok(fs.existsSync(path.join(cache, 'acme@stable')));
  assert.ok(fs.existsSync(path.join(cache, 'acme')));
});

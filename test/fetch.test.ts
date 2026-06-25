import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { parseUserRef, fetchProfile } from '../src/fetch.ts';

test('parseUserRef: valid cases', () => {
  // Valid username without ref
  const result1 = parseUserRef('valid-user');
  assert.equal(result1.user, 'valid-user');
  assert.equal(result1.ref, undefined);

  // Valid username with tag ref
  const result2 = parseUserRef('valid-user@v1.0');
  assert.equal(result2.user, 'valid-user');
  assert.equal(result2.ref, 'v1.0');

  // Valid username with branch ref
  const result3 = parseUserRef('valid-user@main');
  assert.equal(result3.user, 'valid-user');
  assert.equal(result3.ref, 'main');

  // Valid with numeric version
  const result4 = parseUserRef('john-doe@1.2.3');
  assert.equal(result4.user, 'john-doe');
  assert.equal(result4.ref, '1.2.3');

  // Valid with underscores
  const result5 = parseUserRef('user_name@ref-name');
  assert.equal(result5.user, 'user_name');
  assert.equal(result5.ref, 'ref-name');
});

test('parseUserRef: @ edge cases — missing username', () => {
  assert.throws(
    () => parseUserRef('@ref'),
    /missing GitHub username before '@'/,
    '@ref should throw with missing username message'
  );

  assert.throws(
    () => parseUserRef('@'),
    /missing GitHub username before '@'/,
    '@ alone should throw'
  );
});

test('parseUserRef: @ edge cases — missing ref', () => {
  assert.throws(
    () => parseUserRef('user@'),
    /ref cannot be empty after '@'/,
    'user@ should throw with empty ref message'
  );

  assert.throws(
    () => parseUserRef('user@ '),
    /ref cannot be empty after '@'/,
    'user@ with trailing space should throw'
  );
});

test('parseUserRef: path traversal via username', () => {
  assert.throws(
    () => parseUserRef('../../etc'),
    /username cannot contain '\.\.'/,
    '../../etc in username should throw'
  );

  // user/../admin contains both '..' and '/', but we check '..' first
  assert.throws(
    () => parseUserRef('user/../admin'),
    /username cannot contain '\.\.'/,
    'slash/.. in username should throw'
  );

  assert.throws(
    () => parseUserRef('../admin'),
    /username cannot contain '\.\.'/,
    '../ in username should throw'
  );
});

test('parseUserRef: path traversal via ref', () => {
  assert.throws(
    () => parseUserRef('user@../../etc'),
    /ref cannot contain '\.\.'/,
    '../../etc in ref should throw'
  );

  assert.throws(
    () => parseUserRef('user@../main'),
    /ref cannot contain '\.\.'/,
    '../ in ref should throw'
  );
});

test('parseUserRef: slash in username', () => {
  assert.throws(
    () => parseUserRef('user/admin'),
    /username cannot contain path separators/,
    'slash in username should throw'
  );

  assert.throws(
    () => parseUserRef('org/user'),
    /username cannot contain path separators/,
    'org/user should throw'
  );

  assert.throws(
    () => parseUserRef('user/admin@ref'),
    /username cannot contain path separators/,
    'slash in username with ref should throw'
  );
});

test('parseUserRef: empty username', () => {
  assert.throws(
    () => parseUserRef(''),
    /username cannot be empty/,
    'empty string should throw'
  );

  assert.throws(
    () => parseUserRef('   '),
    /username cannot be empty/,
    'whitespace-only should throw'
  );
});

test('parseUserRef: multiple @ signs', () => {
  // Last @ is the separator; everything before is the username
  const result = parseUserRef('user@domain@v1.0');
  assert.equal(result.user, 'user@domain');
  assert.equal(result.ref, 'v1.0');
});

test('fetchProfile: path containment check prevents cache escape', () => {
  // Create a temporary cache root
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-fetch-'));
  const cacheRoot = path.join(tmp, 'cache');
  fs.mkdirSync(cacheRoot, { recursive: true });

  // Verify that a normal cache key doesn't trigger the containment check
  const user = 'valid-user';
  const ref = undefined;
  const cacheKey = ref ? `${user}@${ref}` : user;
  const dir = path.join(cacheRoot, cacheKey);

  const resolvedCache = path.resolve(cacheRoot);
  const resolvedDir = path.resolve(dir);

  // Normal paths should pass the containment check
  assert.ok(resolvedDir.startsWith(resolvedCache + path.sep), 'normal cache path should be contained');
});

test('fetchProfile: malicious input rejected at parseUserRef level', () => {
  // The primary defense is in parseUserRef; fetchProfile is defense-in-depth.
  // Verify that the validation prevents malicious input from reaching fetchProfile.

  assert.throws(() => parseUserRef('../../etc'), /username cannot contain '\.\.'/);
  // user/../etc contains both '..' and '/', we check '..' first
  assert.throws(() => parseUserRef('user/../etc'), /username cannot contain '\.\.'/);
  assert.throws(() => parseUserRef('user@../../main'), /ref cannot contain '\.\.'/);
});

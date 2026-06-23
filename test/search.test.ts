import { test } from 'node:test';
import assert from 'node:assert/strict';
import { search } from '../src/sharekit.ts';

test('search lists only repos named sharekit-profile, with install hints', async () => {
  const realFetch = globalThis.fetch;
  const realLog = console.log;
  const out: string[] = [];
  console.log = (...a: unknown[]) => out.push(a.join(' '));

  // mock GitHub search: one real profile + one false-positive name
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        items: [
          {
            name: 'sharekit-profile',
            owner: { login: 'alice' },
            description: 'alice setup',
            stargazers_count: 4,
          },
          {
            name: 'sharekit-profile-archive',
            owner: { login: 'bob' },
            description: 'not a profile',
          },
        ],
      }),
      { status: 200 }
    )) as typeof fetch;

  try {
    await search();
  } finally {
    globalThis.fetch = realFetch;
    console.log = realLog;
  }

  const text = out.join('\n');
  assert.match(text, /alice/, 'lists the real profile owner');
  assert.match(text, /install alice/, 'shows the install command');
  assert.doesNotMatch(text, /bob/, 'filters out non-exact repo names');
});

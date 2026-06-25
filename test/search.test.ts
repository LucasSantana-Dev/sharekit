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

test('search excludes archived repos from results', async () => {
  const realFetch = globalThis.fetch;
  const realLog = console.log;
  const out: string[] = [];
  let capturedUrl = '';
  console.log = (...a: unknown[]) => out.push(a.join(' '));

  // mock GitHub search and capture the URL
  globalThis.fetch = (async (url: string | Request) => {
    capturedUrl = typeof url === 'string' ? url : url.url;
    return new Response(
      JSON.stringify({
        items: [
          {
            name: 'sharekit-profile',
            owner: { login: 'alice' },
            description: 'alice setup',
            stargazers_count: 4,
          },
        ],
      }),
      { status: 200 }
    );
  }) as typeof fetch;

  try {
    await search();
  } finally {
    globalThis.fetch = realFetch;
    console.log = realLog;
  }

  assert.match(capturedUrl, /archived%3Afalse/, 'query includes URL-encoded archived:false');
});

test('search surfaces rate limit 403 with reset time and GITHUB_TOKEN hint', async () => {
  const realFetch = globalThis.fetch;

  // mock GitHub API rate limit response
  const resetTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  globalThis.fetch = (async () =>
    new Response('Forbidden', {
      status: 403,
      headers: {
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetTimestamp.toString(),
      },
    })) as typeof fetch;

  try {
    await assert.rejects(
      async () => search(),
      (err) => {
        const message = (err as Error).message;
        return (
          message.includes('rate limit') &&
          message.includes('GITHUB_TOKEN') &&
          message.includes('resets at')
        );
      },
      'throws error mentioning rate limit, GITHUB_TOKEN, and reset time'
    );
  } finally {
    globalThis.fetch = realFetch;
  }
});

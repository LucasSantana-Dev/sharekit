import { test } from 'node:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.ts';

function captureCLI(fn: () => Promise<void>) {
  const originalExit = process.exit;
  const originalLog = console.log;
  const originalError = console.error;

  let exitCode: number | undefined;
  let output: string[] = [];
  let errorOutput: string[] = [];

  (process.exit as unknown) = (code?: number) => {
    exitCode = code ?? 0;
    throw new Error(`process.exit(${code})`);
  };

  console.log = (...args: unknown[]) => {
    output.push(args.map(String).join(' '));
  };

  console.error = (...args: unknown[]) => {
    errorOutput.push(args.map(String).join(' '));
  };

  return {
    async run() {
      try {
        await fn();
      } catch (e) {
        if ((e as Error).message?.startsWith('process.exit')) {
          // expected
        } else {
          throw e;
        }
      } finally {
        process.exit = originalExit;
        console.log = originalLog;
        console.error = originalError;
      }

      return { exitCode, output, errorOutput };
    },
  };
}

test('main: rollback --list dispatches correctly', async () => {
  const { run } = captureCLI(async () => {
    await main(['rollback', 'alice', '--list']);
  });

  const result = await run();
  assert.match(result.output.join('\n'), /No backups found/);
});

test('main: rollback --to <stamp> requires backup to exist', async () => {
  const { run } = captureCLI(async () => {
    await main(['rollback', 'alice', '--to', '2026-01-01T00:00:00Z']);
  });

  const result = await run();
  assert.equal(result.exitCode, 1);
  assert.match(result.errorOutput.join('\n'), /No backup found/);
});

test('main: rollback requires user argument', async () => {
  const { run } = captureCLI(async () => {
    await main(['rollback']);
  });

  const result = await run();
  assert.equal(result.exitCode, 1);
  assert.match(result.errorOutput.join('\n'), /usage: sharekit rollback <user>/);
});

test('main: rollback --to without stamp argument exits with error', async () => {
  const { run } = captureCLI(async () => {
    await main(['rollback', 'alice', '--to']);
  });

  const result = await run();
  assert.equal(result.exitCode, 1);
  assert.match(result.errorOutput.join('\n'), /--to requires a stamp argument/);
});

test('main: scan --force flag is parsed correctly', async () => {
  const { run } = captureCLI(async () => {
    await main(['scan', '--force']);
  });

  const result = await run();
  assert(!result.errorOutput.join('\n').includes('unknown flag'));
});

test('main: update requires user argument', async () => {
  const { run } = captureCLI(async () => {
    await main(['update']);
  });

  const result = await run();
  assert.equal(result.exitCode, 1);
  assert.match(result.errorOutput.join('\n'), /usage: sharekit update <user>/);
});

test('main: unknown command shows usage', async () => {
  const { run } = captureCLI(async () => {
    await main(['unknown-cmd']);
  });

  const result = await run();
  assert.match(result.errorOutput.join('\n'), /unknown command/);
  assert.ok(result.output.some((line) => line.includes('sharekit')));
});

test('main: install requires user@ref argument', async () => {
  const { run } = captureCLI(async () => {
    await main(['install']);
  });

  const result = await run();
  assert.equal(result.exitCode, 1);
  assert.match(result.errorOutput.join('\n'), /usage: sharekit install <user>/);
});

test('main: preview requires user@ref argument', async () => {
  const { run } = captureCLI(async () => {
    await main(['preview']);
  });

  const result = await run();
  assert.equal(result.exitCode, 1);
  assert.match(result.errorOutput.join('\n'), /usage: sharekit preview <user>/);
});

test('main: no command shows usage (help)', async () => {
  const { run } = captureCLI(async () => {
    await main([]);
  });

  const result = await run();
  assert.ok(result.output.some((line) => line.includes('sharekit')));
  assert.ok(result.output.some((line) => line.includes('v0.4.0')));
});

test('main: -h flag shows usage', async () => {
  const { run } = captureCLI(async () => {
    await main(['-h']);
  });

  const result = await run();
  assert.ok(result.output.some((line) => line.includes('sharekit')));
});

test('main: --help flag shows usage', async () => {
  const { run } = captureCLI(async () => {
    await main(['--help']);
  });

  const result = await run();
  assert.ok(result.output.some((line) => line.includes('sharekit')));
});

test('main: -V flag shows version', async () => {
  const { run } = captureCLI(async () => {
    await main(['-V']);
  });

  const result = await run();
  assert.ok(result.output.some((line) => line.includes('0.4.0')));
});

test('main: --version flag shows version', async () => {
  const { run } = captureCLI(async () => {
    await main(['--version']);
  });

  const result = await run();
  assert.ok(result.output.some((line) => line.includes('0.4.0')));
});

test('main: list command dispatches', async () => {
  const { run } = captureCLI(async () => {
    await main(['list']);
  });

  const result = await run();
  assert.notEqual(result.exitCode, 1);
});

test('main: search command with query dispatches', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ items: [] }), { status: 200 })) as typeof fetch;

  try {
    const { run } = captureCLI(async () => {
      await main(['search', 'kotlin']);
    });

    const result = await run();
    assert(!result.errorOutput.join('\n').includes('unknown command'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('main: rollback --list with no backups shows message', async () => {
  const { run } = captureCLI(async () => {
    await main(['rollback', 'alice', '--list']);
  });

  const result = await run();
  assert.match(result.output.join('\n'), /No backups found/);
});

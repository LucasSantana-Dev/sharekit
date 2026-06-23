import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { scanForSecrets, type Finding, init } from '../src/sharekit.js';

test('scanForSecrets detects AWS access key', () => {
  const content = 'aws_key = AKIAEXAMPLEKEY000000';
  const findings = scanForSecrets(content);
  assert(findings.length > 0);
  assert.equal(findings[0].rule, 'AWS Access Key ID');
  assert.equal(findings[0].line, 1);
  assert(findings[0].preview.includes('AKIA'));
});

test('scanForSecrets detects private key block', () => {
  const content = `-----BEGIN RSA PRIVATE KEY-----
FAKEKEYBODY
-----END RSA PRIVATE KEY-----`;
  const findings = scanForSecrets(content);
  assert(findings.length > 0);
  assert.equal(findings[0].rule, 'Private Key Block');
  assert.equal(findings[0].line, 1);
});

test('scanForSecrets detects ENV secret with SECRET key', () => {
  const content = 'MY_SECRET=fakevalue000001';
  const findings = scanForSecrets(content);
  assert(findings.length > 0);
  assert(findings.some((f) => f.rule.includes('Env')));
});

test('scanForSecrets detects ENV secret with TOKEN key', () => {
  const content = 'API_TOKEN=' + 'a'.repeat(25);
  const findings = scanForSecrets(content);
  assert(findings.length > 0);
  assert(findings.some((f) => f.rule.includes('Env')));
});

test('scanForSecrets detects ENV secret with PASSWORD key', () => {
  const content = 'DB_PASSWORD=dummy-not-secret';
  const findings = scanForSecrets(content);
  assert(findings.length > 0);
  assert(findings.some((f) => f.rule.includes('Env')));
});

test('scanForSecrets detects ENV secret with API_KEY key', () => {
  const content = 'GITHUB_API_KEY=dummy-not-secret';
  const findings = scanForSecrets(content);
  assert(findings.length > 0);
  assert(findings.some((f) => f.rule.includes('Env')));
});

test('scanForSecrets detects bearer token', () => {
  const content = 'Bearer ' + 'a'.repeat(35);
  const findings = scanForSecrets(content);
  assert(findings.length > 0);
  assert.equal(findings[0].rule, 'Bearer Token');
});

test('scanForSecrets ignores empty env values', () => {
  const content = 'API_KEY=""';
  const findings = scanForSecrets(content);
  assert.equal(findings.length, 0);
});

test('scanForSecrets ignores placeholder env values', () => {
  const content = `API_KEY=xxx
API_TOKEN=<your-token-here>
DB_PASSWORD=changeme
SECRET=your-secret`;
  const findings = scanForSecrets(content);
  assert.equal(findings.length, 0);
});

test('scanForSecrets ignores ordinary prose without secrets', () => {
  const content = `# My API documentation
This is a secret between us, but the secret ingredient is love.
TOKEN of appreciation for your help.
PASSWORD protected area.`;
  const findings = scanForSecrets(content);
  assert.equal(findings.length, 0);
});

test('scanForSecrets includes line numbers', () => {
  const content = `line 1
AKIAEXAMPLEKEY000000 on line 2
line 3`;
  const findings = scanForSecrets(content);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].line, 2);
});

test('scanForSecrets truncates long previews', () => {
  const content = 'MY_SECRET=' + 'a'.repeat(200);
  const findings = scanForSecrets(content);
  assert(findings.length > 0);
  assert(findings[0].preview.length <= 50);
  assert(findings[0].preview.includes('…'));
});

test('scanForSecrets with file label includes it in finding', () => {
  const content = 'AKIAEXAMPLEKEY000000';
  const findings = scanForSecrets(content, '~/.claude/CLAUDE.md');
  assert(findings.length > 0);
  assert.equal(findings[0].file, '~/.claude/CLAUDE.md');
});

test('scanForSecrets detects multiple findings in one content', () => {
  const content = `AKIAEXAMPLEKEY000000
-----BEGIN PRIVATE KEY-----
test secret
-----END PRIVATE KEY-----
API_TOKEN=faketoken000001`;
  const findings = scanForSecrets(content);
  assert(findings.length >= 2);
});

test('scanForSecrets ignores ordinary KEY=value assignments', () => {
  const content = `NODE_ENV=production
DEBUG=false
SOME_PATH=/usr/local/bin`;
  const findings = scanForSecrets(content);
  assert.equal(findings.length, 0);
});

test('scanForSecrets detects APIKEY (single word)', () => {
  const content = 'GITHUB_APIKEY=fakevalue000001';
  const findings = scanForSecrets(content);
  assert(findings.some((f) => f.rule.includes('Env')));
});

test('scanForSecrets detects ACCESS_KEY', () => {
  const content = 'AWS_ACCESS_KEY=fakevalue000001';
  const findings = scanForSecrets(content);
  assert(findings.some((f) => f.rule.includes('Env')));
});

test('init surfaces secret warnings when scaffolding files with planted secrets', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-scan-'));
  const sourceRoot = path.join(tmp, 'source');
  const profileDir = path.join(tmp, 'sharekit-profile');

  // Set up a fake source ~/.claude with CLAUDE.md containing a secret
  fs.mkdirSync(path.join(sourceRoot, '.claude'), { recursive: true });
  fs.writeFileSync(
    path.join(sourceRoot, '.claude', 'CLAUDE.md'),
    '# My instructions\nAPI_KEY=fakevalue000001'
  );

  // Capture console output
  let output = '';
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    output += args.join(' ') + '\n';
    originalLog(...args);
  };

  try {
    init(profileDir, [], sourceRoot);

    // Verify init completed normally (exit 0 equivalent, no throw)
    assert(fs.existsSync(path.join(profileDir, 'sharekit.toml')));

    // Verify warnings were printed
    assert(output.includes('Secret patterns detected'), 'Should warn about secrets');
    assert(
      output.includes('CLAUDE.md') || output.includes('API_KEY'),
      'Should mention the file or secret key'
    );
    assert(output.includes('Review and redact'), 'Should remind to review before pushing');
  } finally {
    console.log = originalLog;
    fs.rmSync(tmp, { recursive: true });
  }
});

test('init does not surface warnings when scaffolding clean files', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-scan-clean-'));
  const sourceRoot = path.join(tmp, 'source');
  const profileDir = path.join(tmp, 'sharekit-profile');

  // Set up a fake source ~/.claude with clean CLAUDE.md
  fs.mkdirSync(path.join(sourceRoot, '.claude'), { recursive: true });
  fs.writeFileSync(
    path.join(sourceRoot, '.claude', 'CLAUDE.md'),
    '# My instructions\n## Standards\nNo secrets here.'
  );

  // Capture console output
  let output = '';
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    output += args.join(' ') + '\n';
    originalLog(...args);
  };

  try {
    init(profileDir, [], sourceRoot);

    // Verify init completed
    assert(fs.existsSync(path.join(profileDir, 'sharekit.toml')));

    // Verify NO secret warnings were printed
    assert(
      !output.includes('Secret patterns detected'),
      'Should not warn about secrets in clean content'
    );
  } finally {
    console.log = originalLog;
    fs.rmSync(tmp, { recursive: true });
  }
});

// New tests for severity classification and expanded patterns
test('scanForSecrets detects GitHub PAT (ghp_ format)', () => {
  const content = 'token = ghp_' + 'a'.repeat(36);
  const findings = scanForSecrets(content);
  assert(findings.length > 0);
  assert.equal(findings[0].rule, 'GitHub Personal Access Token');
  assert.equal(findings[0].severity, 'high');
});

test('scanForSecrets detects GitHub PAT (github_pat_ format)', () => {
  const content = 'token = github_pat_' + 'a'.repeat(22);
  const findings = scanForSecrets(content);
  assert(findings.length > 0);
  assert.equal(findings[0].rule, 'GitHub Personal Access Token');
  assert.equal(findings[0].severity, 'high');
});

test('scanForSecrets detects Slack tokens', () => {
  const content = 'slack = xoxb-EXAMPLE-NOT-A-REAL-token';
  const findings = scanForSecrets(content);
  assert(findings.length > 0);
  assert.equal(findings[0].rule, 'Slack Token');
  assert.equal(findings[0].severity, 'high');
});

test('scanForSecrets detects Google API keys (AIza format)', () => {
  const content = 'google_key = AIza' + 'a'.repeat(35);
  const findings = scanForSecrets(content);
  assert(findings.length > 0);
  assert.equal(findings[0].rule, 'Google API Key');
  assert.equal(findings[0].severity, 'high');
});

test('scanForSecrets detects home directory path leak', () => {
  const content = 'backup_dir = /Users/alice/.ssh/id_rsa';
  const findings = scanForSecrets(content);
  assert(findings.length > 0);
  assert.equal(findings[0].rule, 'Home Directory Path Leak');
  assert.equal(findings[0].severity, 'low');
});

test('scanForSecrets detects Linux home directory path leak', () => {
  const content = 'backup_dir = /home/bob/.ssh/id_rsa';
  const findings = scanForSecrets(content);
  assert(findings.length > 0);
  assert.equal(findings[0].rule, 'Home Directory Path Leak');
  assert.equal(findings[0].severity, 'low');
});

test('scanForSecrets detects export PREFIX for env vars (missing old gap)', () => {
  const content = 'export API_KEY=fakevalue000001';
  const findings = scanForSecrets(content);
  assert(findings.length > 0);
  assert.equal(findings[0].rule, 'Env Var: Sensitive Key');
  assert.equal(findings[0].severity, 'medium');
});

test('scanForSecrets assigns high severity to private key', () => {
  const content =
    '-----BEGIN RSA PRIVATE KEY-----\nFAKEKEYBODY\n-----END RSA PRIVATE KEY-----';
  const findings = scanForSecrets(content);
  assert(findings.length > 0);
  assert.equal(findings[0].severity, 'high');
});

test('scanForSecrets assigns high severity to AWS access key', () => {
  const content = 'aws_key = AKIAEXAMPLEKEY000000';
  const findings = scanForSecrets(content);
  assert(findings.length > 0);
  assert.equal(findings[0].severity, 'high');
});

test('scanForSecrets assigns high severity to bearer token', () => {
  const content = 'Authorization: Bearer ' + 'a'.repeat(35);
  const findings = scanForSecrets(content);
  assert(findings.length > 0);
  assert.equal(findings[0].severity, 'high');
});

test('scanForSecrets assigns medium severity to env vars', () => {
  const content = 'API_TOKEN=' + 'a'.repeat(25);
  const findings = scanForSecrets(content);
  assert(findings.length > 0);
  assert.equal(findings[0].severity, 'medium');
});

test('init with high-severity finding blocks without --force', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-block-'));
  const sourceRoot = path.join(tmp, 'source');
  const profileDir = path.join(tmp, 'sharekit-profile');

  // Set up source with a private key (high severity)
  fs.mkdirSync(path.join(sourceRoot, '.claude'), { recursive: true });
  fs.writeFileSync(
    path.join(sourceRoot, '.claude', 'CLAUDE.md'),
    '# My instructions\n-----BEGIN PRIVATE KEY-----\nTest\n-----END PRIVATE KEY-----'
  );

  // Capture console output and errors
  let output = '';
  const originalLog = console.log;
  const originalErr = console.error;
  console.log = (...args: unknown[]) => {
    output += args.join(' ') + '\n';
  };
  console.error = (...args: unknown[]) => {
    output += args.join(' ') + '\n';
  };

  let caughtError: Error | null = null;
  try {
    init(profileDir, [], sourceRoot, false);
  } catch (e) {
    caughtError = e as Error;
  } finally {
    console.log = originalLog;
    console.error = originalErr;
  }

  assert(caughtError !== null, 'Should throw when high-severity finding and no --force');
  assert(
    caughtError.message.includes('export blocked') || caughtError.message.includes('Secrets'),
    'Error message should mention blocking'
  );
  fs.rmSync(tmp, { recursive: true });
});

test('init with high-severity finding succeeds with --force', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-force-'));
  const sourceRoot = path.join(tmp, 'source');
  const profileDir = path.join(tmp, 'sharekit-profile');

  // Set up source with a private key (high severity)
  fs.mkdirSync(path.join(sourceRoot, '.claude'), { recursive: true });
  fs.writeFileSync(
    path.join(sourceRoot, '.claude', 'CLAUDE.md'),
    '# My instructions\n-----BEGIN PRIVATE KEY-----\nTest\n-----END PRIVATE KEY-----'
  );

  // Capture console output
  let output = '';
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    output += args.join(' ') + '\n';
    originalLog(...args);
  };

  let caughtError: Error | null = null;
  try {
    init(profileDir, [], sourceRoot, true); // --force = true
  } catch (e) {
    caughtError = e as Error;
  } finally {
    console.log = originalLog;
  }

  assert.equal(
    caughtError,
    null,
    'Should not throw when high-severity finding but --force is true'
  );
  assert(
    fs.existsSync(path.join(profileDir, 'sharekit.toml')),
    'Should still scaffold with --force'
  );
  assert(
    output.includes('Secret patterns detected') || output.includes('review before pushing'),
    'Should still warn even with --force'
  );
  fs.rmSync(tmp, { recursive: true });
});

test('init with medium-severity finding warns but exits 0 without --force', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-medium-'));
  const sourceRoot = path.join(tmp, 'source');
  const profileDir = path.join(tmp, 'sharekit-profile');

  // Set up source with only medium-severity env var
  fs.mkdirSync(path.join(sourceRoot, '.claude'), { recursive: true });
  fs.writeFileSync(
    path.join(sourceRoot, '.claude', 'CLAUDE.md'),
    '# My instructions\nAPI_TOKEN=faketoken000001'
  );

  // Capture console output
  let output = '';
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    output += args.join(' ') + '\n';
    originalLog(...args);
  };

  let caughtError: Error | null = null;
  try {
    init(profileDir, [], sourceRoot, false);
  } catch (e) {
    caughtError = e as Error;
  } finally {
    console.log = originalLog;
  }

  assert.equal(caughtError, null, 'Should not throw for medium-severity findings');
  assert(fs.existsSync(path.join(profileDir, 'sharekit.toml')), 'Should scaffold profile');
  assert(
    output.includes('Secret patterns detected'),
    'Should still warn about medium-severity findings'
  );
  fs.rmSync(tmp, { recursive: true });
});

// Tests for scan() command
test('scan detects high-severity secrets in existing profile and blocks without --force', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-scan-high-'));
  const profileDir = path.join(tmp, 'sharekit-profile');

  // Create a profile with a high-severity secret
  fs.mkdirSync(path.join(profileDir, 'claude'), { recursive: true });
  fs.writeFileSync(
    path.join(profileDir, 'claude', 'CLAUDE.md'),
    '# instructions\n-----BEGIN PRIVATE KEY-----\nTest\n-----END PRIVATE KEY-----'
  );
  fs.writeFileSync(path.join(profileDir, 'sharekit.toml'), '[profile]\nname = "test"\n');

  const { scan } = await import('../src/sharekit.js');

  let caughtError: Error | null = null;
  try {
    await scan(profileDir, false);
  } catch (e) {
    caughtError = e as Error;
  }

  assert(caughtError !== null, 'Should throw when high-severity finding detected and force=false');
  assert(
    caughtError.message.includes('blocked') || caughtError.message.includes('high-severity'),
    'Error should mention blocking or high-severity'
  );
  fs.rmSync(tmp, { recursive: true });
});

test('scan allows high-severity secrets in existing profile with --force', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-scan-force-'));
  const profileDir = path.join(tmp, 'sharekit-profile');

  // Create a profile with a high-severity secret
  fs.mkdirSync(path.join(profileDir, 'claude'), { recursive: true });
  fs.writeFileSync(
    path.join(profileDir, 'claude', 'CLAUDE.md'),
    '# instructions\n-----BEGIN PRIVATE KEY-----\nTest\n-----END PRIVATE KEY-----'
  );
  fs.writeFileSync(path.join(profileDir, 'sharekit.toml'), '[profile]\nname = "test"\n');

  const { scan } = await import('../src/sharekit.js');

  let caughtError: Error | null = null;
  try {
    await scan(profileDir, true); // force=true
  } catch (e) {
    caughtError = e as Error;
  }

  assert.equal(caughtError, null, 'Should not throw when high-severity finding but force=true');
  fs.rmSync(tmp, { recursive: true });
});

test('scan exits cleanly for profile with no secrets', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-scan-clean-'));
  const profileDir = path.join(tmp, 'sharekit-profile');

  // Create a clean profile
  fs.mkdirSync(path.join(profileDir, 'claude'), { recursive: true });
  fs.writeFileSync(path.join(profileDir, 'claude', 'CLAUDE.md'), '# clean instructions\n');
  fs.writeFileSync(path.join(profileDir, 'sharekit.toml'), '[profile]\nname = "test"\n');

  const { scan } = await import('../src/sharekit.js');

  let caughtError: Error | null = null;
  let output = '';
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    output += args.join(' ') + '\n';
    originalLog(...args);
  };

  try {
    await scan(profileDir, false);
  } catch (e) {
    caughtError = e as Error;
  } finally {
    console.log = originalLog;
  }

  assert.equal(caughtError, null, 'Should not throw for clean profile');
  assert(output.includes('No secrets detected'), 'Should report clean profile');
  fs.rmSync(tmp, { recursive: true });
});

test('scan throws friendly error when profile directory does not exist', async () => {
  const { scan } = await import('../src/sharekit.js');

  let caughtError: Error | null = null;
  try {
    await scan('/nonexistent/profile', false);
  } catch (e) {
    caughtError = e as Error;
  }

  assert(caughtError !== null, 'Should throw when profile directory does not exist');
  assert(
    caughtError.message.includes('No profile'),
    'Error message should mention missing profile'
  );
});

test('scan defaults to ./sharekit-profile when no dir specified', async () => {
  const tmp = process.cwd();
  const profileDir = path.join(tmp, 'sharekit-profile');

  // Create a temporary clean profile in the working directory (if needed in the test)
  // For this test, we verify the function accepts undefined and throws appropriately
  const { scan } = await import('../src/sharekit.js');

  let caughtError: Error | null = null;
  try {
    await scan(undefined, false); // Should use default ./sharekit-profile
  } catch (e) {
    caughtError = e as Error;
  }

  assert(
    caughtError !== null,
    'Should throw when ./sharekit-profile does not exist (default case)'
  );
});

test('scan warns but exits cleanly for medium-severity findings', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-scan-medium-'));
  const profileDir = path.join(tmp, 'sharekit-profile');

  // Create a profile with only medium-severity secret
  fs.mkdirSync(path.join(profileDir, 'claude'), { recursive: true });
  fs.writeFileSync(
    path.join(profileDir, 'claude', 'CLAUDE.md'),
    '# instructions\nAPI_TOKEN=faketoken000001'
  );
  fs.writeFileSync(path.join(profileDir, 'sharekit.toml'), '[profile]\nname = "test"\n');

  const { scan } = await import('../src/sharekit.js');

  let caughtError: Error | null = null;
  let output = '';
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    output += args.join(' ') + '\n';
    originalLog(...args);
  };

  try {
    await scan(profileDir, false);
  } catch (e) {
    caughtError = e as Error;
  } finally {
    console.log = originalLog;
  }

  assert.equal(caughtError, null, 'Should not throw for medium-severity findings');
  assert(output.includes('Secret patterns detected'), 'Should warn about medium-severity findings');
  fs.rmSync(tmp, { recursive: true });
});

test('scan gracefully skips unreadable files and continues scanning others', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-scan-unreadable-'));
  const profileDir = path.join(tmp, 'sharekit-profile');

  // Create a profile with a readable file containing a secret and an unreadable file
  fs.mkdirSync(path.join(profileDir, 'claude'), { recursive: true });
  const readablePath = path.join(profileDir, 'claude', 'CLAUDE.md');
  const unreadablePath = path.join(profileDir, 'claude', 'secrets.txt');

  fs.writeFileSync(
    readablePath,
    '# instructions\n-----BEGIN PRIVATE KEY-----\nTest\n-----END PRIVATE KEY-----'
  );
  fs.writeFileSync(unreadablePath, 'content');

  // Make the unreadable file inaccessible
  fs.chmodSync(unreadablePath, 0o000);

  fs.writeFileSync(path.join(profileDir, 'sharekit.toml'), '[profile]\nname = "test"\n');

  const { scan } = await import('../src/sharekit.js');

  let caughtError: Error | null = null;
  let output = '';
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    output += args.join(' ') + '\n';
    originalLog(...args);
  };

  try {
    await scan(profileDir, false);
  } catch (e) {
    caughtError = e as Error;
  } finally {
    console.log = originalLog;
    // Restore permissions for cleanup
    try {
      fs.chmodSync(unreadablePath, 0o644);
    } catch {
      // ignore
    }
  }

  // Should throw because of high-severity finding in readable file
  assert(caughtError !== null, 'Should throw due to high-severity finding');

  // Should have skipped the unreadable file
  assert(
    output.includes('Skipped') && output.includes('secrets.txt'),
    'Should warn about skipped unreadable file'
  );

  // Should still detect the secret in the readable file
  assert(
    output.includes('Secret patterns detected') && output.includes('PRIVATE KEY'),
    'Should still scan readable files and report findings'
  );

  fs.rmSync(tmp, { recursive: true });
});

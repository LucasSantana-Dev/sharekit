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
  const content = 'GITHUB_APIKEY=fakevalue000099';
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

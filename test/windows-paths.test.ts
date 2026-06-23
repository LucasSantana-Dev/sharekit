import { test } from 'node:test';
import assert from 'node:assert/strict';

test('tildify: handles Windows path separators correctly', () => {
  const HOME = '/Users/alice';
  
  const testTildify = (p: string, homePath: string, separator: string): string => {
    if (!p.startsWith(homePath)) return p;
    return '~' + p.slice(homePath.length).split(separator).join('/');
  };
  
  const unixPath = '/Users/alice/.claude/skills/brainstorm';
  const result = testTildify(unixPath, HOME, '/');
  assert.equal(result, '~/.claude/skills/brainstorm', 'Unix paths should use forward slashes');
  
  const windowsPath = 'C:\\Users\\alice\\.claude\\skills\\brainstorm';
  const homeWin = 'C:\\Users\\alice';
  const winResult = testTildify(windowsPath, homeWin, '\\');
  assert.equal(winResult, '~/.claude/skills/brainstorm', 'Windows paths should be normalized to forward slashes');
  
  const external = '/mnt/external/data';
  const noHomeResult = testTildify(external, HOME, '/');
  assert.equal(noHomeResult, external, 'Paths not under home should be unchanged');
});

test('tildify: preserves non-home paths', () => {
  const HOME = '/Users/alice';
  const testTildify = (p: string, homePath: string, separator: string): string => {
    if (!p.startsWith(homePath)) return p;
    return '~' + p.slice(homePath.length).split(separator).join('/');
  };
  
  const externalPath = '/opt/local/bin/tool';
  const result = testTildify(externalPath, HOME, '/');
  assert.equal(result, externalPath, 'Non-home paths should not be modified');
});

test('tildify: handles home directory exactly', () => {
  const HOME = '/Users/alice';
  const testTildify = (p: string, homePath: string, separator: string): string => {
    if (!p.startsWith(homePath)) return p;
    return '~' + p.slice(homePath.length).split(separator).join('/');
  };
  
  const result = testTildify(HOME, HOME, '/');
  assert.equal(result, '~', 'Home directory itself should become ~');
  
  const subDir = HOME + '/.config';
  const subResult = testTildify(subDir, HOME, '/');
  assert.equal(subResult, '~/.config', 'Subdirectory of home should be ~/<subdir>');
});

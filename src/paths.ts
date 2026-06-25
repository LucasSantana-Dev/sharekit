import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

export const HOME = os.homedir();
export const STATE = path.join(HOME, '.sharekit');

// Defence-in-depth: size cap for sharekit.toml to prevent DoS on pathological input.
// Typical manifests are a few KB; 512 KB is a generous cap that catches obvious abuses.
export const MAX_MANIFEST_BYTES = 512 * 1024; // 512 KB

// profile/<tool>/** mirrors into these roots — one rule, not a filename allowlist
export const ROOTS: Record<string, string> = {
  claude: path.join(HOME, '.claude'),
  cursor: path.join(HOME, '.cursor'),
  shared: HOME,
};

// injectable so backup/restore can target a temp dir in tests (default: real ~/.sharekit + $HOME)
export type Dirs = { home: string; state: string };
export const DEFAULT_DIRS: Dirs = { home: HOME, state: STATE };

export const tildify = (p: string, maxLen?: number) => {
  const result = p.startsWith(HOME) ? '~' + p.slice(HOME.length).split(path.sep).join('/') : p;
  if (maxLen && result.length > maxLen && p.startsWith(HOME)) {
    const half = Math.floor((maxLen - 3) / 2);
    const end = result.length - (maxLen - 3 - half);
    return result.slice(0, half) + '...' + result.slice(end);
  }
  return result;
};

// copy a file, preserving its mode (e.g. a skill's executable toggle.sh)
export function cp(src: string, dest: string): void {
  fs.copyFileSync(src, dest);
  fs.chmodSync(dest, fs.statSync(src).mode);
}

// Track skipped symlinks during walk
export interface WalkResult {
  files: string[];
  skippedSymlinks: string[];
}

export function walkWithSymlinks(dir: string): WalkResult {
  const files: string[] = [];
  const skippedSymlinks: string[] = [];
  const visited = new Set<string>();

  const traverse = (currentDir: string) => {
    const realDir = fs.realpathSync(currentDir);
    if (visited.has(realDir)) {
      console.warn(`  Warning: symlink loop detected at ${currentDir} — skipping`);
      return;
    }
    visited.add(realDir);

    for (const e of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const p = path.join(currentDir, e.name);
      if (e.isSymbolicLink()) {
        skippedSymlinks.push(p);
      } else if (e.isDirectory()) {
        traverse(p);
      } else {
        files.push(p);
      }
    }
  };

  traverse(dir);
  return { files, skippedSymlinks };
}

export function walk(dir: string): string[] {
  return walkWithSymlinks(dir).files;
}

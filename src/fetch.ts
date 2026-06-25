import * as fs from 'node:fs';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parse as parseToml } from 'smol-toml';
import { STATE, MAX_MANIFEST_BYTES } from './paths.js';

export function parseUserRef(user: string): { user: string; ref?: string } {
  if (!user || user.trim() === '') {
    throw new Error('Invalid user reference: username cannot be empty');
  }

  if (!user.includes('@')) {
    // No @: simple username, validate it
    if (user.includes('..')) {
      throw new Error(`Invalid user '${user}': username cannot contain '..'`);
    }
    if (user.includes('/')) {
      throw new Error(`Invalid user '${user}': username cannot contain path separators`);
    }
    return { user, ref: undefined };
  }

  // Contains @: split and validate both parts
  const atIndex = user.lastIndexOf('@');
  const userName = user.slice(0, atIndex);
  const ref = user.slice(atIndex + 1);

  // Validate userName
  if (!userName || userName.trim() === '') {
    throw new Error(`Invalid user reference '${user}': missing GitHub username before '@'`);
  }
  if (userName.includes('..')) {
    throw new Error(`Invalid user '${userName}': username cannot contain '..'`);
  }
  if (userName.includes('/')) {
    throw new Error(`Invalid user '${userName}': username cannot contain path separators`);
  }

  // Validate ref
  if (!ref || ref.trim() === '') {
    throw new Error(`Invalid user reference '${user}': ref cannot be empty after '@'`);
  }
  if (ref.includes('..')) {
    throw new Error(`Invalid ref '${ref}': ref cannot contain '..'`);
  }

  return { user: userName, ref };
}

// ponytail: profile lives at github.com/<user>/sharekit-profile — one convention, not a search
export function fetchProfile(
  user: string,
  ref?: string,
  baseUrl = 'https://github.com',
  cacheRoot = path.join(STATE, 'profiles')
): string {
  // Cache key: <user> for HEAD, <user>@<ref> for a pinned ref
  const cacheKey = ref ? `${user}@${ref}` : user;
  const dir = path.join(cacheRoot, cacheKey);

  // Defense-in-depth: verify cache path doesn't escape cacheRoot
  const resolvedCache = path.resolve(cacheRoot);
  const resolvedDir = path.resolve(dir);
  if (!resolvedDir.startsWith(resolvedCache + path.sep)) {
    throw new Error(`Invalid profile path: cache escape detected for '${cacheKey}'`);
  }

  if (fs.existsSync(dir)) {
    // Attempt a best-effort pull to refresh the cached checkout.
    // For mutable refs (branches), this pulls the latest. For immutable refs (tags/SHAs),
    // the pull harmlessly fails and we fall back to the cached copy.
    try {
      execFileSync('git', ['-C', dir, 'pull', '--ff-only'], { stdio: 'pipe', timeout: 30_000 });
    } catch {
      // ponytail: refresh is best-effort — offline / no-remote / detached HEAD falls back to the cached copy
    }
    return dir;
  }

  fs.mkdirSync(path.dirname(dir), { recursive: true });
  const url = `${baseUrl}/${user}/sharekit-profile`;

  try {
    if (ref) {
      execFileSync('git', ['clone', '--depth', '1', '--branch', ref, '--', url, dir], {
        stdio: 'pipe',
        timeout: 30_000,
      });
    } else {
      execFileSync('git', ['clone', '--depth', '1', '--', url, dir], {
        stdio: 'pipe',
        timeout: 30_000,
      });
    }
  } catch (e) {
    if ((e as { code?: string }).code === 'ENOENT') {
      throw new Error('git not found — install git to use sharekit (https://git-scm.com)');
    }
    if ((e as { killed?: boolean }).killed) {
      throw new Error(`Timed out fetching ${user}'s profile (network too slow or repo too large)`);
    }
    const errOut =
      ((e as { stderr?: Buffer }).stderr?.toString() ?? '') + ((e as Error).message ?? '');
    if (ref && errOut.includes('not found')) {
      throw new Error(`ref '${ref}' not found in ${user}'s profile`);
    }
    throw new Error(
      `No profile at ${url}\n` +
        `  Publish yours: a repo named "sharekit-profile" with a sharekit.toml`
    );
  }
  return dir;
}

export function readManifest(profileDir: string): {
  name: string;
  version?: string;
  description?: string;
} {
  const p = path.join(profileDir, 'sharekit.toml');
  if (!fs.existsSync(p))
    throw new Error(`Not a sharekit profile (no sharekit.toml in ${profileDir})`);

  // Defence-in-depth: reject oversized manifests before parsing to prevent DoS
  const stat = fs.statSync(p);
  if (stat.size > MAX_MANIFEST_BYTES) {
    throw new Error(
      `Invalid sharekit.toml: manifest too large (${(stat.size / 1024).toFixed(1)} KB, max ${(MAX_MANIFEST_BYTES / 1024).toFixed(0)} KB)`
    );
  }
  let parsed: Record<string, unknown>;
  try {
    parsed = parseToml(fs.readFileSync(p, 'utf8')) as Record<string, unknown>;
  } catch (e) {
    throw new Error(`Invalid sharekit.toml: ${(e as Error).message}`);
  }
  const profile = (parsed.profile ?? {}) as Record<string, string>;
  return {
    name: profile.name ?? 'unknown',
    version: profile.version,
    description: profile.description,
  };
}

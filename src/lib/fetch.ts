import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { execSync } from "node:child_process";

const CACHE_DIR = path.join(os.homedir(), ".sharekit", "profiles");

const PROFILE_REPO_CANDIDATES = [
  (u: string) => `https://github.com/${u}/sharekit-profile`,
  (u: string) => `https://github.com/${u}/${u}-profile`,
  (u: string) => `https://github.com/${u}/dotai-profile`,
];

export function profileCacheDir(username: string): string {
  return path.join(CACHE_DIR, username);
}

export async function fetchProfile(username: string): Promise<string> {
  const dest = profileCacheDir(username);

  if (fs.existsSync(dest)) {
    execSync(`git -C "${dest}" pull --ff-only`, { stdio: "pipe" });
    return dest;
  }

  fs.mkdirSync(CACHE_DIR, { recursive: true });

  for (const candidate of PROFILE_REPO_CANDIDATES) {
    const url = candidate(username);
    try {
      execSync(`git clone --depth 1 "${url}" "${dest}"`, { stdio: "pipe" });
      return dest;
    } catch {
      // try next candidate
    }
  }

  throw new Error(
    `No sharekit profile found for "${username}".\n` +
    `Tried:\n` +
    PROFILE_REPO_CANDIDATES.map((c) => `  ${c(username)}`).join("\n") +
    `\n\nTo publish yours: create a repo named sharekit-profile with a sharekit.toml`
  );
}

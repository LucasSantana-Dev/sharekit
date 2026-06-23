import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { plan, init, readManifest } from "../src/sharekit.ts";

// #1 — walk() skips symlinks (no follow into arbitrary files, no EISDIR on dir-links)
test("plan skips symlinks in a profile", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sk-sym-"));
  const profile = path.join(tmp, "profile");
  fs.mkdirSync(path.join(profile, "claude"), { recursive: true });
  fs.writeFileSync(path.join(profile, "claude", "CLAUDE.md"), "real");
  fs.symlinkSync("./", path.join(profile, "claude", "cycle")); // dir-link (would EISDIR if copied)
  fs.symlinkSync("/etc/hostname", path.join(profile, "claude", "leak")); // file-link outside

  const roots = { claude: path.join(tmp, ".claude"), cursor: path.join(tmp, ".cursor"), shared: tmp };
  const rels = plan(profile, roots).map((f) => f.rel);
  assert.deepEqual(rels, ["CLAUDE.md"]); // only the real file; both symlinks dropped
});

// #2 — cp preserves the executable bit (via init copying a +x skill file)
test("init preserves the executable bit on copied files", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sk-mode-"));
  const sourceRoot = path.join(tmp, "home");
  const skill = path.join(sourceRoot, ".claude", "skills", "demo");
  fs.mkdirSync(skill, { recursive: true });
  fs.writeFileSync(path.join(sourceRoot, ".claude", "CLAUDE.md"), "x");
  const sh = path.join(skill, "toggle.sh");
  fs.writeFileSync(sh, "#!/bin/sh\necho hi\n");
  fs.chmodSync(sh, 0o755);

  const profileDir = path.join(tmp, "out-profile");
  init(profileDir, ["demo"], sourceRoot);

  const destSh = path.join(profileDir, "claude", "skills", "demo", "toggle.sh");
  assert.ok(fs.existsSync(destSh));
  assert.ok(fs.statSync(destSh).mode & 0o111, "executable bit should survive the copy");
});

// #3 — readManifest gives a friendly error on malformed TOML
test("readManifest throws a clear error on malformed sharekit.toml", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sk-toml-"));
  fs.writeFileSync(path.join(tmp, "sharekit.toml"), "this is = = not valid toml ][");
  assert.throws(() => readManifest(tmp), /Invalid sharekit\.toml/);
});

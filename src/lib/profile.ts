import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import TOML from "@iarna/toml";

export interface ProfileManifest {
  profile: {
    name: string;
    version: string;
    description?: string;
  };
  tools?: {
    claude?: { enabled?: boolean };
    cursor?: { enabled?: boolean };
    shared?: { enabled?: boolean };
  };
  forgekit?: {
    skills?: string[];
  };
}

export interface ResolvedFile {
  src: string;
  dest: string;
  tool: string;
  type: "file" | "dir";
}

const TOOL_DESTINATIONS: Record<string, Record<string, string>> = {
  claude: {
    "CLAUDE.md": path.join(os.homedir(), ".claude", "CLAUDE.md"),
    "settings.json": path.join(os.homedir(), ".claude", "settings.json"),
    skills: path.join(os.homedir(), ".claude", "skills"),
    agents: path.join(os.homedir(), ".claude", "agents"),
    standards: path.join(os.homedir(), ".claude", "standards"),
  },
  cursor: {
    ".cursorrules": path.join(os.homedir(), ".cursor", ".cursorrules"),
    "mcp.json": path.join(os.homedir(), ".cursor", "mcp.json"),
  },
  shared: {},
};

export function parseManifest(profileDir: string): ProfileManifest {
  const manifestPath = path.join(profileDir, "sharekit.toml");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`No sharekit.toml found in ${profileDir}`);
  }
  const raw = fs.readFileSync(manifestPath, "utf8");
  return TOML.parse(raw) as unknown as ProfileManifest;
}

export function resolveFiles(profileDir: string, manifest: ProfileManifest): ResolvedFile[] {
  const files: ResolvedFile[] = [];
  const toolsDir = profileDir;

  for (const tool of ["claude", "cursor", "shared"] as const) {
    const toolPath = path.join(toolsDir, tool);
    if (!fs.existsSync(toolPath)) continue;

    const enabled = manifest.tools?.[tool]?.enabled ?? true;
    if (!enabled) continue;

    const destMap = TOOL_DESTINATIONS[tool] ?? {};
    const entries = fs.readdirSync(toolPath);

    for (const entry of entries) {
      const srcPath = path.join(toolPath, entry);
      const stat = fs.statSync(srcPath);

      if (tool === "shared") {
        // shared/ files go relative to home dir
        files.push({
          src: srcPath,
          dest: path.join(os.homedir(), entry),
          tool,
          type: stat.isDirectory() ? "dir" : "file",
        });
        continue;
      }

      const dest = destMap[entry];
      if (!dest) continue;

      files.push({
        src: srcPath,
        dest,
        tool,
        type: stat.isDirectory() ? "dir" : "file",
      });
    }
  }

  return files;
}

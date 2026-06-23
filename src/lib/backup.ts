import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { execSync } from "node:child_process";
import type { ResolvedFile } from "./profile.js";

const BACKUP_DIR = path.join(os.homedir(), ".sharekit", "backups");

export function backupPath(username: string): string {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(BACKUP_DIR, `${username}-${ts}`);
}

export function lastBackupFor(username: string): string | null {
  if (!fs.existsSync(BACKUP_DIR)) return null;
  const entries = fs.readdirSync(BACKUP_DIR)
    .filter((e) => e.startsWith(`${username}-`))
    .sort()
    .reverse();
  return entries[0] ? path.join(BACKUP_DIR, entries[0]) : null;
}

export function createBackup(files: ResolvedFile[], username: string): string {
  const dest = backupPath(username);
  fs.mkdirSync(dest, { recursive: true });

  for (const f of files) {
    if (!fs.existsSync(f.dest)) continue;
    const rel = path.relative(os.homedir(), f.dest);
    const backupTarget = path.join(dest, rel);
    fs.mkdirSync(path.dirname(backupTarget), { recursive: true });
    if (f.type === "dir") {
      execSync(`cp -r "${f.dest}" "${backupTarget}"`);
    } else {
      fs.copyFileSync(f.dest, backupTarget);
    }
  }

  return dest;
}

export function restoreBackup(backupDir: string): void {
  if (!fs.existsSync(backupDir)) {
    throw new Error(`Backup not found: ${backupDir}`);
  }
  execSync(`cp -r "${backupDir}/." "${os.homedir()}/"`, { stdio: "pipe" });
}

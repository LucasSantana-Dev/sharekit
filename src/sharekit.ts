// Barrel file: re-exports the entire public API for backward compatibility

// From paths.ts
export {
  HOME,
  STATE,
  MAX_MANIFEST_BYTES,
  ROOTS,
  DEFAULT_DIRS,
  tildify,
  cp,
  walk,
  walkWithSymlinks,
} from './paths.js';
export type { Dirs, WalkResult } from './paths.js';

// From scanner.ts
export { scanForSecrets, truncatePreview, printAndGateFindings } from './scanner.js';
export type { Finding } from './scanner.js';

// From fetch.ts
export { parseUserRef, fetchProfile, readManifest } from './fetch.js';

// From plan.ts
export { plan, printPlan, isExecutable, applyProfile } from './plan.js';
export type { Status, PlanFile } from './plan.js';

// From backup.ts
export {
  listBackups,
  pruneBackups,
  restoreBackup,
  restoreBackupInternal,
  restoreBackupToStamp,
  readMetadata,
  writeMetadata,
} from './backup.js';
export type { BackupInfo, RestoreMetadata } from './backup.js';

// From state.ts
export { recordInstall, readInstalled, list, isImmutableRef } from './state.js';
export type { InstallRecord } from './state.js';

// From commands.ts
export {
  confirm,
  search,
  updateApply,
  update,
  install,
  preview,
  inspect,
  rollback,
  uninstall,
  scan,
  init,
} from './commands.js';
export type { InstallOpts } from './commands.js';

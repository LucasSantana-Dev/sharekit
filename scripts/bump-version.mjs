#!/usr/bin/env node
/**
 * Atomically bump version in package.json, src/index.ts, and sharekit-pip/pyproject.toml.
 *
 * Usage: npm run bump -- X.Y.Z
 *
 * This script ensures version consistency across all distribution channels:
 * - package.json: npm registry
 * - src/index.ts: VERSION const (embedded in compiled binaries)
 * - sharekit-pip/pyproject.toml: PyPI package
 *
 * Validates semver format before making any changes. All three files are updated
 * atomically in memory first, then written together to prevent partial updates.
 *
 * Why not read package.json at runtime? Bun-compiled binaries cannot reliably
 * access the package.json at runtime. A checked const + bump script + CI validation
 * is the robust approach for multi-distribution CLI tools.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const version = process.argv[2];

// Validate semver format
const semverRegex = /^\d+\.\d+\.\d+$/;
if (!version || !semverRegex.test(version)) {
  console.error(`Error: Invalid semver format. Expected X.Y.Z, got: ${version || 'empty'}`);
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(__filename), '..');
const packageJsonPath = path.join(projectRoot, 'package.json');
const indexTsPath = path.join(projectRoot, 'src', 'index.ts');
const pyprojectPath = path.join(projectRoot, 'sharekit-pip', 'pyproject.toml');

// Helper to validate file exists
function validatePath(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }
}

validatePath(packageJsonPath);
validatePath(indexTsPath);
validatePath(pyprojectPath);

// Read all files
const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
const indexTsContent = fs.readFileSync(indexTsPath, 'utf-8');
const pyprojectContent = fs.readFileSync(pyprojectPath, 'utf-8');

// Update package.json
let updatedPackageJson;
try {
  const pkg = JSON.parse(packageJsonContent);
  pkg.version = version;
  updatedPackageJson = JSON.stringify(pkg, null, 2) + '\n';
} catch (e) {
  console.error(`Error parsing package.json: ${e.message}`);
  process.exit(1);
}

// Update src/index.ts
const updatedIndexTs = indexTsContent.replace(
  /const VERSION = '[^']+'/,
  `const VERSION = '${version}'`
);

if (updatedIndexTs === indexTsContent) {
  console.error('Error: Could not find VERSION const in src/index.ts');
  process.exit(1);
}

// Update sharekit-pip/pyproject.toml
const updatedPyproject = pyprojectContent.replace(/version = "[^"]+"/, `version = "${version}"`);

if (updatedPyproject === pyprojectContent) {
  console.error('Error: Could not find version in sharekit-pip/pyproject.toml');
  process.exit(1);
}

// Write all changes atomically (one per file, synchronously)
try {
  fs.writeFileSync(packageJsonPath, updatedPackageJson, 'utf-8');
  fs.writeFileSync(indexTsPath, updatedIndexTs, 'utf-8');
  fs.writeFileSync(pyprojectPath, updatedPyproject, 'utf-8');
  console.log(`✓ Bumped version to ${version}`);
  console.log(`  - package.json`);
  console.log(`  - src/index.ts`);
  console.log(`  - sharekit-pip/pyproject.toml`);
} catch (e) {
  console.error(`Error writing files: ${e.message}`);
  process.exit(1);
}

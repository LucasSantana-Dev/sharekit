#!/usr/bin/env node
// scan-extractable.js — find self-contained, low-coupling TS/JS modules that are
// candidates to extract into a standalone npm package.
// Usage: node scan-extractable.js <dir> [<dir> ...]
// Read-only. No dependencies (Node stdlib only).
//
// For each source file it reports: LOC, internal-import count (domain coupling),
// external runtime deps, export count, and a portability verdict. Sorted most-
// portable first. The scanner measures coupling; a human judges reusability.

const fs = require('fs')
const path = require('path')

const dirs = process.argv.slice(2)
if (dirs.length === 0) {
    console.error('usage: node scan-extractable.js <dir> [<dir> ...]')
    process.exit(2)
}

const NODE_BUILTINS = new Set([
    'assert', 'buffer', 'child_process', 'cluster', 'console', 'crypto', 'dgram',
    'dns', 'events', 'fs', 'http', 'http2', 'https', 'net', 'os', 'path',
    'perf_hooks', 'process', 'querystring', 'readline', 'stream', 'string_decoder',
    'timers', 'tls', 'tty', 'url', 'util', 'v8', 'vm', 'worker_threads', 'zlib',
])

const SKIP_DIR = /(^|\/)(node_modules|dist|build|coverage|\.next|\.turbo|generated|__mocks__)(\/|$)/
const SKIP_FILE = /\.(spec|test)\.(ts|tsx|js|jsx|mjs|cjs)$|\.d\.ts$/
const SRC_FILE = /\.(ts|tsx|js|jsx|mjs|cjs)$/

function walk(dir, out) {
    let entries
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
        return
    }
    for (const e of entries) {
        const full = path.join(dir, e.name)
        if (SKIP_DIR.test(full)) continue
        if (e.isDirectory()) walk(full, out)
        else if (SRC_FILE.test(e.name) && !SKIP_FILE.test(e.name)) out.push(full)
    }
}

// crude but effective import-source + export extraction
function analyze(file) {
    const text = fs.readFileSync(file, 'utf8')
    const loc = text.split('\n').filter((l) => l.trim()).length
    const sources = new Set()
    const importRe =
        /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)|import\(\s*['"]([^'"]+)['"]\s*\)/g
    let m
    while ((m = importRe.exec(text))) sources.add(m[1] || m[2] || m[3])

    let internal = 0
    const external = new Set()
    for (const s of sources) {
        if (s.startsWith('.')) {
            internal++ // relative import → in-repo coupling
        } else if (s.startsWith('@/') || s.startsWith('@lucky/') || s.startsWith('@app/') || s.startsWith('~/')) {
            internal++ // workspace/alias import → in-repo coupling
        } else {
            const pkg = s.startsWith('@')
                ? s.split('/').slice(0, 2).join('/')
                : s.split('/')[0]
            const bare = pkg.replace(/^node:/, '')
            if (s.startsWith('node:') || NODE_BUILTINS.has(bare)) continue // stdlib is free
            external.add(pkg)
        }
    }

    const exports =
        (text.match(/export\s+(?:default\s+|async\s+)?(?:function|const|class|interface|type|enum|let|var)\s/g) || []).length +
        (text.match(/export\s*\{/g) || []).length

    let verdict
    if (exports === 0) verdict = '—' // not a module surface
    else if (internal === 0) verdict = external.size === 0 ? 'PORTABLE(zero-dep)' : 'PORTABLE'
    else if (internal <= 2) verdict = 'near-portable'
    else verdict = 'coupled'

    return { file, loc, internal, external: [...external], exports, verdict }
}

const files = []
for (const d of dirs) walk(d, files)

const rows = files.map(analyze).filter((r) => r.exports > 0)
const rank = { 'PORTABLE(zero-dep)': 0, PORTABLE: 1, 'near-portable': 2, coupled: 3, '—': 4 }
rows.sort((a, b) => rank[a.verdict] - rank[b.verdict] || a.internal - b.internal || b.loc - a.loc)

const portable = rows.filter((r) => r.verdict.startsWith('PORTABLE')).length
console.log(`scanned ${files.length} module files · ${portable} portable (0 internal imports)\n`)
console.log(
    ['VERDICT', 'INT', 'LOC', 'EXT-DEPS', 'FILE']
        .map((h, i) => h.padEnd([18, 4, 5, 22, 0][i]))
        .join(' '),
)
for (const r of rows) {
    if (r.verdict === '—') continue
    const ext = r.external.length ? r.external.join(',') : '-'
    console.log(
        [
            r.verdict.padEnd(18),
            String(r.internal).padEnd(4),
            String(r.loc).padEnd(5),
            (ext.length > 21 ? ext.slice(0, 20) + '…' : ext).padEnd(22),
            r.file,
        ].join(' '),
    )
}

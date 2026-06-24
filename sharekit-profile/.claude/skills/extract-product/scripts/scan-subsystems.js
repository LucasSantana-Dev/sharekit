#!/usr/bin/env node
// scan-subsystems.js — map directory-level coupling to find subsystems that could
// stand alone as their own project or product.
// Usage: node scan-subsystems.js <root> [<root> ...]
//   <root> = a directory whose CHILD DIRECTORIES are the subsystems (e.g. src/, apps/).
// Read-only. No dependencies (Node stdlib only).
//
// For each subsystem it reports: files, LOC, fan-out (which sibling subsystems it
// imports), fan-in (which siblings import it), external deps, and product signals
// (own README / Dockerfile / package.json / CLI entry). The scanner measures
// coupling; a human judges product-ness.

const fs = require('fs')
const path = require('path')

const roots = process.argv.slice(2)
if (roots.length === 0) {
    console.error('usage: node scan-subsystems.js <root> [<root> ...]')
    process.exit(2)
}

const NODE_BUILTINS = new Set([
    'assert', 'buffer', 'child_process', 'cluster', 'console', 'crypto', 'dgram',
    'dns', 'events', 'fs', 'http', 'http2', 'https', 'net', 'os', 'path',
    'perf_hooks', 'process', 'querystring', 'readline', 'stream', 'string_decoder',
    'timers', 'tls', 'tty', 'url', 'util', 'v8', 'vm', 'worker_threads', 'zlib',
])

const SKIP_DIR = /(^|\/)(node_modules|dist|build|coverage|\.next|\.turbo|\.git|generated|__mocks__)(\/|$)/
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

function importSources(file) {
    const text = fs.readFileSync(file, 'utf8')
    const loc = text.split('\n').filter((l) => l.trim()).length
    const sources = new Set()
    const importRe =
        /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)|import\(\s*['"]([^'"]+)['"]\s*\)/g
    let m
    while ((m = importRe.exec(text))) sources.add(m[1] || m[2] || m[3])
    return { loc, sources }
}

// which top-level subsystem of `root` does an absolute path fall under?
function subsystemOf(root, absPath) {
    const rel = path.relative(root, absPath)
    if (rel.startsWith('..')) return null // outside this root
    const top = rel.split(path.sep)[0]
    return top && top !== rel ? top : '(root files)'
}

function productSignals(dir) {
    const signals = []
    let entries
    try {
        entries = fs.readdirSync(dir)
    } catch {
        return signals
    }
    if (entries.some((e) => /^readme/i.test(e))) signals.push('README')
    if (entries.some((e) => /^dockerfile/i.test(e))) signals.push('Dockerfile')
    if (entries.includes('package.json')) signals.push('package.json')
    if (entries.some((e) => /^(cli|bin|main)\.(ts|js|mjs|cjs)$/.test(e)) || entries.includes('bin'))
        signals.push('CLI')
    return signals
}

for (const rootArg of roots) {
    const root = path.resolve(rootArg)
    const files = []
    walk(root, files)

    const subs = new Map() // name -> { files, loc, ext:Set, out:Set, in:Set, signals }
    const get = (name) => {
        if (!subs.has(name))
            subs.set(name, { files: 0, loc: 0, ext: new Set(), out: new Set(), in: new Set(), signals: [] })
        return subs.get(name)
    }

    for (const file of files) {
        const own = subsystemOf(root, file)
        const s = get(own)
        const { loc, sources } = importSources(file)
        s.files++
        s.loc += loc
        for (const spec of sources) {
            let targetAbs = null
            if (spec.startsWith('.')) {
                targetAbs = path.resolve(path.dirname(file), spec)
            } else if (spec.startsWith('@/') || spec.startsWith('~/')) {
                targetAbs = path.resolve(root, spec.slice(2)) // alias rooted at <root>
            } else {
                const pkg = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]
                const bare = pkg.replace(/^node:/, '')
                if (!spec.startsWith('node:') && !NODE_BUILTINS.has(bare)) s.ext.add(pkg)
                continue
            }
            const target = subsystemOf(root, targetAbs)
            if (target === null) s.out.add('(outside root)')
            else if (target !== own) {
                s.out.add(target)
                get(target).in.add(own)
            }
        }
    }

    for (const [name, s] of subs)
        if (name !== '(root files)') s.signals = productSignals(path.join(root, name))

    const verdictOf = (s) => (s.out.size === 0 ? 'STANDALONE' : s.out.size <= 2 ? 'near-standalone' : 'entangled')
    const rank = { STANDALONE: 0, 'near-standalone': 1, entangled: 2 }
    const rows = [...subs.entries()].sort(
        (a, b) => rank[verdictOf(a[1])] - rank[verdictOf(b[1])] || b[1].loc - a[1].loc,
    )

    const standalone = rows.filter(([, s]) => s.out.size === 0).length
    console.log(`\n# ${root}`)
    console.log(`${rows.length} subsystems · ${standalone} standalone (zero fan-out)\n`)
    console.log(
        ['VERDICT', 'FILES', 'LOC', 'OUT→', 'IN←', 'EXT', 'SIGNALS', 'SUBSYSTEM']
            .map((h, i) => h.padEnd([16, 6, 6, 24, 4, 4, 22, 0][i]))
            .join(' '),
    )
    for (const [name, s] of rows) {
        const out = s.out.size ? [...s.out].join(',') : '-'
        console.log(
            [
                verdictOf(s).padEnd(16),
                String(s.files).padEnd(6),
                String(s.loc).padEnd(6),
                (out.length > 23 ? out.slice(0, 22) + '…' : out).padEnd(24),
                String(s.in.size).padEnd(4),
                String(s.ext.size).padEnd(4),
                (s.signals.join(',') || '-').padEnd(22),
                name,
            ].join(' '),
        )
    }
}

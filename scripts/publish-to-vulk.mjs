#!/usr/bin/env node
/**
 * Publish this project to VULK as a public (forkable) project, and
 * optionally add it to the public showcase (admin only).
 *
 * Usage:
 *   VULK_COOKIE='__Secure-authjs.session-token=...' node scripts/publish-to-vulk.mjs
 *   VULK_COOKIE='...' node scripts/publish-to-vulk.mjs --showcase --category 3d
 *   VULK_BASE=http://localhost:3000 VULK_COOKIE='...' node scripts/publish-to-vulk.mjs
 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASE = process.env.VULK_BASE ?? 'https://app.vulk.dev'
const COOKIE = process.env.VULK_COOKIE

const PROJECT_NAME = 'TERRANOVA — 3D Real Estate Flythrough'
const PROJECT_DESCRIPTION =
  'Awwwards-style fully-3D one-pager: the camera flies through a procedural city ' +
  'that builds itself as you scroll. Intro loader, mouse-reveal lighting, 3D district ' +
  'map pins, photo billboards, sunrise finale. React Three Fiber + drei.'

if (!COOKIE) {
  console.error('✗ Set VULK_COOKIE to your VULK session cookie, e.g.:')
  console.error("  VULK_COOKIE='__Secure-authjs.session-token=...' node scripts/publish-to-vulk.mjs")
  process.exit(1)
}

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'scripts'])
const TEXT_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.css', '.html', '.json', '.md', '.svg', '.txt'])

async function scan(dir, base = ROOT) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.gitignore') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      out.push(...(await scan(full, base)))
    } else if (TEXT_EXT.has(path.extname(entry.name))) {
      out.push({
        path: path.relative(base, full).split(path.sep).join('/'),
        content: await readFile(full, 'utf8'),
      })
    }
  }
  return out
}

async function api(method, route, body) {
  const res = await fetch(`${BASE}${route}`, {
    method,
    headers: { 'content-type': 'application/json', cookie: COOKIE },
    body: body ? JSON.stringify(body) : undefined,
  })
  let data
  try {
    data = await res.json()
  } catch {
    data = { raw: await res.text().catch(() => '') }
  }
  return { ok: res.ok, status: res.status, data }
}

// 1) import ----------------------------------------------------------
const files = await scan(ROOT)
console.log(`→ Importing ${files.length} files to ${BASE} …`)
const imp = await api('POST', '/api/projects/import', {
  name: PROJECT_NAME,
  description: PROJECT_DESCRIPTION,
  files,
})
if (!imp.ok) {
  console.error(`✗ Import failed (${imp.status}):`, imp.data)
  process.exit(1)
}
const { uiId, projectId, platform, uiType, fileCount } = imp.data
console.log(`✓ Imported: uiId=${uiId} projectId=${projectId} platform=${platform} uiType=${uiType} files=${fileCount}`)

// 2) make public (forkable) ------------------------------------------
const vis = await api('PATCH', `/api/ui/${uiId}/visibility`, { visibility: 'public' })
if (!vis.ok) {
  console.error(`✗ Visibility failed (${vis.status}):`, vis.data)
  process.exit(1)
}
console.log('✓ Visibility: public — project is now forkable (POST /api/ui/fork)')

// 3) optional: add to showcase (admin; requires deploy first) ---------
if (process.argv.includes('--showcase')) {
  const catIdx = process.argv.indexOf('--category')
  const category = catIdx > -1 ? process.argv[catIdx + 1] : '3d'
  const show = await api('POST', '/api/admin/showcase', {
    projectId: uiId,
    action: 'add',
    category,
  })
  if (show.ok) {
    console.log(`✓ Added to showcase (category: ${category})`)
  } else {
    console.error(`✗ Showcase add failed (${show.status}):`, show.data)
    console.error('  Most likely the project is not deployed yet — deploy it in the')
    console.error('  VULK editor first, then re-run with --showcase.')
  }
}

console.log('\nNext steps:')
console.log(`  • Open ${BASE}/ui/${uiId} and 1-click deploy`)
console.log('  • Re-run with --showcase --category 3d (admin) once deployed')

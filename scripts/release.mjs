#!/usr/bin/env node
// One-command release: package the app, then sync the current version's CHANGELOG.md
// section to a GitHub Release (create or update) and upload the installer artifacts.
//
// Usage:
//   node scripts/release.mjs            # package + create/update release + upload assets
//   node scripts/release.mjs --skip-package   # skip `npm run package:win` (use existing release/)
//   node scripts/release.mjs --dry-run        # validate inputs only, touch nothing
//
// Auth: uses $env:GH_TOKEN / $env:GITHUB_TOKEN, else falls back to the credential
// stored for github.com in the git credential manager. The token is never printed.
import { readFileSync, existsSync } from 'fs'
import { spawnSync } from 'child_process'
import { resolve, join } from 'path'

const root = resolve(import.meta.dirname, '..')
const args = process.argv.slice(2)
const skipPackage = args.includes('--skip-package')
const dryRun = args.includes('--dry-run')

const log = (m) => console.log(`[release] ${m}`)
const fail = (m) => { console.error(`[release] ERROR: ${m}`); process.exit(1) }

// --- 1. version from package.json ---
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'))
const version = pkg.version
const tag = `v${version}`
log(`version=${version} tag=${tag}`)

// --- 2. extract the CHANGELOG section for this version ---
const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf-8')
const esc = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const sectionRe = new RegExp(`^##\\s*\\[${esc}\\]\\s*-[^\\n]*\\n[\\s\\S]*?(?=^##\\s|\\z)`, 'm')
const m = changelog.match(sectionRe)
if (!m) {
  fail(`CHANGELOG.md 中找不到版本 ${version} 的条目（格式：## [${version}] - yyyy-mm-dd）`)
}
const notes = m[0].trim()

// --- 3. package ---
if (dryRun) {
  log('[dry-run] 将打包并发布以下内容到 GitHub Release：')
  log(`[dry-run] --- body ---`)
  console.log(notes.split('\n').map(l => `[dry-run] ${l}`).join('\n'))
  log('[dry-run] 结束，未执行任何操作')
  process.exit(0)
}
if (!skipPackage) {
  log('packaging (npm run package:win) ...')
  const r = spawnSync('npm run package:win', {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: 'false' }
  })
  if (r.status !== 0) fail('打包失败（npm run package:win 非零退出码）')
}

// --- 4. GitHub token (env first, else git credential manager) ---
let token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN
if (!token) {
  const cred = spawnSync('git', ['credential', 'fill'], {
    input: 'protocol=https\nhost=github.com\n\n',
    encoding: 'utf-8'
  })
  const line = (cred.stdout || '').split('\n').find(l => l.startsWith('password='))
  token = line ? line.slice('password='.length) : ''
}
if (!token) fail('无法获取 GitHub token（请设置 GH_TOKEN，或为 github.com 配置 git 凭据）')

// --- 5. owner/repo from origin remote ---
const remote = spawnSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf-8' }).stdout.trim()
const rm = remote.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/)
if (!rm) fail(`无法从 origin 解析 owner/repo（remote=${remote}）`)
const [, owner, repo] = rm
const api = `https://api.github.com/repos/${owner}/${repo}`
const headers = {
  Authorization: `token ${token}`,
  'User-Agent': `${pkg.name}-release`,
  Accept: 'application/vnd.github+json'
}

async function gh(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { ...headers, ...(opts.headers || {}) } })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* non-JSON body */ }
  if (!res.ok) throw new Error(`GitHub API ${res.status} ${res.url}: ${text.slice(0, 300)}`)
  return json
}

// --- 6. create or update the release ---
let release = null
try { release = await gh(`${api}/releases/tags/${tag}`) } catch { /* not found */ }
if (release) {
  await gh(`${api}/releases/${release.id}`, { method: 'PATCH', body: JSON.stringify({ body: notes }) })
  log(`已更新 release ${tag} 的正文（来自 CHANGELOG.md）`)
} else {
  release = await gh(`${api}/releases`, {
    method: 'POST',
    body: JSON.stringify({ tag_name: tag, name: tag, draft: false, prerelease: false, body: notes })
  })
  log(`已创建 release ${tag}`)
}

// --- 7. upload assets (skip ones already present) ---
const latestYmlPath = join(root, 'release', 'latest.yml')
if (!existsSync(latestYmlPath)) fail('release/latest.yml 不存在，请先打包')
const latestYml = readFileSync(latestYmlPath, 'utf-8')
const exeName = (latestYml.match(/^path:\s*(.+)$/m) || [])[1]?.trim()
if (!exeName) fail('latest.yml 中找不到 path（安装包文件名）')

const uploadBase = `https://uploads.github.com/repos/${owner}/${repo}/releases/${release.id}/assets`
const existing = new Set((release.assets || []).map(a => a.name))

for (const [name, file] of [
  [exeName, join(root, 'release', exeName)],
  [`${exeName}.blockmap`, join(root, 'release', `${exeName}.blockmap`)],
  ['latest.yml', latestYmlPath]
]) {
  if (!existsSync(file)) { log(`跳过（文件不存在）: ${file}`); continue }
  if (existing.has(name)) { log(`跳过（已存在）: ${name}`); continue }
  const data = readFileSync(file)
  const res = await fetch(`${uploadBase}?name=${encodeURIComponent(name)}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': name === 'latest.yml' ? 'text/plain' : 'application/octet-stream' },
    body: data
  })
  if (!res.ok) throw new Error(`上传 ${name} 失败: ${res.status} ${(await res.text()).slice(0, 200)}`)
  log(`已上传 ${name} (${data.length} bytes)`)
}

log(`完成: ${release.html_url}`)

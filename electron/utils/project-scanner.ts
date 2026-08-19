import { readdir, readFile, stat } from 'fs/promises'
import { join, basename, extname } from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

export interface ProjectScanResult {
  name: string
  path: string
  readme: string | null
  fileTree: string
  gitLog: string | null
  packageJson: string | null
  stats: ProjectStats | null
}

export interface ProjectStats {
  totalFiles: number
  totalLines: number
  languages: Record<string, { files: number; lines: number }>
  gitDiffStat: string | null
  recentContributors: string | null
}

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'out', 'build', '.next', '__pycache__', '.venv', 'venv',
  '.mimocode', 'release', '.electron-cache', '.npm-cache', '.tmp'
])

const LANG_MAP: Record<string, string> = {
  '.ts': 'TypeScript', '.tsx': 'TypeScript', '.js': 'JavaScript', '.jsx': 'JavaScript',
  '.vue': 'Vue', '.py': 'Python', '.java': 'Java', '.c': 'C', '.cpp': 'C++',
  '.h': 'C/C++ Header', '.cs': 'C#', '.go': 'Go', '.rs': 'Rust', '.rb': 'Ruby',
  '.php': 'PHP', '.swift': 'Swift', '.kt': 'Kotlin', '.scala': 'Scala',
  '.html': 'HTML', '.css': 'CSS', '.scss': 'SCSS', '.less': 'LESS',
  '.json': 'JSON', '.yaml': 'YAML', '.yml': 'YAML', '.toml': 'TOML',
  '.xml': 'XML', '.sql': 'SQL', '.sh': 'Shell', '.ps1': 'PowerShell',
  '.md': 'Markdown', '.rst': 'reStructuredText', '.txt': 'Text',
  '.dockerfile': 'Docker', '.graphql': 'GraphQL', '.proto': 'Protobuf'
}

async function buildFileTree(dirPath: string, prefix = '', depth = 0): Promise<string> {
  if (depth > 3) return ''
  const entries = await readdir(dirPath)
  const lines: string[] = []
  const filtered = entries.filter(e => !IGNORE_DIRS.has(e)).slice(0, 50)
  for (const entry of filtered) {
    const fullPath = join(dirPath, entry)
    try {
      const s = await stat(fullPath)
      if (s.isDirectory()) {
        lines.push(`${prefix}${entry}/`)
        const subtree = await buildFileTree(fullPath, `${prefix}  `, depth + 1)
        if (subtree) lines.push(subtree)
      } else {
        lines.push(`${prefix}${entry}`)
      }
    } catch { /* skip unreadable */ }
  }
  return lines.join('\n')
}

async function countLines(dirPath: string, stats: ProjectStats, depth = 0): Promise<void> {
  if (depth > 4) return
  const entries = await readdir(dirPath)
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry)) continue
    const fullPath = join(dirPath, entry)
    try {
      const s = await stat(fullPath)
      if (s.isDirectory()) {
        await countLines(fullPath, stats, depth + 1)
      } else {
        stats.totalFiles++
        const ext = extname(entry).toLowerCase()
        const lang = LANG_MAP[ext]
        if (lang) {
          try {
            const content = await readFile(fullPath, 'utf-8')
            const lines = content.split('\n').length
            stats.totalLines += lines
            if (!stats.languages[lang]) stats.languages[lang] = { files: 0, lines: 0 }
            stats.languages[lang].files++
            stats.languages[lang].lines += lines
          } catch { /* binary or unreadable */ }
        }
      }
    } catch { /* skip */ }
  }
}

export async function scanProject(projectPath: string): Promise<ProjectScanResult> {
  const name = basename(projectPath)
  const fileTree = await buildFileTree(projectPath)

  let readme: string | null = null
  for (const fname of ['README.md', 'README.rst', 'README.txt', 'README']) {
    try {
      readme = await readFile(join(projectPath, fname), 'utf-8')
      break
    } catch { /* not found */ }
  }

  let packageJson: string | null = null
  try {
    const raw = await readFile(join(projectPath, 'package.json'), 'utf-8')
    const pkg = JSON.parse(raw)
    packageJson = JSON.stringify({
      name: pkg.name,
      description: pkg.description,
      dependencies: pkg.dependencies,
      devDependencies: pkg.devDependencies
    }, null, 2)
  } catch { /* no package.json */ }

  let gitLog: string | null = null
  try {
    const { stdout } = await execFileAsync('git', ['log', '--oneline', '-20'], {
      cwd: projectPath,
      timeout: 10000
    })
    gitLog = stdout.trim() || null
  } catch { /* not a git repo */ }

  // Collect stats
  const stats: ProjectStats = {
    totalFiles: 0,
    totalLines: 0,
    languages: {},
    gitDiffStat: null,
    recentContributors: null
  }

  await countLines(projectPath, stats)

  // Sort languages by lines descending
  const sorted = Object.entries(stats.languages)
    .sort(([, a], [, b]) => b.lines - a.lines)
    .slice(0, 10)
  stats.languages = Object.fromEntries(sorted)

  // Git shortstat (recent 7 days)
  try {
    const { stdout } = await execFileAsync('git', [
      'log', '--since=7.days', '--shortstat', '--oneline'
    ], { cwd: projectPath, timeout: 10000 })
    const statLines = stdout.split('\n').filter(l => l.includes('file'))
    if (statLines.length > 0) {
      stats.gitDiffStat = statLines.slice(0, 3).join('\n')
    }
  } catch { /* ignore */ }

  // Recent contributors
  try {
    const { stdout } = await execFileAsync('git', [
      'log', '--since=30.days', '--format=%aN', '--no-merges'
    ], { cwd: projectPath, timeout: 10000 })
    const authors = [...new Set(stdout.trim().split('\n').filter(Boolean))]
    if (authors.length > 0) {
      stats.recentContributors = authors.slice(0, 5).join(', ')
    }
  } catch { /* ignore */ }

  return { name, path: projectPath, readme, fileTree, gitLog, packageJson, stats }
}

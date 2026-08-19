import { readdir, readFile, stat } from 'fs/promises'
import { join, basename } from 'path'
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
}

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'out', 'build', '.next', '__pycache__', '.venv', 'venv'
])

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
  } catch { /* not a git repo or git not available */ }

  return { name, path: projectPath, readme, fileTree, gitLog, packageJson }
}

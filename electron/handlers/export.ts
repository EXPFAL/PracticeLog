import { ipcMain, BrowserWindow, dialog } from 'electron'
import type Database from 'better-sqlite3'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { app } from 'electron'
import MarkdownIt from 'markdown-it'
import { getPractice } from '../database/practice'
import { listKnowledgeItems } from '../database/knowledge'
import { listDailyLogs } from '../database/daily-log'
import { listProjectArchives } from '../database/project'

const md = new MarkdownIt()

function getExportsDir(): string {
  return app.isPackaged
    ? join(app.getPath('userData'), 'exports')
    : join(app.getAppPath(), 'exports')
}

async function buildMarkdown(db: Database.Database, practiceId: number): Promise<string> {
  const practice = await getPractice(db, practiceId)
  if (!practice) throw new Error('实践记录不存在')

  const knowledge = await listKnowledgeItems(db, practiceId)
  const logs = await listDailyLogs(db, practiceId)
  const projects = await listProjectArchives(db, practiceId)

  let md_text = `# ${practice.title}\n\n`
  if (practice.location) md_text += `**地点**: ${practice.location}\n`
  if (practice.advisor) md_text += `**指导老师**: ${practice.advisor}\n`
  if (practice.start_date || practice.end_date) {
    md_text += `**时间**: ${practice.start_date ?? '?'} — ${practice.end_date ?? '?'}\n`
  }
  if (practice.direction_tags) {
    try {
      const tags = JSON.parse(practice.direction_tags) as string[]
      md_text += `**方向**: ${tags.join('、')}\n`
    } catch { /* ignore */ }
  }
  md_text += '\n---\n\n'

  if (knowledge.length > 0) {
    md_text += '## 学习清单\n\n'
    const groups = { '必问': [] as typeof knowledge, '加分': [] as typeof knowledge, '了解': [] as typeof knowledge }
    for (const item of knowledge) {
      const key = item.importance ?? '了解'
      groups[key].push(item)
    }
    for (const [level, items] of Object.entries(groups)) {
      if (items.length === 0) continue
      md_text += `### ${level}\n\n`
      for (const item of items) {
        const statusIcon = item.status === '已掌握' ? '✅' : item.status === '学习中' ? '🔄' : '⬜'
        md_text += `- ${statusIcon} **${item.concept}**`
        if (item.one_line_explain) md_text += `: ${item.one_line_explain}`
        md_text += '\n'
        if (item.note) md_text += `  > 笔记: ${item.note}\n`
      }
      md_text += '\n'
    }
  }

  if (logs.length > 0) {
    md_text += '## 每日日志\n\n'
    const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date))
    for (const log of sorted) {
      md_text += `### ${log.date}\n\n`
      if (log.what_done) md_text += `**做了什么**: ${log.what_done}\n\n`
      if (log.problems) md_text += `**遇到的问题**: ${log.problems}\n\n`
      if (log.solutions) md_text += `**解决方案**: ${log.solutions}\n\n`
      if (log.reflection) md_text += `**反思**: ${log.reflection}\n\n`
    }
  }

  if (projects.length > 0) {
    md_text += '## 项目复盘\n\n'
    for (const proj of projects) {
      md_text += `### ${proj.name}\n\n`
      if (proj.summary) md_text += `**总结**: ${proj.summary}\n\n`
      if (proj.tech_stack) md_text += `**技术栈**: ${proj.tech_stack}\n\n`
      if (proj.role) md_text += `**我的角色**: ${proj.role}\n\n`
      if (proj.real_involvement) md_text += `**真实参与度**: ${proj.real_involvement}\n\n`
      if (proj.problems_solved) md_text += `**解决的问题**: ${proj.problems_solved}\n\n`
      if (proj.lessons) md_text += `**学到的**: ${proj.lessons}\n\n`
      if (proj.unknowns) md_text += `**还不懂的**: ${proj.unknowns}\n\n`
      if (proj.interview_script) md_text += `**面试话术**: ${proj.interview_script}\n\n`
    }
  }

  return md_text
}

export function registerExportHandlers(db: Database.Database): void {
  ipcMain.handle('export:markdown', async (_e, practiceId: number) => {
    const exportsDir = getExportsDir()
    await mkdir(exportsDir, { recursive: true })

    const practice = await getPractice(db, practiceId)
    if (!practice) throw new Error('实践记录不存在')

    const content = await buildMarkdown(db, practiceId)
    const filename = `${practice.title.replace(/[\\/:*?"<>|]/g, '_')}.md`
    const filePath = join(exportsDir, filename)
    await writeFile(filePath, content, 'utf-8')
    return filePath
  })

  ipcMain.handle('export:pdf', async (event, practiceId: number) => {
    const practice = await getPractice(db, practiceId)
    if (!practice) throw new Error('实践记录不存在')

    const content = await buildMarkdown(db, practiceId)
    const htmlContent = md.render(content)
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6;color:#333}
h1{color:#1a1a2e;border-bottom:2px solid #16213e;padding-bottom:8px}
h2{color:#16213e;margin-top:2em}h3{color:#0f3460}
hr{border:none;border-top:1px solid #eee;margin:1.5em 0}
blockquote{border-left:3px solid #ccc;margin:0.5em 0;padding:0.2em 1em;color:#666}</style>
</head><body>${htmlContent}</body></html>`

    const win = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true } })
    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`)

    const pdfData = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { top: 20, bottom: 20, left: 20, right: 20 }
    })
    win.close()

    const exportsDir = getExportsDir()
    await mkdir(exportsDir, { recursive: true })
    const filename = `${practice.title.replace(/[\\/:*?"<>|]/g, '_')}.pdf`
    const filePath = join(exportsDir, filename)
    await writeFile(filePath, pdfData)
    return filePath
  })

  ipcMain.handle('dialog:openFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: '文档', extensions: ['pdf', 'txt', 'md', 'rst', 'log', 'csv'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths
  })

  ipcMain.handle('db:backup', async () => {
    const { copyFile } = await import('fs/promises')
    const backupDir = getExportsDir()
    const backupSubdir = join(backupDir, 'backup')
    await mkdir(backupSubdir, { recursive: true })

    const dataDir = app.isPackaged
      ? join(app.getPath('userData'), 'data')
      : join(app.getAppPath(), 'data')
    const dbPath = join(dataDir, 'practice.db')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const backupPath = join(backupSubdir, `practice-${timestamp}.db`)
    await copyFile(dbPath, backupPath)
    return backupPath
  })
}

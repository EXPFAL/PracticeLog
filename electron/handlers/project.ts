import { ipcMain } from 'electron'
import type Database from 'better-sqlite3'
import { listProjectArchives, createProjectArchive, updateProjectArchive, deleteProjectArchive } from '../database/project'
import { scanProject } from '../utils/project-scanner'
import { generateProjectArchive as aiGenerate } from '../ai/deepseek'

export function registerProjectHandlers(db: Database.Database): void {
  ipcMain.handle('project:list', (_e, practiceId: number) => listProjectArchives(db, practiceId))
  ipcMain.handle('project:create', (_e, data) => createProjectArchive(db, data))
  ipcMain.handle('project:update', (_e, id: number, data) => updateProjectArchive(db, id, data))
  ipcMain.handle('project:delete', (_e, id: number) => deleteProjectArchive(db, id))

  ipcMain.handle('project:scan', async (_e, projectPath: string) => {
    return scanProject(projectPath)
  })

  ipcMain.handle('project:generate', async (_e, practiceId: number, projectPath: string) => {
    const scanResult = await scanProject(projectPath)
    const draft = await aiGenerate(scanResult)
    const id = await createProjectArchive(db, {
      practice_id: practiceId,
      name: draft.name,
      local_path: projectPath,
      tech_stack: draft.tech_stack,
      role: draft.role,
      summary: draft.summary,
      real_involvement: draft.real_involvement,
      problems_solved: draft.problems_solved,
      lessons: draft.lessons,
      unknowns: draft.unknowns,
      interview_script: draft.interview_script,
      ai_generated: 1
    })
    return { id, ...draft }
  })
}

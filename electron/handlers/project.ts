import { ipcMain } from 'electron'
import { listProjectArchives, createProjectArchive, updateProjectArchive, deleteProjectArchive } from '../database/project'
import { scanProject } from '../utils/project-scanner'
import { generateProjectArchive as aiGenerate } from '../ai/deepseek'
import { rebuildFts, getDb } from '../database/index'
import { assertExistingDir } from '../utils/paths'

export function registerProjectHandlers(): void {
  ipcMain.handle('project:list', (_e, practiceId: number) => listProjectArchives(getDb(), practiceId))
  ipcMain.handle('project:create', async (_e, data) => {
    const id = await createProjectArchive(getDb(), data)
    rebuildFts()
    return id
  })
  ipcMain.handle('project:update', async (_e, id: number, data) => {
    await updateProjectArchive(getDb(), id, data)
    rebuildFts()
  })
  ipcMain.handle('project:delete', async (_e, id: number) => {
    await deleteProjectArchive(getDb(), id)
    rebuildFts()
  })

  ipcMain.handle('project:generate', async (_e, practiceId: number, projectPath: string) => {
    await assertExistingDir(projectPath)
    const scanResult = await scanProject(projectPath)
    const draft = await aiGenerate(scanResult)
    const id = await createProjectArchive(getDb(), {
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
    rebuildFts()
    return { id, ...draft }
  })
}

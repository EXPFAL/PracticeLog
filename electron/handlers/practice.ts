import { ipcMain } from 'electron'
import { listPractices, createPractice, updatePractice, deletePractice, type PracticeRow } from '../database/practice'
import { rebuildFts, getDb } from '../database/index'

export function registerPracticeHandlers(): void {
  ipcMain.handle('practice:list', () => listPractices(getDb()))
  ipcMain.handle('practice:create', async (_e, data) => {
    const id = await createPractice(getDb(), data)
    rebuildFts()
    return id
  })
  ipcMain.handle('practice:update', async (_e, id: number, data) => {
    await updatePractice(getDb(), id, data)
    rebuildFts()
  })
  ipcMain.handle('practice:delete', async (_e, id: number) => {
    await deletePractice(getDb(), id)
    rebuildFts()
  })

  ipcMain.handle('practice:duplicate', async (_e, id: number) => {
    // Duplicate the practice and all its related rows in one transaction so a
    // mid-copy failure rolls back instead of leaving a half-copied practice.
    const db = getDb()
    const newId = db.transaction((practiceId: number): number => {
      const original = db.prepare('SELECT * FROM practice WHERE id = ?').get(practiceId) as PracticeRow | undefined
      if (!original) throw new Error('实践不存在')

      const newId = db.prepare(
        'INSERT INTO practice (title, start_date, end_date, location, advisor, direction_tags, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(
        original.title + ' (副本)', original.start_date, original.end_date,
        original.location, original.advisor, original.direction_tags, original.notes
      ).lastInsertRowid as number

      // Copy knowledge items
      const items = db.prepare('SELECT * FROM knowledge_item WHERE practice_id = ?').all(practiceId) as Array<{
        concept: string; one_line_explain: string | null; importance: string | null; status: string;
        resource: string | null; note: string | null; order_index: number; ai_generated: number
      }>
      const insertItem = db.prepare(
        'INSERT INTO knowledge_item (practice_id, concept, one_line_explain, importance, status, resource, note, order_index, ai_generated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      for (const item of items) {
        insertItem.run(newId, item.concept, item.one_line_explain, item.importance, item.status, item.resource, item.note, item.order_index, item.ai_generated)
      }

      // Copy daily logs
      const logs = db.prepare('SELECT * FROM daily_log WHERE practice_id = ?').all(practiceId) as Array<{
        date: string; what_done: string | null; problems: string | null; solutions: string | null; reflection: string | null
      }>
      const insertLog = db.prepare(
        'INSERT INTO daily_log (practice_id, date, what_done, problems, solutions, reflection) VALUES (?, ?, ?, ?, ?, ?)'
      )
      for (const log of logs) {
        insertLog.run(newId, log.date, log.what_done, log.problems, log.solutions, log.reflection)
      }

      // Copy materials
      const materials = db.prepare('SELECT * FROM material WHERE practice_id = ?').all(practiceId) as Array<{
        name: string; type: string; path_or_url: string; extracted_text: string | null
      }>
      const insertMat = db.prepare(
        'INSERT INTO material (practice_id, name, type, path_or_url, extracted_text) VALUES (?, ?, ?, ?, ?)'
      )
      for (const mat of materials) {
        insertMat.run(newId, mat.name, mat.type, mat.path_or_url, mat.extracted_text)
      }

      // Copy project archives
      const projects = db.prepare('SELECT * FROM project_archive WHERE practice_id = ?').all(practiceId) as Array<{
        name: string; local_path: string | null; tech_stack: string | null; role: string | null;
        summary: string | null; real_involvement: string | null; problems_solved: string | null;
        lessons: string | null; unknowns: string | null; interview_script: string | null; ai_generated: number
      }>
      const insertProj = db.prepare(
        `INSERT INTO project_archive (practice_id, name, local_path, tech_stack, role, summary, real_involvement, problems_solved, lessons, unknowns, interview_script, ai_generated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      for (const proj of projects) {
        insertProj.run(newId, proj.name, proj.local_path, proj.tech_stack, proj.role, proj.summary, proj.real_involvement, proj.problems_solved, proj.lessons, proj.unknowns, proj.interview_script, proj.ai_generated)
      }

      return newId
    })(id)

    rebuildFts()
    return newId
  })
}

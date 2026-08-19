import { ipcMain } from 'electron'
import type Database from 'better-sqlite3'
import { listPractices, createPractice, updatePractice, deletePractice, getPractice } from '../database/practice'
import { rebuildFts } from '../database/index'

export function registerPracticeHandlers(db: Database.Database): void {
  ipcMain.handle('practice:list', () => listPractices(db))
  ipcMain.handle('practice:create', async (_e, data) => {
    const id = await createPractice(db, data)
    rebuildFts()
    return id
  })
  ipcMain.handle('practice:update', async (_e, id: number, data) => {
    await updatePractice(db, id, data)
    rebuildFts()
  })
  ipcMain.handle('practice:delete', async (_e, id: number) => {
    await deletePractice(db, id)
    rebuildFts()
  })

  ipcMain.handle('practice:duplicate', async (_e, id: number) => {
    const original = await getPractice(db, id)
    if (!original) throw new Error('实践不存在')

    const newId = await createPractice(db, {
      title: original.title + ' (副本)',
      start_date: original.start_date,
      end_date: original.end_date,
      location: original.location,
      advisor: original.advisor,
      direction_tags: original.direction_tags,
      notes: original.notes
    })

    // Copy knowledge items
    const items = db.prepare('SELECT * FROM knowledge_item WHERE practice_id = ?').all(id) as Array<{
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
    const logs = db.prepare('SELECT * FROM daily_log WHERE practice_id = ?').all(id) as Array<{
      date: string; what_done: string | null; problems: string | null; solutions: string | null; reflection: string | null
    }>
    const insertLog = db.prepare(
      'INSERT INTO daily_log (practice_id, date, what_done, problems, solutions, reflection) VALUES (?, ?, ?, ?, ?, ?)'
    )
    for (const log of logs) {
      insertLog.run(newId, log.date, log.what_done, log.problems, log.solutions, log.reflection)
    }

    // Copy materials
    const materials = db.prepare('SELECT * FROM material WHERE practice_id = ?').all(id) as Array<{
      name: string; type: string; path_or_url: string; extracted_text: string | null
    }>
    const insertMat = db.prepare(
      'INSERT INTO material (practice_id, name, type, path_or_url, extracted_text) VALUES (?, ?, ?, ?, ?)'
    )
    for (const mat of materials) {
      insertMat.run(newId, mat.name, mat.type, mat.path_or_url, mat.extracted_text)
    }

    // Copy project archives
    const projects = db.prepare('SELECT * FROM project_archive WHERE practice_id = ?').all(id) as Array<{
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

    rebuildFts()
    return newId
  })
}

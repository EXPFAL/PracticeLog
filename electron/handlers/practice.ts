import { ipcMain } from 'electron'
import type Database from 'better-sqlite3'
import { listPractices, createPractice, updatePractice, deletePractice } from '../database/practice'
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
}

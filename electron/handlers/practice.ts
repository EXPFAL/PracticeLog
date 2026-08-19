import { ipcMain } from 'electron'
import type Database from 'better-sqlite3'
import { listPractices, createPractice, updatePractice, deletePractice } from '../database/practice'

export function registerPracticeHandlers(db: Database.Database): void {
  ipcMain.handle('practice:list', () => listPractices(db))
  ipcMain.handle('practice:create', (_e, data) => createPractice(db, data))
  ipcMain.handle('practice:update', (_e, id: number, data) => updatePractice(db, id, data))
  ipcMain.handle('practice:delete', (_e, id: number) => deletePractice(db, id))
}

import { ipcMain } from 'electron'
import type Database from 'better-sqlite3'
import { listDailyLogs, listAllDailyLogs, getDailyLog, createOrUpdateDailyLog, deleteDailyLog } from '../database/daily-log'
import { rebuildFts } from '../database/index'

export function registerLogHandlers(db: Database.Database): void {
  ipcMain.handle('log:list', (_e, practiceId: number) => listDailyLogs(db, practiceId))
  ipcMain.handle('log:listAll', () => listAllDailyLogs(db))
  ipcMain.handle('log:recent', (_e, limit: number) => {
    return db.prepare('SELECT * FROM daily_log ORDER BY date DESC LIMIT ?').all(limit)
  })
  ipcMain.handle('log:get', (_e, id: number) => getDailyLog(db, id))
  ipcMain.handle('log:create', async (_e, data) => {
    const id = await createOrUpdateDailyLog(db, data)
    rebuildFts()
    return id
  })
  ipcMain.handle('log:delete', async (_e, id: number) => {
    await deleteDailyLog(db, id)
    rebuildFts()
  })
}

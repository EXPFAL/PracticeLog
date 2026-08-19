import { ipcMain } from 'electron'
import type Database from 'better-sqlite3'
import { listDailyLogs, getDailyLog, createOrUpdateDailyLog } from '../database/daily-log'

export function registerLogHandlers(db: Database.Database): void {
  ipcMain.handle('log:list', (_e, practiceId: number) => listDailyLogs(db, practiceId))
  ipcMain.handle('log:get', (_e, id: number) => getDailyLog(db, id))
  ipcMain.handle('log:create', (_e, data) => createOrUpdateDailyLog(db, data))
}

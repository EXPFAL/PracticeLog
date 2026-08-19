import { ipcMain } from 'electron'
import { listDailyLogs, listAllDailyLogs, listRecentDailyLogs, getDailyLog, createOrUpdateDailyLog, deleteDailyLog } from '../database/daily-log'
import { rebuildFts, getDb } from '../database/index'

export function registerLogHandlers(): void {
  ipcMain.handle('log:list', (_e, practiceId: number) => listDailyLogs(getDb(), practiceId))
  ipcMain.handle('log:listAll', () => listAllDailyLogs(getDb()))
  ipcMain.handle('log:recent', (_e, limit: number) => listRecentDailyLogs(getDb(), limit))
  ipcMain.handle('log:get', (_e, id: number) => getDailyLog(getDb(), id))
  ipcMain.handle('log:create', async (_e, data) => {
    const id = await createOrUpdateDailyLog(getDb(), data)
    rebuildFts()
    return id
  })
  ipcMain.handle('log:delete', async (_e, id: number) => {
    await deleteDailyLog(getDb(), id)
    rebuildFts()
  })
}

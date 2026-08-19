import { autoUpdater } from 'electron-updater'
import { BrowserWindow, ipcMain } from 'electron'

let updateAvailable = false
let updateInfo: { version: string; releaseNotes?: string } | null = null

export function setupAutoUpdater(): void {
  // Don't auto-download
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    updateAvailable = true
    updateInfo = { version: info.version, releaseNotes: info.releaseNotes as string | undefined }
    // Notify all windows
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('update:available', updateInfo)
    })
  })

  autoUpdater.on('update-not-available', () => {
    updateAvailable = false
  })

  autoUpdater.on('download-progress', (progress) => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('update:progress', {
        percent: progress.percent,
        transferred: progress.transferred,
        total: progress.total
      })
    })
  })

  autoUpdater.on('update-downloaded', () => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('update:downloaded')
    })
  })

  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err.message)
  })

  // Register IPC handlers
  ipcMain.handle('update:check', async () => {
    try {
      const result = await autoUpdater.checkForUpdates()
      return {
        available: !!result?.updateInfo,
        version: result?.updateInfo?.version ?? null
      }
    } catch {
      return { available: false, version: null }
    }
  })

  ipcMain.handle('update:download', async () => {
    await autoUpdater.downloadUpdate()
  })

  ipcMain.handle('update:install', () => {
    autoUpdater.quitAndInstall()
  })

  ipcMain.handle('update:status', () => ({
    available: updateAvailable,
    info: updateInfo
  }))
}

import { autoUpdater } from 'electron-updater'
import { BrowserWindow, ipcMain, app } from 'electron'

export function setupAutoUpdater(): void {
  // Don't auto-download
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    const updateInfo = { version: info.version, releaseNotes: info.releaseNotes as string | undefined }
    // Notify all windows
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('update:available', updateInfo)
    })
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

  // Check for updates only in packaged builds (dev has no publish source)
  if (app.isPackaged) {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('Failed to check for updates:', err)
    })
  }

  // Register IPC handlers
  ipcMain.handle('update:download', async () => {
    try {
      await autoUpdater.downloadUpdate()
    } catch (err) {
      console.error('Failed to download update:', err)
      throw err
    }
  })

  ipcMain.handle('update:install', () => {
    autoUpdater.quitAndInstall()
  })
}

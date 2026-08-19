import { app, BrowserWindow, session, dialog } from 'electron'
import { join } from 'path'
import { initDatabase, closeDatabase } from './database/index'
import { registerPracticeHandlers } from './handlers/practice'
import { registerMaterialHandlers } from './handlers/material'
import { registerKnowledgeHandlers } from './handlers/knowledge'
import { registerLogHandlers } from './handlers/log'
import { registerProjectHandlers } from './handlers/project'
import { registerExportHandlers } from './handlers/export'
import { registerSearchHandlers } from './handlers/search'
import { registerAiConfigHandlers } from './handlers/ai-config'
import { setupAutoUpdater } from './ai/updater'

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // CSP for production
  if (!process.env.ELECTRON_RENDERER_URL) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': ["default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"]
        }
      })
    })
  }

  const db = initDatabase()

  registerPracticeHandlers(db)
  registerMaterialHandlers(db)
  registerKnowledgeHandlers(db)
  registerLogHandlers(db)
  registerProjectHandlers(db)
  registerExportHandlers(db)
  registerSearchHandlers(db)
  registerAiConfigHandlers()

  createWindow()
  setupAutoUpdater()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
}).catch((err) => {
  console.error('Failed to initialize app:', err)
  dialog.showErrorBox('初始化失败', String(err))
  app.quit()
})

app.on('window-all-closed', () => {
  closeDatabase()
  if (process.platform !== 'darwin') app.quit()
})

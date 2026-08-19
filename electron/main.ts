import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { initDatabase, closeDatabase } from './database/index'
import { registerPracticeHandlers } from './handlers/practice'
import { registerMaterialHandlers } from './handlers/material'
import { registerKnowledgeHandlers } from './handlers/knowledge'
import { registerLogHandlers } from './handlers/log'
import { registerProjectHandlers } from './handlers/project'
import { registerExportHandlers } from './handlers/export'
import { registerAiConfigHandlers } from './handlers/ai-config'

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
  const db = initDatabase()

  registerPracticeHandlers(db)
  registerMaterialHandlers(db)
  registerKnowledgeHandlers(db)
  registerLogHandlers(db)
  registerProjectHandlers(db)
  registerExportHandlers(db)
  registerAiConfigHandlers()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  closeDatabase()
  if (process.platform !== 'darwin') app.quit()
})

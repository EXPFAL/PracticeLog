import { app, BrowserWindow, session, dialog, Menu, shell, type MenuItemConstructorOptions } from 'electron'
import { join } from 'path'
import { initDatabase, closeDatabase } from './database/index'
import { registerPracticeHandlers } from './handlers/practice'
import { registerMaterialHandlers } from './handlers/material'
import { registerKnowledgeHandlers } from './handlers/knowledge'
import { registerLogHandlers } from './handlers/log'
import { registerProjectHandlers } from './handlers/project'
import { registerExportHandlers } from './handlers/export'
import { registerSearchHandlers } from './handlers/search'
import { registerSettingsHandlers } from './handlers/settings'
import { setupAutoUpdater } from './ai/updater'
import { applyApiConfig } from './ai/deepseek'

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

function sendNavigate(path: string): void {
  BrowserWindow.getFocusedWindow()?.webContents.send('menu:navigate', path)
}

function buildAppMenu(): void {
  const isMac = process.platform === 'darwin'
  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' as const }] : []),
    {
      label: '文件',
      submenu: [
        { label: '实践列表', click: () => sendNavigate('/practices') },
        { label: '导出', click: () => sendNavigate('/export') },
        { label: '设置', click: () => sendNavigate('/settings') },
        { type: 'separator' },
        isMac ? { role: 'close' as const } : { role: 'quit' as const, label: '退出' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '切换全屏' }
      ]
    },
    {
      label: '窗口',
      submenu: [
        { role: 'minimize', label: '最小化' },
        { role: 'close', label: '关闭窗口' }
      ]
    },
    {
      label: '帮助',
      role: 'help',
      submenu: [
        { label: 'GitHub 仓库', click: () => shell.openExternal('https://github.com/EXPFAL/PracticeLog') }
      ]
    }
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
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

  initDatabase()
  applyApiConfig()

  registerPracticeHandlers()
  registerMaterialHandlers()
  registerKnowledgeHandlers()
  registerLogHandlers()
  registerProjectHandlers()
  registerExportHandlers()
  registerSearchHandlers()
  registerSettingsHandlers()

  // The native File/Edit/View menu is redundant with the in-app sidebar; drop it in
  // the packaged app. Keep it in dev so DevTools/reload are still reachable.
  if (process.env.ELECTRON_RENDERER_URL) {
    buildAppMenu()
  } else {
    Menu.setApplicationMenu(null)
  }
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

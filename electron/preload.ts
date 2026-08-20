import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // Practice
  practiceList: () => ipcRenderer.invoke('practice:list'),
  practiceCreate: (data: unknown) => ipcRenderer.invoke('practice:create', data),
  practiceUpdate: (id: number, data: unknown) => ipcRenderer.invoke('practice:update', id, data),
  practiceDelete: (id: number) => ipcRenderer.invoke('practice:delete', id),
  practiceDuplicate: (id: number) => ipcRenderer.invoke('practice:duplicate', id),

  // Material
  materialList: (practiceId: number) => ipcRenderer.invoke('material:list', practiceId),
  materialAdd: (data: unknown) => ipcRenderer.invoke('material:add', data),
  materialDelete: (id: number) => ipcRenderer.invoke('material:delete', id),
  materialExtract: (materialId: number, filePath: string) => ipcRenderer.invoke('material:extract', materialId, filePath),

  // Knowledge
  knowledgeList: (practiceId: number) => ipcRenderer.invoke('knowledge:list', practiceId),
  knowledgeCreate: (data: unknown) => ipcRenderer.invoke('knowledge:create', data),
  knowledgeUpdate: (id: number, data: unknown) => ipcRenderer.invoke('knowledge:update', id, data),
  knowledgeDelete: (id: number) => ipcRenderer.invoke('knowledge:delete', id),
  knowledgeGenerate: (practiceId: number) => ipcRenderer.invoke('knowledge:generate', practiceId),
  knowledgeGenerateFromProject: (practiceId: number, projectPath: string) => ipcRenderer.invoke('knowledge:generateFromProject', practiceId, projectPath),
  knowledgeListAll: () => ipcRenderer.invoke('knowledge:listAll'),
  studyPlanGet: (practiceId: number) => ipcRenderer.invoke('studyPlan:get', practiceId),

  // Daily Log
  logList: (practiceId: number) => ipcRenderer.invoke('log:list', practiceId),
  logGet: (id: number) => ipcRenderer.invoke('log:get', id),
  logCreate: (data: unknown) => ipcRenderer.invoke('log:create', data),
  logDelete: (id: number) => ipcRenderer.invoke('log:delete', id),
  logListAll: () => ipcRenderer.invoke('log:listAll'),
  logRecent: (limit: number) => ipcRenderer.invoke('log:recent', limit),

  // Project
  projectList: (practiceId: number) => ipcRenderer.invoke('project:list', practiceId),
  projectCreate: (data: unknown) => ipcRenderer.invoke('project:create', data),
  projectUpdate: (id: number, data: unknown) => ipcRenderer.invoke('project:update', id, data),
  projectDelete: (id: number) => ipcRenderer.invoke('project:delete', id),
  projectGenerate: (practiceId: number, path: string) => ipcRenderer.invoke('project:generate', practiceId, path),

  // Export
  exportMarkdownPreview: (practiceId: number) => ipcRenderer.invoke('export:markdownPreview', practiceId),
  exportMarkdown: (practiceId: number) => ipcRenderer.invoke('export:markdown', practiceId),
  exportPdf: (practiceId: number) => ipcRenderer.invoke('export:pdf', practiceId),

  // Dialog
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  openFile: () => ipcRenderer.invoke('dialog:openFile'),

  // Database
  dbBackup: () => ipcRenderer.invoke('db:backup'),
  dbImport: (backupPath: string) => ipcRenderer.invoke('db:import', backupPath),
  dbSelectBackup: () => ipcRenderer.invoke('dialog:openBackup'),

  // Search
  searchQuery: (query: string, practiceId?: number, entityType?: string) => ipcRenderer.invoke('search:query', query, practiceId, entityType),

  // Settings
  settingsGet: () => ipcRenderer.invoke('settings:get'),
  settingsSet: (patch: unknown) => ipcRenderer.invoke('settings:set', patch),

  // Menu navigation
  onMenuNavigate: (callback: (path: string) => void) => {
    ipcRenderer.on('menu:navigate', (_e, path: string) => callback(path))
  },

  // Auto Update
  updateDownload: () => ipcRenderer.invoke('update:download'),
  onUpdateAvailable: (callback: (info: unknown) => void) => {
    ipcRenderer.on('update:available', (_e, info) => callback(info))
  },
  onUpdateProgress: (callback: (progress: unknown) => void) => {
    ipcRenderer.on('update:progress', (_e, progress) => callback(progress))
  },
  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on('update:downloaded', () => callback())
  }
})

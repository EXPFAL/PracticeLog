import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // Practice
  practiceList: () => ipcRenderer.invoke('practice:list'),
  practiceCreate: (data: unknown) => ipcRenderer.invoke('practice:create', data),
  practiceUpdate: (id: number, data: unknown) => ipcRenderer.invoke('practice:update', id, data),
  practiceDelete: (id: number) => ipcRenderer.invoke('practice:delete', id),

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

  // Daily Log
  logList: (practiceId: number) => ipcRenderer.invoke('log:list', practiceId),
  logGet: (id: number) => ipcRenderer.invoke('log:get', id),
  logCreate: (data: unknown) => ipcRenderer.invoke('log:create', data),

  // Project
  projectList: (practiceId: number) => ipcRenderer.invoke('project:list', practiceId),
  projectCreate: (data: unknown) => ipcRenderer.invoke('project:create', data),
  projectUpdate: (id: number, data: unknown) => ipcRenderer.invoke('project:update', id, data),
  projectDelete: (id: number) => ipcRenderer.invoke('project:delete', id),
  projectScan: (path: string) => ipcRenderer.invoke('project:scan', path),
  projectGenerate: (practiceId: number, path: string) => ipcRenderer.invoke('project:generate', practiceId, path),

  // Export
  exportMarkdown: (practiceId: number) => ipcRenderer.invoke('export:markdown', practiceId),
  exportPdf: (practiceId: number) => ipcRenderer.invoke('export:pdf', practiceId),

  // Dialog
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),

  // AI Config
  aiConfigGet: () => ipcRenderer.invoke('ai:config:get'),
  aiConfigSet: (key: string) => ipcRenderer.invoke('ai:config:set', key)
})

export interface Practice {
  id: number
  title: string
  start_date: string | null
  end_date: string | null
  location: string | null
  advisor: string | null
  direction_tags: string | null
  notes: string | null
  created_at: string
}

export interface Material {
  id: number
  practice_id: number
  name: string
  type: 'file' | 'url' | 'github'
  path_or_url: string
  extracted_text: string | null
  created_at: string
}

export interface KnowledgeItem {
  id: number
  practice_id: number
  concept: string
  one_line_explain: string | null
  importance: '必问' | '加分' | '了解' | null
  status: '未学' | '学习中' | '已掌握'
  resource: string | null
  note: string | null
  order_index: number
  ai_generated: number
  created_at: string
}

export interface DailyLog {
  id: number
  practice_id: number
  date: string
  what_done: string | null
  problems: string | null
  solutions: string | null
  reflection: string | null
  created_at: string
}

export interface ProjectArchive {
  id: number
  practice_id: number
  name: string
  local_path: string | null
  tech_stack: string | null
  role: string | null
  summary: string | null
  real_involvement: string | null
  problems_solved: string | null
  lessons: string | null
  unknowns: string | null
  interview_script: string | null
  ai_generated: number
  created_at: string
}

export interface SearchResult {
  entity_type: 'practice' | 'knowledge' | 'log' | 'project'
  entity_id: number
  practice_id: number
  title: string
  snippet: string
}

export interface ProjectScanResult {
  name: string
  path: string
  readme: string | null
  fileTree: string
  gitLog: string | null
  packageJson: string | null
}

export interface AppSettingsPublic {
  theme: 'dark' | 'light'
  apiBaseUrl: string
  apiModel: string
  apiKeyConfigured: boolean
}

export interface ElectronAPI {
  practiceList: () => Promise<Practice[]>
  practiceCreate: (data: Omit<Practice, 'id' | 'created_at'>) => Promise<number>
  practiceUpdate: (id: number, data: Partial<Omit<Practice, 'id' | 'created_at'>>) => Promise<void>
  practiceDelete: (id: number) => Promise<void>
  practiceDuplicate: (id: number) => Promise<number>

  materialList: (practiceId: number) => Promise<Material[]>
  materialAdd: (data: { practice_id: number; name: string; type: string; path_or_url: string }) => Promise<number>
  materialDelete: (id: number) => Promise<void>
  materialExtract: (materialId: number, filePath: string) => Promise<string>

  knowledgeList: (practiceId: number) => Promise<KnowledgeItem[]>
  knowledgeCreate: (data: Omit<KnowledgeItem, 'id' | 'created_at'>) => Promise<number>
  knowledgeUpdate: (id: number, data: Partial<Omit<KnowledgeItem, 'id' | 'created_at'>>) => Promise<void>
  knowledgeDelete: (id: number) => Promise<void>
  knowledgeGenerate: (practiceId: number) => Promise<number>
  knowledgeGenerateFromProject: (practiceId: number, projectPath: string) => Promise<{ count: number; planMd: string }>
  knowledgeListAll: () => Promise<KnowledgeItem[]>

  logList: (practiceId: number) => Promise<DailyLog[]>
  logGet: (id: number) => Promise<DailyLog | undefined>
  logCreate: (data: { practice_id: number; date: string; what_done?: string; problems?: string; solutions?: string; reflection?: string }) => Promise<number>
  logDelete: (id: number) => Promise<void>
  logListAll: () => Promise<DailyLog[]>
  logRecent: (limit: number) => Promise<DailyLog[]>

  projectList: (practiceId: number) => Promise<ProjectArchive[]>
  projectCreate: (data: Omit<ProjectArchive, 'id' | 'created_at'>) => Promise<number>
  projectUpdate: (id: number, data: Partial<Omit<ProjectArchive, 'id' | 'created_at'>>) => Promise<void>
  projectDelete: (id: number) => Promise<void>
  projectScan: (path: string) => Promise<ProjectScanResult>
  projectGenerate: (practiceId: number, path: string) => Promise<ProjectArchive & { id: number }>

  exportMarkdownPreview: (practiceId: number) => Promise<string>
  exportMarkdown: (practiceId: number) => Promise<string>
  exportPdf: (practiceId: number) => Promise<string>

  openFolder: () => Promise<string | null>
  openFile: () => Promise<string[] | null>
  dbBackup: () => Promise<string>
  dbImport: (backupPath: string) => Promise<void>
  dbSelectBackup: () => Promise<string | null>
  searchQuery: (query: string, practiceId?: number, entityType?: string) => Promise<SearchResult[]>

  settingsGet: () => Promise<AppSettingsPublic>
  settingsSet: (patch: Partial<Pick<AppSettingsPublic, 'theme' | 'apiBaseUrl' | 'apiModel'> & { apiKey?: string }>) => Promise<AppSettingsPublic>
  onMenuNavigate: (callback: (path: string) => void) => void

  updateDownload: () => Promise<void>
  updateInstall: () => void
  onUpdateAvailable: (callback: (info: { version: string }) => void) => void
  onUpdateProgress: (callback: (progress: { percent: number }) => void) => void
  onUpdateDownloaded: (callback: () => void) => void
}

/** Types shared across the Electron main process and the renderer. */

export interface SearchResult {
  entity_type: 'practice' | 'knowledge' | 'log' | 'project'
  entity_id: number
  practice_id: number
  title: string
  snippet: string
}

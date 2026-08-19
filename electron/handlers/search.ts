import { ipcMain } from 'electron'
import type Database from 'better-sqlite3'
import { buildFtsQuery } from '../utils/fts'

export interface SearchResult {
  entity_type: string
  entity_id: number
  practice_id: number
  title: string
  snippet: string
}

export function registerSearchHandlers(db: Database.Database): void {
  ipcMain.handle('search:query', (_e, query: string, practiceId?: number, entityType?: string): SearchResult[] => {
    if (!query.trim()) return []

    const ftsQuery = buildFtsQuery(query)

    let sql = `
      SELECT entity_type, entity_id, practice_id, title,
             snippet(fts_search, 4, '<b>', '</b>', '...', 32) as snippet
      FROM fts_search
      WHERE fts_search MATCH ?
    `
    const params: unknown[] = [ftsQuery]

    if (practiceId) {
      sql += ' AND practice_id = ?'
      params.push(practiceId)
    }
    if (entityType) {
      sql += ' AND entity_type = ?'
      params.push(entityType)
    }

    sql += ' ORDER BY rank LIMIT 50'

    try {
      return db.prepare(sql).all(...params) as SearchResult[]
    } catch (e) {
      console.error('FTS search failed:', e)
      return []
    }
  })
}

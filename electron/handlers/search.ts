import { ipcMain } from 'electron'
import type Database from 'better-sqlite3'

export interface SearchResult {
  entity_type: string
  entity_id: number
  practice_id: number
  title: string
  snippet: string
}

export function registerSearchHandlers(db: Database.Database): void {
  ipcMain.handle('search:query', (_e, query: string, practiceId?: number): SearchResult[] => {
    if (!query.trim()) return []

    const ftsQuery = query.trim().split(/\s+/).map(w => `"${w}"`).join(' OR ')

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

    sql += ' ORDER BY rank LIMIT 50'

    try {
      return db.prepare(sql).all(...params) as SearchResult[]
    } catch {
      return []
    }
  })

  ipcMain.handle('search:rebuild', () => {
    const { rebuildFts } = require('../database/index')
    rebuildFts()
  })
}

import Database from 'better-sqlite3'
import { mkdirSync } from 'fs'
import { join } from 'path'
import { SCHEMA_SQL } from './schema'
import { getDataDir } from '../utils/paths'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized')
  return db
}

export function initDatabase(): Database.Database {
  const dataDir = getDataDir()
  mkdirSync(dataDir, { recursive: true })

  const dbPath = join(dataDir, 'practice.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA_SQL)

  // Populate FTS index from existing data
  populateFts(db)

  // Periodic WAL checkpoint (every 5 minutes)
  checkpointTimer = setInterval(() => {
    try { db?.pragma('wal_checkpoint(PASSIVE)') } catch { /* ignore */ }
  }, 5 * 60 * 1000)

  return db
}

function populateFts(database: Database.Database): void {
  // Clear and rebuild FTS index
  database.exec('DELETE FROM fts_search')

  const insertFts = database.prepare(
    'INSERT INTO fts_search (entity_type, entity_id, practice_id, title, body) VALUES (?, ?, ?, ?, ?)'
  )

  const populate = database.transaction(() => {
    // Practices
    const practices = database.prepare('SELECT id, title, location, advisor, notes FROM practice').all() as Array<{
      id: number; title: string; location: string | null; advisor: string | null; notes: string | null
    }>
    for (const p of practices) {
      insertFts.run('practice', p.id, p.id, p.title, [p.location, p.advisor, p.notes].filter(Boolean).join(' '))
    }

    // Knowledge items
    const items = database.prepare('SELECT id, practice_id, concept, one_line_explain, resource, note FROM knowledge_item').all() as Array<{
      id: number; practice_id: number; concept: string; one_line_explain: string | null; resource: string | null; note: string | null
    }>
    for (const item of items) {
      insertFts.run('knowledge', item.id, item.practice_id, item.concept, [item.one_line_explain, item.resource, item.note].filter(Boolean).join(' '))
    }

    // Daily logs
    const logs = database.prepare('SELECT id, practice_id, date, what_done, problems, solutions, reflection FROM daily_log').all() as Array<{
      id: number; practice_id: number; date: string; what_done: string | null; problems: string | null; solutions: string | null; reflection: string | null
    }>
    for (const log of logs) {
      insertFts.run('log', log.id, log.practice_id, log.date, [log.what_done, log.problems, log.solutions, log.reflection].filter(Boolean).join(' '))
    }

    // Project archives
    const projects = database.prepare('SELECT id, practice_id, name, summary, lessons FROM project_archive').all() as Array<{
      id: number; practice_id: number; name: string; summary: string | null; lessons: string | null
    }>
    for (const proj of projects) {
      insertFts.run('project', proj.id, proj.practice_id, proj.name, [proj.summary, proj.lessons].filter(Boolean).join(' '))
    }
  })

  populate()
}

let ftsDebounceTimer: ReturnType<typeof setTimeout> | null = null
let checkpointTimer: ReturnType<typeof setInterval> | null = null
export function rebuildFts(): void {
  if (!db) return
  if (ftsDebounceTimer) clearTimeout(ftsDebounceTimer)
  ftsDebounceTimer = setTimeout(() => {
    try { if (db) populateFts(db) } catch { /* ignore */ }
  }, 500)
}

export function closeDatabase(): void {
  if (checkpointTimer) {
    clearInterval(checkpointTimer)
    checkpointTimer = null
  }
  if (ftsDebounceTimer) {
    clearTimeout(ftsDebounceTimer)
    ftsDebounceTimer = null
  }
  if (db) {
    try { db.pragma('wal_checkpoint(TRUNCATE)') } catch { /* ignore */ }
    db.close()
    db = null
  }
}

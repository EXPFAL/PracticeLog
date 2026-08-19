import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { mkdirSync } from 'fs'
import { SCHEMA_SQL } from './schema'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized')
  return db
}

export function initDatabase(): Database.Database {
  const dataDir = app.isPackaged
    ? join(app.getPath('userData'), 'data')
    : join(app.getAppPath(), 'data')
  mkdirSync(dataDir, { recursive: true })

  const dbPath = join(dataDir, 'practice.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA_SQL)
  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

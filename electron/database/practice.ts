import type Database from 'better-sqlite3'

export interface PracticeRow {
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

export async function listPractices(db: Database.Database): Promise<PracticeRow[]> {
  return db.prepare('SELECT * FROM practice ORDER BY created_at DESC').all() as PracticeRow[]
}

export async function getPractice(db: Database.Database, id: number): Promise<PracticeRow | undefined> {
  return db.prepare('SELECT * FROM practice WHERE id = ?').get(id) as PracticeRow | undefined
}

export async function createPractice(
  db: Database.Database,
  data: Omit<PracticeRow, 'id' | 'created_at'>
): Promise<number> {
  const stmt = db.prepare(
    'INSERT INTO practice (title, start_date, end_date, location, advisor, direction_tags, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  const result = stmt.run(
    data.title, data.start_date, data.end_date,
    data.location, data.advisor, data.direction_tags, data.notes
  )
  return result.lastInsertRowid as number
}

const ALLOWED_FIELDS = new Set(['title', 'start_date', 'end_date', 'location', 'advisor', 'direction_tags', 'notes'])

export async function updatePractice(
  db: Database.Database,
  id: number,
  data: Partial<Omit<PracticeRow, 'id' | 'created_at'>>
): Promise<void> {
  const fields: string[] = []
  const values: unknown[] = []
  for (const [key, value] of Object.entries(data)) {
    if (!ALLOWED_FIELDS.has(key)) continue
    fields.push(`${key} = ?`)
    values.push(value)
  }
  if (fields.length === 0) return
  values.push(id)
  db.prepare(`UPDATE practice SET ${fields.join(', ')} WHERE id = ?`).run(...values)
}

export async function deletePractice(db: Database.Database, id: number): Promise<void> {
  db.prepare('DELETE FROM practice WHERE id = ?').run(id)
}

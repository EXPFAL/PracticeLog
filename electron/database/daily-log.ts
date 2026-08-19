import type Database from 'better-sqlite3'

export interface DailyLogRow {
  id: number
  practice_id: number
  date: string
  what_done: string | null
  problems: string | null
  solutions: string | null
  reflection: string | null
  created_at: string
}

export async function listDailyLogs(db: Database.Database, practiceId: number): Promise<DailyLogRow[]> {
  return db.prepare(
    'SELECT * FROM daily_log WHERE practice_id = ? ORDER BY date DESC'
  ).all(practiceId) as DailyLogRow[]
}

export async function listAllDailyLogs(db: Database.Database): Promise<DailyLogRow[]> {
  return db.prepare('SELECT * FROM daily_log ORDER BY date DESC').all() as DailyLogRow[]
}

export async function getDailyLog(db: Database.Database, id: number): Promise<DailyLogRow | undefined> {
  return db.prepare('SELECT * FROM daily_log WHERE id = ?').get(id) as DailyLogRow | undefined
}

export async function getDailyLogByDate(
  db: Database.Database,
  practiceId: number,
  date: string
): Promise<DailyLogRow | undefined> {
  return db.prepare(
    'SELECT * FROM daily_log WHERE practice_id = ? AND date = ?'
  ).get(practiceId, date) as DailyLogRow | undefined
}

export async function createOrUpdateDailyLog(
  db: Database.Database,
  data: { practice_id: number; date: string; what_done?: string; problems?: string; solutions?: string; reflection?: string }
): Promise<number> {
  const existing = await getDailyLogByDate(db, data.practice_id, data.date)
  if (existing) {
    db.prepare(
      'UPDATE daily_log SET what_done = ?, problems = ?, solutions = ?, reflection = ? WHERE id = ?'
    ).run(data.what_done ?? null, data.problems ?? null, data.solutions ?? null, data.reflection ?? null, existing.id)
    return existing.id
  }
  const result = db.prepare(
    'INSERT INTO daily_log (practice_id, date, what_done, problems, solutions, reflection) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(data.practice_id, data.date, data.what_done ?? null, data.problems ?? null, data.solutions ?? null, data.reflection ?? null)
  return result.lastInsertRowid as number
}

export async function deleteDailyLog(db: Database.Database, id: number): Promise<void> {
  db.prepare('DELETE FROM daily_log WHERE id = ?').run(id)
}

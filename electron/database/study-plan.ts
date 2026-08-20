import type Database from 'better-sqlite3'

export interface StudyPlanRow {
  practice_id: number
  content: string
  updated_at: string
}

export async function saveStudyPlan(db: Database.Database, practiceId: number, content: string): Promise<void> {
  db.prepare(
    `INSERT INTO study_plan (practice_id, content, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(practice_id) DO UPDATE SET content = excluded.content, updated_at = datetime('now')`
  ).run(practiceId, content)
}

export async function getStudyPlan(db: Database.Database, practiceId: number): Promise<StudyPlanRow | undefined> {
  return db.prepare('SELECT * FROM study_plan WHERE practice_id = ?').get(practiceId) as StudyPlanRow | undefined
}

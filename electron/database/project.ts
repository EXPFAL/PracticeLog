import type Database from 'better-sqlite3'

export interface ProjectArchiveRow {
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

export async function listProjectArchives(db: Database.Database, practiceId: number): Promise<ProjectArchiveRow[]> {
  return db.prepare(
    'SELECT * FROM project_archive WHERE practice_id = ? ORDER BY created_at DESC'
  ).all(practiceId) as ProjectArchiveRow[]
}

export async function createProjectArchive(
  db: Database.Database,
  data: Omit<ProjectArchiveRow, 'id' | 'created_at'>
): Promise<number> {
  const result = db.prepare(
    `INSERT INTO project_archive (practice_id, name, local_path, tech_stack, role, summary, real_involvement, problems_solved, lessons, unknowns, interview_script, ai_generated)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    data.practice_id, data.name, data.local_path, data.tech_stack,
    data.role, data.summary, data.real_involvement, data.problems_solved,
    data.lessons, data.unknowns, data.interview_script, data.ai_generated
  )
  return result.lastInsertRowid as number
}

const ALLOWED_PROJECT_FIELDS = new Set(['name', 'local_path', 'tech_stack', 'role', 'summary', 'real_involvement', 'problems_solved', 'lessons', 'unknowns', 'interview_script', 'ai_generated'])

export async function updateProjectArchive(
  db: Database.Database,
  id: number,
  data: Partial<Omit<ProjectArchiveRow, 'id' | 'created_at'>>
): Promise<void> {
  const fields: string[] = []
  const values: unknown[] = []
  for (const [key, value] of Object.entries(data)) {
    if (!ALLOWED_PROJECT_FIELDS.has(key)) continue
    fields.push(`${key} = ?`)
    values.push(value)
  }
  if (fields.length === 0) return
  values.push(id)
  db.prepare(`UPDATE project_archive SET ${fields.join(', ')} WHERE id = ?`).run(...values)
}

export async function deleteProjectArchive(db: Database.Database, id: number): Promise<void> {
  db.prepare('DELETE FROM project_archive WHERE id = ?').run(id)
}

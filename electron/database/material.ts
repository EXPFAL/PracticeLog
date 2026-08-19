import type Database from 'better-sqlite3'

export interface MaterialRow {
  id: number
  practice_id: number
  name: string
  type: 'file' | 'url' | 'github'
  path_or_url: string
  extracted_text: string | null
  created_at: string
}

export async function listMaterials(db: Database.Database, practiceId: number): Promise<MaterialRow[]> {
  return db.prepare('SELECT * FROM material WHERE practice_id = ? ORDER BY created_at DESC').all(practiceId) as MaterialRow[]
}

export async function addMaterial(
  db: Database.Database,
  data: { practice_id: number; name: string; type: 'file' | 'url' | 'github'; path_or_url: string; extracted_text?: string }
): Promise<number> {
  const result = db.prepare(
    'INSERT INTO material (practice_id, name, type, path_or_url, extracted_text) VALUES (?, ?, ?, ?, ?)'
  ).run(data.practice_id, data.name, data.type, data.path_or_url, data.extracted_text ?? null)
  return result.lastInsertRowid as number
}

export async function updateMaterialExtractedText(db: Database.Database, id: number, text: string): Promise<void> {
  db.prepare('UPDATE material SET extracted_text = ? WHERE id = ?').run(text, id)
}

export async function deleteMaterial(db: Database.Database, id: number): Promise<void> {
  db.prepare('DELETE FROM material WHERE id = ?').run(id)
}

import type Database from 'better-sqlite3'

export interface KnowledgeItemRow {
  id: number
  practice_id: number
  concept: string
  one_line_explain: string | null
  importance: '必问' | '加分' | '了解' | null
  status: '未学' | '学习中' | '已掌握'
  resource: string | null
  note: string | null
  order_index: number
  ai_generated: number
  created_at: string
}

export async function listKnowledgeItems(db: Database.Database, practiceId: number): Promise<KnowledgeItemRow[]> {
  return db.prepare(
    'SELECT * FROM knowledge_item WHERE practice_id = ? ORDER BY order_index, id'
  ).all(practiceId) as KnowledgeItemRow[]
}

export async function createKnowledgeItem(
  db: Database.Database,
  data: Omit<KnowledgeItemRow, 'id' | 'created_at'>
): Promise<number> {
  const result = db.prepare(
    `INSERT INTO knowledge_item (practice_id, concept, one_line_explain, importance, status, resource, note, order_index, ai_generated)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    data.practice_id, data.concept, data.one_line_explain,
    data.importance, data.status, data.resource, data.note,
    data.order_index, data.ai_generated
  )
  return result.lastInsertRowid as number
}

const ALLOWED_KNOWLEDGE_FIELDS = new Set(['concept', 'one_line_explain', 'importance', 'status', 'resource', 'note', 'order_index', 'ai_generated'])

export async function updateKnowledgeItem(
  db: Database.Database,
  id: number,
  data: Partial<Omit<KnowledgeItemRow, 'id' | 'created_at'>>
): Promise<void> {
  const fields: string[] = []
  const values: unknown[] = []
  for (const [key, value] of Object.entries(data)) {
    if (!ALLOWED_KNOWLEDGE_FIELDS.has(key)) continue
    fields.push(`${key} = ?`)
    values.push(value)
  }
  if (fields.length === 0) return
  values.push(id)
  db.prepare(`UPDATE knowledge_item SET ${fields.join(', ')} WHERE id = ?`).run(...values)
}

export async function deleteKnowledgeItem(db: Database.Database, id: number): Promise<void> {
  db.prepare('DELETE FROM knowledge_item WHERE id = ?').run(id)
}

export async function batchCreateKnowledgeItems(
  db: Database.Database,
  items: Omit<KnowledgeItemRow, 'id' | 'created_at'>[]
): Promise<void> {
  const stmt = db.prepare(
    `INSERT INTO knowledge_item (practice_id, concept, one_line_explain, importance, status, resource, note, order_index, ai_generated)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const insertMany = db.transaction((rows: Omit<KnowledgeItemRow, 'id' | 'created_at'>[]) => {
    for (const row of rows) {
      stmt.run(
        row.practice_id, row.concept, row.one_line_explain,
        row.importance, row.status, row.resource, row.note,
        row.order_index, row.ai_generated
      )
    }
  })
  insertMany(items)
}

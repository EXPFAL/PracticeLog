import type Database from 'better-sqlite3'

const UPDATEABLE_TABLES = new Set(['practice', 'knowledge_item', 'project_archive'])

/** Whitelist-filtered UPDATE: only keys present in `allowed` are written. Table names are internal literals, guarded here. */
export function updateRow(
  db: Database.Database,
  table: string,
  id: number,
  data: Record<string, unknown>,
  allowed: ReadonlySet<string>
): void {
  if (!UPDATEABLE_TABLES.has(table)) throw new Error(`不支持的更新表: ${table}`)
  const fields: string[] = []
  const values: unknown[] = []
  for (const [key, value] of Object.entries(data)) {
    if (!allowed.has(key)) continue
    fields.push(`${key} = ?`)
    values.push(value)
  }
  if (fields.length === 0) return
  values.push(id)
  db.prepare(`UPDATE ${table} SET ${fields.join(', ')} WHERE id = ?`).run(...values)
}

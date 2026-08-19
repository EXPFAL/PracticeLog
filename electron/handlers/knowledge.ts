import { ipcMain } from 'electron'
import type Database from 'better-sqlite3'
import {
  listKnowledgeItems, createKnowledgeItem, updateKnowledgeItem,
  deleteKnowledgeItem, batchCreateKnowledgeItems
} from '../database/knowledge'
import { listMaterials } from '../database/material'
import { generateKnowledgeList } from '../ai/deepseek'

export function registerKnowledgeHandlers(db: Database.Database): void {
  ipcMain.handle('knowledge:list', (_e, practiceId: number) => listKnowledgeItems(db, practiceId))
  ipcMain.handle('knowledge:create', (_e, data) => createKnowledgeItem(db, data))
  ipcMain.handle('knowledge:update', (_e, id: number, data) => updateKnowledgeItem(db, id, data))
  ipcMain.handle('knowledge:delete', (_e, id: number) => deleteKnowledgeItem(db, id))

  ipcMain.handle('knowledge:generate', async (_e, practiceId: number) => {
    const materials = await listMaterials(db, practiceId)
    const texts = materials
      .map(m => m.extracted_text)
      .filter((t): t is string => !!t)

    if (texts.length === 0) {
      throw new Error('没有可用的资料文本。请先上传资料并提取文本。')
    }

    const generated = await generateKnowledgeList(texts)
    const items = generated.map((item, index) => ({
      practice_id: practiceId,
      concept: item.concept,
      one_line_explain: item.one_line_explain,
      importance: item.importance,
      status: '未学' as const,
      resource: item.resource,
      note: null,
      order_index: index,
      ai_generated: 1
    }))

    batchCreateKnowledgeItems(db, items)
    return items.length
  })
}

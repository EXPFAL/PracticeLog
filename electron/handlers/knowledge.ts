import { ipcMain } from 'electron'
import type Database from 'better-sqlite3'
import {
  listKnowledgeItems, listAllKnowledgeItems, createKnowledgeItem, updateKnowledgeItem,
  deleteKnowledgeItem, batchCreateKnowledgeItems
} from '../database/knowledge'
import { listMaterials } from '../database/material'
import { generateKnowledgeList, generateKnowledgeListFromProject } from '../ai/deepseek'
import { scanProject } from '../utils/project-scanner'
import { assertExistingDir } from '../utils/paths'
import { rebuildFts } from '../database/index'

export function registerKnowledgeHandlers(db: Database.Database): void {
  ipcMain.handle('knowledge:list', (_e, practiceId: number) => listKnowledgeItems(db, practiceId))
  ipcMain.handle('knowledge:listAll', () => listAllKnowledgeItems(db))
  ipcMain.handle('knowledge:create', async (_e, data) => {
    const id = await createKnowledgeItem(db, data)
    rebuildFts()
    return id
  })
  ipcMain.handle('knowledge:update', async (_e, id: number, data) => {
    await updateKnowledgeItem(db, id, data)
    rebuildFts()
  })
  ipcMain.handle('knowledge:delete', async (_e, id: number) => {
    await deleteKnowledgeItem(db, id)
    rebuildFts()
  })

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
    rebuildFts()
    return items.length
  })

  ipcMain.handle('knowledge:generateFromProject', async (_e, practiceId: number, projectPath: string) => {
    await assertExistingDir(projectPath)
    const scanResult = await scanProject(projectPath)
    const generated = await generateKnowledgeListFromProject(scanResult)

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
    rebuildFts()
    return items.length
  })
}

import { ipcMain } from 'electron'
import {
  listKnowledgeItems, listAllKnowledgeItems, createKnowledgeItem, updateKnowledgeItem,
  deleteKnowledgeItem, batchCreateKnowledgeItems, type KnowledgeItemRow
} from '../database/knowledge'
import { listMaterials } from '../database/material'
import { saveStudyPlan, getStudyPlan } from '../database/study-plan'
import { generateKnowledgeList, generateStudyPlanAndItems, type GeneratedKnowledgeItem } from '../ai/deepseek'
import { scanProject } from '../utils/project-scanner'
import { assertExistingDir } from '../utils/paths'
import { rebuildFts, getDb } from '../database/index'

function toKnowledgeRows(practiceId: number, generated: GeneratedKnowledgeItem[]): Omit<KnowledgeItemRow, 'id' | 'created_at'>[] {
  return generated.map((item, index) => ({
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
}

export function registerKnowledgeHandlers(): void {
  ipcMain.handle('knowledge:list', (_e, practiceId: number) => listKnowledgeItems(getDb(), practiceId))
  ipcMain.handle('knowledge:listAll', () => listAllKnowledgeItems(getDb()))
  ipcMain.handle('knowledge:create', async (_e, data) => {
    const id = await createKnowledgeItem(getDb(), data)
    rebuildFts()
    return id
  })
  ipcMain.handle('knowledge:update', async (_e, id: number, data) => {
    await updateKnowledgeItem(getDb(), id, data)
    rebuildFts()
  })
  ipcMain.handle('knowledge:delete', async (_e, id: number) => {
    await deleteKnowledgeItem(getDb(), id)
    rebuildFts()
  })

  ipcMain.handle('knowledge:generate', async (_e, practiceId: number) => {
    const materials = await listMaterials(getDb(), practiceId)
    const texts = materials
      .map(m => m.extracted_text)
      .filter((t): t is string => !!t)

    if (texts.length === 0) {
      throw new Error('没有可用的资料文本。请先上传资料并提取文本。')
    }

    const generated = await generateKnowledgeList(texts)
    const items = toKnowledgeRows(practiceId, generated)

    batchCreateKnowledgeItems(getDb(), items)
    rebuildFts()
    return items.length
  })

  ipcMain.handle('knowledge:generateFromProject', async (_e, practiceId: number, projectPath: string) => {
    await assertExistingDir(projectPath)
    const scanResult = await scanProject(projectPath)
    const { items: generated, planMd } = await generateStudyPlanAndItems(scanResult)

    const items = toKnowledgeRows(practiceId, generated)

    batchCreateKnowledgeItems(getDb(), items)
    if (planMd) await saveStudyPlan(getDb(), practiceId, planMd)
    rebuildFts()
    return { count: items.length, planMd }
  })

  ipcMain.handle('studyPlan:get', (_e, practiceId: number) => getStudyPlan(getDb(), practiceId))
}

import { ipcMain } from 'electron'
import type Database from 'better-sqlite3'
import { listMaterials, addMaterial, updateMaterialExtractedText, deleteMaterial } from '../database/material'
import { extractText } from '../utils/file-extract'
import { assertExistingFile } from '../utils/paths'

export function registerMaterialHandlers(db: Database.Database): void {
  ipcMain.handle('material:list', (_e, practiceId: number) => listMaterials(db, practiceId))
  ipcMain.handle('material:add', (_e, data) => addMaterial(db, data))
  ipcMain.handle('material:delete', (_e, id: number) => deleteMaterial(db, id))
  ipcMain.handle('material:extract', async (_e, materialId: number, filePath: string) => {
    await assertExistingFile(filePath)
    const text = await extractText(filePath)
    await updateMaterialExtractedText(db, materialId, text)
    return text
  })
}

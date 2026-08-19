import { ipcMain } from 'electron'
import { listMaterials, addMaterial, updateMaterialExtractedText, deleteMaterial } from '../database/material'
import { getDb } from '../database/index'
import { extractText } from '../utils/file-extract'
import { assertExistingFile } from '../utils/paths'

export function registerMaterialHandlers(): void {
  ipcMain.handle('material:list', (_e, practiceId: number) => listMaterials(getDb(), practiceId))
  ipcMain.handle('material:add', (_e, data) => addMaterial(getDb(), data))
  ipcMain.handle('material:delete', (_e, id: number) => deleteMaterial(getDb(), id))
  ipcMain.handle('material:extract', async (_e, materialId: number, filePath: string) => {
    await assertExistingFile(filePath)
    const text = await extractText(filePath)
    await updateMaterialExtractedText(getDb(), materialId, text)
    return text
  })
}

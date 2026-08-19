import { ipcMain } from 'electron'
import { isConfigured, setApiKey } from '../ai/deepseek'

export function registerAiConfigHandlers(): void {
  ipcMain.handle('ai:config:get', () => ({ configured: isConfigured() }))
  ipcMain.handle('ai:config:set', (_e, key: string) => {
    setApiKey(key)
    return { configured: true }
  })
}

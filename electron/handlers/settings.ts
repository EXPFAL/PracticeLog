import { ipcMain } from 'electron'
import { getSettings, updateSettings, type AppSettings } from '../settings'
import { applyApiConfig } from '../ai/deepseek'

function toPublic(s: AppSettings) {
  return {
    theme: s.theme,
    apiBaseUrl: s.apiBaseUrl,
    apiModel: s.apiModel,
    apiKeyConfigured: !!s.apiKey
  }
}

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', () => toPublic(getSettings()))

  ipcMain.handle('settings:set', (_e, patch: Partial<Pick<AppSettings, 'theme' | 'apiBaseUrl' | 'apiModel' | 'apiKey'>>) => {
    const next = updateSettings(patch)
    if (patch.apiKey !== undefined || patch.apiBaseUrl !== undefined) applyApiConfig()
    return toPublic(next)
  })
}

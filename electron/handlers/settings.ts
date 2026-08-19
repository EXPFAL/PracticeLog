import { ipcMain } from 'electron'
import { getSettings, updateSettings, type AppSettings } from '../settings'
import { applyApiConfig } from '../ai/deepseek'

const ALLOWED_SETTING_KEYS = new Set<keyof AppSettings>(['theme', 'apiBaseUrl', 'apiModel', 'apiKey'])

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

  ipcMain.handle('settings:set', (_e, patch) => {
    // Whitelist keys at the IPC boundary so a renderer can't inject arbitrary settings.
    const safe: Partial<AppSettings> = {}
    for (const [k, v] of Object.entries(patch)) {
      if (ALLOWED_SETTING_KEYS.has(k as keyof AppSettings)) (safe as Record<string, unknown>)[k] = v
    }
    const next = updateSettings(safe)
    if (safe.apiKey !== undefined || safe.apiBaseUrl !== undefined) applyApiConfig()
    return toPublic(next)
  })
}

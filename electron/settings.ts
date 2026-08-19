import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'

export interface AppSettings {
  theme: 'dark' | 'light'
  apiBaseUrl: string
  apiModel: string
  apiKey: string
}

const DEFAULTS: AppSettings = {
  theme: 'light',
  apiBaseUrl: 'https://api.deepseek.com',
  apiModel: 'deepseek-chat',
  apiKey: ''
}

let cache: AppSettings | null = null

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

export function getSettings(): AppSettings {
  if (cache) return cache
  try {
    const raw = readFileSync(settingsPath(), 'utf-8')
    cache = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<AppSettings>) }
  } catch {
    cache = { ...DEFAULTS }
  }
  return cache
}

export function updateSettings(patch: Partial<AppSettings>): AppSettings {
  const next = { ...getSettings(), ...patch }
  mkdirSync(app.getPath('userData'), { recursive: true })
  writeFileSync(settingsPath(), JSON.stringify(next, null, 2), 'utf-8')
  cache = next
  return next
}

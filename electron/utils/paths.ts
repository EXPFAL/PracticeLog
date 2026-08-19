import { app } from 'electron'
import { join, isAbsolute } from 'path'
import { stat } from 'fs/promises'

export function getDataDir(): string {
  return app.isPackaged
    ? join(app.getPath('userData'), 'data')
    : join(app.getAppPath(), 'data')
}

export function getExportsDir(): string {
  return app.isPackaged
    ? join(app.getPath('userData'), 'exports')
    : join(app.getAppPath(), 'exports')
}

/** Guard renderer-supplied paths: must be an absolute existing file (defense in depth against a compromised renderer). */
export async function assertExistingFile(p: unknown): Promise<void> {
  if (typeof p !== 'string' || !isAbsolute(p)) throw new Error('无效的文件路径')
  const s = await stat(p).catch(() => null)
  if (!s?.isFile()) throw new Error('文件不存在: ' + p)
}

/** Guard renderer-supplied paths: must be an absolute existing directory. */
export async function assertExistingDir(p: unknown): Promise<void> {
  if (typeof p !== 'string' || !isAbsolute(p)) throw new Error('无效的文件夹路径')
  const s = await stat(p).catch(() => null)
  if (!s?.isDirectory()) throw new Error('文件夹不存在: ' + p)
}

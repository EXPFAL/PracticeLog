import { readFile } from 'fs/promises'
import { extname } from 'path'

export async function extractText(filePath: string): Promise<string> {
  const ext = extname(filePath).toLowerCase()
  if (ext === '.pdf') {
    const pdfParse = (await import('pdf-parse')).default
    const buffer = await readFile(filePath)
    const result = await pdfParse(buffer)
    return result.text
  }
  if (['.txt', '.md', '.rst', '.log', '.csv'].includes(ext)) {
    return await readFile(filePath, 'utf-8')
  }
  throw new Error(`不支持的文件类型: ${ext}。请使用 PDF 或纯文本文件（TXT/MD）。`)
}

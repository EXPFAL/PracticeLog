import { readFile } from 'fs/promises'
import { extname } from 'path'

async function extractPptxText(filePath: string): Promise<string> {
  const JSZip = (await import('jszip')).default
  const buffer = await readFile(filePath)
  const zip = await JSZip.loadAsync(buffer)

  const slideFiles = Object.keys(zip.files)
    .filter(f => f.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort()

  const texts: string[] = []
  for (const slideFile of slideFiles) {
    const xml = await zip.file(slideFile)!.async('string')
    // Extract text between <a:t> tags
    const matches = xml.match(/<a:t>([^<]*)<\/a:t>/g)
    if (matches) {
      const slideNum = slideFile.match(/slide(\d+)/)?.[1] ?? '?'
      const slideTexts = matches.map(m => m.replace(/<\/?a:t>/g, '').trim()).filter(Boolean)
      if (slideTexts.length > 0) {
        texts.push(`[幻灯片 ${slideNum}] ${slideTexts.join(' ')}`)
      }
    }
  }

  if (texts.length === 0) {
    throw new Error('未能从 PPT 中提取到文本内容')
  }
  return texts.join('\n\n')
}

export async function extractText(filePath: string): Promise<string> {
  const ext = extname(filePath).toLowerCase()
  if (ext === '.pdf') {
    const pdfParse = (await import('pdf-parse')).default
    const buffer = await readFile(filePath)
    const result = await pdfParse(buffer)
    return result.text
  }
  if (ext === '.pptx') {
    return extractPptxText(filePath)
  }
  if (['.txt', '.md', '.rst', '.log', '.csv'].includes(ext)) {
    return await readFile(filePath, 'utf-8')
  }
  throw new Error(`不支持的文件类型: ${ext}。支持的格式：PDF、PPTX、TXT、MD。`)
}

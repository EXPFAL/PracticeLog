/** Local calendar date helpers. Never use toISOString() for user-facing YYYY-MM-DD. */

export function formatLocalDate(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function timestampToLocalDate(ts: number): string {
  return formatLocalDate(new Date(ts))
}

export function localDateToTimestamp(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}

export function daysAgoLocal(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return formatLocalDate(d)
}

export type PracticeTab = 'today' | 'prepare' | 'review'

export function isPracticeTab(value: unknown): value is PracticeTab {
  return value === 'today' || value === 'prepare' || value === 'review'
}

export function inferPracticeTab(opts: {
  knowledgeCount: number
  logCount: number
  endDate: string | null
  hasArchive: boolean
}): PracticeTab {
  if (opts.knowledgeCount === 0 && opts.logCount === 0) return 'prepare'
  const today = formatLocalDate()
  if ((opts.endDate && today > opts.endDate) || opts.hasArchive) return 'review'
  return 'today'
}

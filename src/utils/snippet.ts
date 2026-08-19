export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;'
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '"': return '&quot;'
      default: return '&#39;'
    }
  })
}

/**
 * Render an FTS5 snippet() output safely. snippet() returns raw text with <b>
 * markers around matches and does NOT escape the content. Escape everything
 * first, then restore only the exact <b>/</b> markers so highlighting survives
 * while all other HTML (tags, event handlers) stays escaped.
 */
export function renderSnippet(raw: string): string {
  return escapeHtml(raw).replace(/&lt;b&gt;/g, '<b>').replace(/&lt;\/b&gt;/g, '</b>')
}

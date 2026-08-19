/** Build a safe FTS5 MATCH query from user terms: quote each term and double any embedded quotes (FTS5 escaping rule). */
export function buildFtsQuery(input: string): string {
  const terms = input.trim().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return ''
  return terms.map(w => `"${w.replace(/"/g, '""')}"`).join(' OR ')
}

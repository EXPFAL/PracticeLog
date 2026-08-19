import { describe, it, expect } from 'vitest'
import { buildFtsQuery } from '../electron/utils/fts'

describe('buildFtsQuery', () => {
  it('quotes each term and joins with OR', () => {
    expect(buildFtsQuery('vue electron')).toBe('"vue" OR "electron"')
  })

  it('trims surrounding whitespace', () => {
    expect(buildFtsQuery('  vue  ')).toBe('"vue"')
  })

  it('returns empty string for blank input', () => {
    expect(buildFtsQuery('')).toBe('')
    expect(buildFtsQuery('   ')).toBe('')
  })

  it('escapes embedded double quotes to prevent FTS query injection', () => {
    expect(buildFtsQuery('a" OR "DROP')).toBe('"a""" OR "OR" OR """DROP"')
    expect(buildFtsQuery('"')).toBe('""""')
  })
})

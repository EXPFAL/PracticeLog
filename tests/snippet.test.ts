import { describe, it, expect } from 'vitest'
import { escapeHtml, renderSnippet } from '../src/utils/snippet'

describe('escapeHtml', () => {
  it('escapes <, >, &, double and single quotes', () => {
    expect(escapeHtml(`<img src=x onerror="alert(1)" onmouseover='x'>`)).toBe(
      '&lt;img src=x onerror=&quot;alert(1)&quot; onmouseover=&#39;x&#39;&gt;'
    )
  })
})

describe('renderSnippet', () => {
  it('keeps the exact <b>/</b> highlight markers', () => {
    expect(renderSnippet('learning <b>Vue</b> today')).toBe('learning <b>Vue</b> today')
  })

  it('escapes HTML in event handlers attached to <b>', () => {
    const out = renderSnippet('<b onmouseover="alert(1)">x</b>')
    expect(out).toBe('&lt;b onmouseover=&quot;alert(1)&quot;&gt;x</b>')
    expect(out).not.toContain('<b onmouseover')
  })

  it('escapes script tags', () => {
    expect(renderSnippet('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;'
    )
  })

  it('never emits unescaped tags other than the exact <b>/</b> markers', () => {
    const out = renderSnippet('a <img src=x> <b>ok</b>')
    expect(out).toContain('&lt;img')
    expect(out).not.toContain('<img')
    expect(out).not.toContain('</script>')
  })
})

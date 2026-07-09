import { describe, expect, it } from 'vitest'
import { decodeArticleId, encodeArticleId } from '@/lib/articleRoute'

describe('article route encoding', () => {
  it.each([
    ['guardian id with slashes', 'guardian:technology/2026/jul/02/eu-ai-act'],
    ['newsapi id with a full URL', 'newsapi:https://example.com/story?utm=rss&x=1'],
    ['nyt id with a scheme', 'nytimes:nyt://article/1a2b-3c4d'],
    ['unicode title fallback', 'newsapi:https://example.com/über-straße'],
  ])('round-trips a %s', (_label, id) => {
    const encoded = encodeArticleId(id)

    // URL-path safe: no slashes, plus signs, or padding.
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(decodeArticleId(encoded)).toBe(id)
  })

  it('returns null for values that are not valid encodings', () => {
    expect(decodeArticleId('!!not-base64url!!')).toBeNull()
  })
})

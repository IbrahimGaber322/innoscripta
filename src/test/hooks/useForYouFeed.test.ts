import { describe, expect, it } from 'vitest'
import type { Article } from '@/domain/article'
import { matchesFollowedAuthor } from '@/hooks/useForYouFeed'

function articleBy(author?: string): Article {
  return {
    id: 'test:article',
    sourceId: 'guardian',
    sourceName: 'The Guardian',
    title: 'Test article',
    url: 'https://example.com/article',
    author,
    publishedAt: '2026-07-01T00:00:00Z',
  }
}

describe('matchesFollowedAuthor', () => {
  it('matches bylines case-insensitively', () => {
    expect(matchesFollowedAuthor(articleBy('Alex Hern'), ['alex hern'])).toBe(true)
  })

  it('matches an author inside a multi-author byline', () => {
    expect(
      matchesFollowedAuthor(articleBy('John Doe and Mary Johnson'), ['Mary Johnson']),
    ).toBe(true)
  })

  it('does not match different authors', () => {
    expect(matchesFollowedAuthor(articleBy('Alex Hern'), ['Jane Reporter'])).toBe(false)
  })

  it('never matches articles without a byline', () => {
    expect(matchesFollowedAuthor(articleBy(undefined), ['Alex Hern'])).toBe(false)
  })
})

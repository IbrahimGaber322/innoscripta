import { describe, expect, it } from 'vitest'
import type { Article } from '@/domain/article'
import type { Category } from '@/domain/category'
import { buildCategorySections } from '@/lib/categorySections'

function article(id: string, category?: Category): Article {
  return {
    id,
    sourceId: 'guardian',
    sourceName: 'The Guardian',
    title: id,
    url: `https://example.com/${id}`,
    publishedAt: '2026-07-01T00:00:00Z',
    category,
  }
}

describe('buildCategorySections', () => {
  it('groups articles into per-category sections, richest first', () => {
    const articles = [
      article('t1', 'technology'),
      article('s1', 'sports'),
      article('t2', 'technology'),
      article('s2', 'sports'),
      article('t3', 'technology'),
      article('s3', 'sports'),
      article('s4', 'sports'),
    ]

    const sections = buildCategorySections(articles, { minSize: 3, perSection: 3 })

    expect(sections.map((s) => s.category)).toEqual(['sports', 'technology'])
    expect(sections[0].articles).toHaveLength(3)
  })

  it('drops categories below the minimum size and uncategorized articles', () => {
    const articles = [
      article('t1', 'technology'),
      article('t2', 'technology'),
      article('t3', 'technology'),
      article('b1', 'business'),
      article('u1', undefined),
    ]

    const sections = buildCategorySections(articles, { minSize: 3 })

    expect(sections.map((s) => s.category)).toEqual(['technology'])
  })

  it('caps the number of sections', () => {
    const articles = (
      ['technology', 'sports', 'business', 'science', 'health'] as const
    ).flatMap((category) => [
      article(`${category}-1`, category),
      article(`${category}-2`, category),
      article(`${category}-3`, category),
    ])

    expect(buildCategorySections(articles, { maxSections: 2 })).toHaveLength(2)
  })
})

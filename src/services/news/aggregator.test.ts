import { describe, expect, it } from 'vitest'
import type { Article, ArticlePage, ArticleQuery, SourceId } from '../../domain/article'
import { fetchAggregated } from './aggregator'
import { ApiError } from './http'
import type { NewsSource } from './NewsSource'

const QUERY: ArticleQuery = { page: 1, pageSize: 20 }

function makeArticle(overrides: Partial<Article> & Pick<Article, 'id'>): Article {
  return {
    sourceId: 'newsapi',
    sourceName: 'Test Source',
    title: overrides.id,
    url: `https://example.com/${overrides.id}`,
    publishedAt: '2026-07-01T00:00:00Z',
    ...overrides,
  }
}

function makeSource(
  id: SourceId,
  result: ArticlePage | Error,
  options: {
    configured?: boolean
    categories?: NewsSource['capabilities']['categories']
  } = {},
): NewsSource {
  return {
    id,
    name: `${id} source`,
    capabilities: {
      categories: options.categories ?? ['general', 'technology'],
      dateFilter: true,
      dateFilterWithCategory: true,
    },
    isConfigured: () => options.configured ?? true,
    fetchArticles: () =>
      result instanceof Error ? Promise.reject(result) : Promise.resolve(result),
  }
}

function page(articles: Article[], hasMore = false): ArticlePage {
  return { articles, totalResults: articles.length, hasMore }
}

describe('fetchAggregated', () => {
  it('merges results from all sources sorted newest first', async () => {
    const older = makeArticle({ id: 'older', publishedAt: '2026-07-01T00:00:00Z' })
    const newer = makeArticle({ id: 'newer', publishedAt: '2026-07-05T00:00:00Z' })

    const result = await fetchAggregated(QUERY, [
      makeSource('newsapi', page([older])),
      makeSource('guardian', page([newer])),
    ])

    expect(result.articles.map((a) => a.id)).toEqual(['newer', 'older'])
    expect(result.errors).toEqual([])
  })

  it('isolates a failing source instead of failing the page', async () => {
    const article = makeArticle({ id: 'survives' })

    const result = await fetchAggregated(QUERY, [
      makeSource('newsapi', new ApiError('Request failed with status 429', 429)),
      makeSource('guardian', page([article])),
    ])

    expect(result.articles.map((a) => a.id)).toEqual(['survives'])
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({ sourceId: 'newsapi', status: 429 })
    expect(result.errors[0].message).toMatch(/rate limited/i)
  })

  it('reports unconfigured sources without calling them', async () => {
    const result = await fetchAggregated(QUERY, [
      makeSource('nytimes', new Error('should never be called'), {
        configured: false,
      }),
    ])

    expect(result.articles).toEqual([])
    expect(result.errors[0]).toMatchObject({
      sourceId: 'nytimes',
      message: expect.stringMatching(/no api key/i),
    })
  })

  it('skips sources that cannot serve the requested category', async () => {
    const article = makeArticle({ id: 'political' })

    const result = await fetchAggregated({ ...QUERY, category: 'politics' }, [
      makeSource('newsapi', new Error('should never be called'), {
        categories: ['general'],
      }),
      makeSource('guardian', page([article]), {
        categories: ['general', 'politics'],
      }),
    ])

    expect(result.articles.map((a) => a.id)).toEqual(['political'])
    expect(result.errors).toEqual([])
  })

  it('dedupes the same story arriving from two sources', async () => {
    const guardianCopy = makeArticle({
      id: 'guardian-copy',
      title: 'Shared Headline',
      url: 'https://www.theguardian.com/story?utm_source=rss',
    })
    const newsApiCopy = makeArticle({
      id: 'newsapi-copy',
      title: 'shared headline',
      url: 'https://www.theguardian.com/story',
    })

    const result = await fetchAggregated(QUERY, [
      makeSource('guardian', page([guardianCopy])),
      makeSource('newsapi', page([newsApiCopy])),
    ])

    expect(result.articles).toHaveLength(1)
  })

  it('has more pages while any source has more', async () => {
    const result = await fetchAggregated(QUERY, [
      makeSource('newsapi', page([makeArticle({ id: 'a' })], false)),
      makeSource('guardian', page([makeArticle({ id: 'b' })], true)),
    ])

    expect(result.hasMore).toBe(true)
  })
})

import { describe, expect, it, vi } from 'vitest'
import type { Article, ArticlePage, ArticleQuery, SourceId } from '@/domain/article'
import {
  fetchAcrossCategories,
  fetchAggregated,
  mergeAggregatedPages,
} from '@/services/news/aggregator'
import { ApiError } from '@/services/news/http'
import type { NewsSource } from '@/services/news/NewsSource'

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
    dateFilterWithCategory?: boolean
  } = {},
): NewsSource {
  return {
    id,
    name: `${id} source`,
    capabilities: {
      categories: options.categories ?? ['general', 'technology'],
      dateFilter: true,
      dateFilterWithCategory: options.dateFilterWithCategory ?? true,
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

  it('skips sources that cannot combine date and category filters', async () => {
    const article = makeArticle({ id: 'dated' })

    const result = await fetchAggregated(
      { ...QUERY, category: 'technology', fromDate: '2026-07-01' },
      [
        makeSource('newsapi', new Error('should never be called'), {
          dateFilterWithCategory: false,
        }),
        makeSource('guardian', page([article])),
      ],
    )

    expect(result.articles.map((a) => a.id)).toEqual(['dated'])
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

  it('orders articles newest-first, for browsing and keyword searches alike', async () => {
    const sources = [
      makeSource(
        'newsapi',
        page([
          makeArticle({ id: 'oldest', publishedAt: '2026-07-01T00:00:00Z' }),
          makeArticle({ id: 'newest', publishedAt: '2026-07-09T00:00:00Z' }),
        ]),
      ),
      makeSource(
        'guardian',
        page([makeArticle({ id: 'middle', publishedAt: '2026-07-05T00:00:00Z' })]),
      ),
    ]

    // Adapters already narrowed to relevant matches; the aggregator just
    // presents them newest-first, whether or not a keyword is set.
    const browse = await fetchAggregated(QUERY, sources)
    const search = await fetchAggregated({ ...QUERY, keyword: 'egypt' }, sources)

    expect(browse.articles.map((a) => a.id)).toEqual(['newest', 'middle', 'oldest'])
    expect(search.articles.map((a) => a.id)).toEqual(['newest', 'middle', 'oldest'])
  })
})

describe('fetchAggregated cursor pagination', () => {
  function cursorSource(
    id: SourceId,
    fetchArticles: NewsSource['fetchArticles'],
  ): NewsSource {
    return {
      id,
      name: `${id} source`,
      capabilities: {
        categories: ['general', 'technology'],
        dateFilter: false,
        dateFilterWithCategory: false,
        pagination: 'cursor',
      },
      isConfigured: () => true,
      fetchArticles,
    }
  }

  it('collects a cursor source’s nextCursor and reports hasMore', async () => {
    const source = cursorSource('newsdata', () =>
      Promise.resolve({
        articles: [makeArticle({ id: 'c1' })],
        totalResults: 1,
        hasMore: true,
        nextCursor: 'TOKEN2',
      }),
    )

    const result = await fetchAggregated(QUERY, [source])

    expect(result.hasMore).toBe(true)
    expect(result.nextCursors).toEqual({ '::newsdata': 'TOKEN2' })
  })

  it('queries a cursor source on the first page with no token', async () => {
    let receivedCursor: string | undefined = 'unset'
    const source = cursorSource('newsdata', (query) => {
      receivedCursor = query.cursor
      return Promise.resolve({ articles: [], totalResults: 0, hasMore: false })
    })

    await fetchAggregated(QUERY, [source], undefined, {})

    expect(receivedCursor).toBeUndefined()
  })

  it('passes the stored token to the source on the next page', async () => {
    let receivedCursor: string | undefined
    const source = cursorSource('newsdata', (query) => {
      receivedCursor = query.cursor
      return Promise.resolve({ articles: [], totalResults: 0, hasMore: false })
    })

    await fetchAggregated({ ...QUERY, page: 2 }, [source], undefined, {
      '::newsdata': 'TOKEN2',
    })

    expect(receivedCursor).toBe('TOKEN2')
  })

  it('marks a cursor source done once it stops returning a token', async () => {
    const source = cursorSource('newsdata', () =>
      Promise.resolve({
        articles: [makeArticle({ id: 'last' })],
        totalResults: 1,
        hasMore: false,
      }),
    )

    const result = await fetchAggregated(QUERY, [source])

    expect(result.hasMore).toBe(false)
    expect(result.nextDone).toEqual({ '::newsdata': true })
  })

  it('does not re-query a source already marked done, avoiding duplicates', async () => {
    const fetchArticles = vi.fn(() =>
      Promise.resolve({
        articles: [makeArticle({ id: 'dup' })],
        totalResults: 1,
        hasMore: false,
      }),
    )
    const source = cursorSource('newsdata', fetchArticles)

    const result = await fetchAggregated(
      { ...QUERY, page: 2 },
      [source],
      undefined,
      {},
      {
        '::newsdata': true,
      },
    )

    expect(fetchArticles).not.toHaveBeenCalled()
    expect(result.articles).toEqual([])
  })

  it('marks an exhausted offset source done so it is not refetched', async () => {
    const source = makeSource('newsapi', page([makeArticle({ id: 'end' })], false))

    const result = await fetchAggregated(QUERY, [source])

    expect(result.nextDone).toEqual({ '::newsapi': true })
  })

  it('retries a failed cursor source next page by carrying its token forward', async () => {
    const source = cursorSource('newsdata', () => Promise.reject(new Error('429')))

    const result = await fetchAggregated({ ...QUERY, page: 2 }, [source], undefined, {
      '::newsdata': 'TOKEN2',
    })

    // The token is preserved (retry next page) and the cell is NOT marked done.
    expect(result.nextCursors).toEqual({ '::newsdata': 'TOKEN2' })
    expect(result.nextDone['::newsdata']).toBeUndefined()
    expect(result.errors).toHaveLength(1)
  })

  it('does not keep the feed alive on a cursor source that returns no token', async () => {
    // hasMore:true but no nextCursor is contradictory; without a token the
    // source cannot continue, so it is finished rather than looping page one.
    const source = cursorSource('newsdata', () =>
      Promise.resolve({
        articles: [makeArticle({ id: 'x' })],
        totalResults: 1,
        hasMore: true,
      }),
    )

    const result = await fetchAggregated(QUERY, [source])

    expect(result.hasMore).toBe(false)
    expect(result.nextDone).toEqual({ '::newsdata': true })
  })
})

describe('mergeAggregatedPages', () => {
  it('merges pages deduped, newest first, with errors reported once', () => {
    const shared = makeArticle({ id: 'shared', publishedAt: '2026-07-05T00:00:00Z' })
    const older = makeArticle({ id: 'older', publishedAt: '2026-07-01T00:00:00Z' })
    const error = {
      sourceId: 'nytimes' as const,
      sourceName: 'nytimes source',
      message: 'rate limited',
    }

    const merged = mergeAggregatedPages([
      {
        articles: [shared],
        errors: [error],
        hasMore: false,
        nextCursors: {},
        nextDone: {},
      },
      {
        articles: [older, { ...shared }],
        errors: [error],
        hasMore: true,
        nextCursors: {},
        nextDone: {},
      },
    ])

    expect(merged.articles.map((a) => a.id)).toEqual(['shared', 'older'])
    expect(merged.errors).toEqual([error])
    expect(merged.hasMore).toBe(true)
  })

  it('unions the per-cell continuation tokens across categories', () => {
    const merged = mergeAggregatedPages([
      {
        articles: [],
        errors: [],
        hasMore: true,
        nextCursors: { 'technology::newsdata': 'T1' },
        nextDone: {},
      },
      {
        articles: [],
        errors: [],
        hasMore: true,
        nextCursors: { 'science::newsdata': 'S1' },
        nextDone: { 'science::guardian': true },
      },
    ])

    expect(merged.nextCursors).toEqual({
      'technology::newsdata': 'T1',
      'science::newsdata': 'S1',
    })
    expect(merged.nextDone).toEqual({ 'science::guardian': true })
  })

  it('returns an empty page for no input', () => {
    expect(mergeAggregatedPages([])).toEqual({
      articles: [],
      errors: [],
      hasMore: false,
      nextCursors: {},
      nextDone: {},
    })
  })
})

describe('fetchAcrossCategories', () => {
  /** A source that returns one article named after the requested category. */
  function categorySource(): NewsSource {
    return {
      id: 'guardian',
      name: 'guardian source',
      capabilities: {
        categories: ['general', 'technology', 'science'],
        dateFilter: true,
        dateFilterWithCategory: true,
      },
      isConfigured: () => true,
      fetchArticles: (query) =>
        Promise.resolve(page([makeArticle({ id: query.category ?? 'latest' })], true)),
    }
  }

  it('runs a single query with no category filter for an empty list', async () => {
    const result = await fetchAcrossCategories(QUERY, [], [categorySource()])

    expect(result.articles.map((a) => a.id)).toEqual(['latest'])
  })

  it('fans out one query per category and merges the results', async () => {
    const result = await fetchAcrossCategories(
      QUERY,
      ['technology', 'science'],
      [categorySource()],
    )

    expect(result.articles.map((a) => a.id).sort()).toEqual(['science', 'technology'])
    expect(result.hasMore).toBe(true)
  })
})

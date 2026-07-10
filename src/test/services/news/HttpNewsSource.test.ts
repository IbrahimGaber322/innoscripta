import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ArticlePage, ArticleQuery } from '@/domain/article'
import { HttpNewsSource, type SourceRequest } from '@/services/news/HttpNewsSource'
import type { SourceCapabilities } from '@/services/news/NewsSource'

interface FakeResponse {
  items: { title: string }[]
}

const CAPABILITIES: SourceCapabilities = {
  categories: ['general'],
  dateFilter: false,
  dateFilterWithCategory: false,
}

/**
 * A complete news source in ~15 lines: it declares its identity and implements
 * only the two hooks the base class leaves abstract. No fetch, error-handling,
 * or credential boilerplate — that all lives in HttpNewsSource. This is the
 * "adding a source is trivial" proof.
 */
class FakeSource extends HttpNewsSource<FakeResponse> {
  readonly id = 'fake'
  readonly name = 'Fake News'
  readonly capabilities = CAPABILITIES

  protected buildRequest(query: ArticleQuery): SourceRequest {
    return {
      url: `https://fake.test/search?q=${query.keyword ?? ''}&page=${query.page}`,
      headers: { 'X-Api-Key': this.apiKey ?? '' },
    }
  }

  protected parseResponse(raw: FakeResponse, query: ArticleQuery): ArticlePage {
    return {
      articles: raw.items.map((item, index) => ({
        id: `fake:${index}`,
        sourceId: this.id,
        sourceName: this.name,
        title: item.title,
        url: `https://fake.test/${index}`,
        publishedAt: '2026-07-10T00:00:00Z',
      })),
      totalResults: raw.items.length,
      hasMore: query.page < 2,
    }
  }
}

const QUERY: ArticleQuery = { keyword: 'ai', page: 1, pageSize: 10 }

function stubFetch(body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('HttpNewsSource', () => {
  it('reports configured only when a non-blank API key is present', () => {
    expect(new FakeSource('key').isConfigured()).toBe(true)
    expect(new FakeSource(undefined).isConfigured()).toBe(false)
    expect(new FakeSource('').isConfigured()).toBe(false)
  })

  it('runs buildRequest → getJson → parseResponse and passes auth headers', async () => {
    const fetchMock = stubFetch({ items: [{ title: 'Hello' }, { title: 'World' }] })

    const page = await new FakeSource('secret').fetchArticles(QUERY)

    // The URL and headers from buildRequest reach fetch unchanged.
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://fake.test/search?q=ai&page=1')
    expect(init.headers).toEqual({ 'X-Api-Key': 'secret' })

    // parseResponse output is returned as the domain page.
    expect(page.articles.map((article) => article.title)).toEqual(['Hello', 'World'])
    expect(page.totalResults).toBe(2)
    expect(page.hasMore).toBe(true)
  })

  it('forwards the abort signal to the fetch call', async () => {
    const fetchMock = stubFetch({ items: [] })
    const controller = new AbortController()

    await new FakeSource('k').fetchArticles(QUERY, controller.signal)

    expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal)
  })
})

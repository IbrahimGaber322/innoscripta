import { afterEach, describe, expect, it, vi } from 'vitest'

const importFresh = () => import('@/services/news/topHeadlines')

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('fetchTopHeadlines', () => {
  it('returns an empty list when the NewsAPI key is missing', async () => {
    vi.stubEnv('VITE_NEWSAPI_API_KEY', '')
    const { fetchTopHeadlines, canFetchTopHeadlines } = await importFresh()

    expect(canFetchTopHeadlines()).toBe(false)
    expect(await fetchTopHeadlines()).toEqual([])
  })

  it('maps and limits the ranked headlines when configured', async () => {
    vi.stubEnv('VITE_NEWSAPI_API_KEY', 'test-key')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            status: 'ok',
            totalResults: 2,
            articles: [
              {
                source: { id: null, name: 'BBC News' },
                author: null,
                title: 'Big story one',
                description: null,
                url: 'https://bbc.co.uk/1',
                urlToImage: null,
                publishedAt: '2026-07-10T00:00:00Z',
                content: null,
              },
              {
                source: { id: null, name: '[Removed]' },
                author: null,
                title: '[Removed]',
                description: null,
                url: 'https://removed.com',
                urlToImage: null,
                publishedAt: '2026-07-10T00:00:00Z',
                content: null,
              },
            ],
          }),
      }),
    )
    const { fetchTopHeadlines } = await importFresh()

    const headlines = await fetchTopHeadlines()

    // The "[Removed]" ghost entry is dropped by the shared NewsAPI mapper.
    expect(headlines.map((a) => a.title)).toEqual(['Big story one'])
    expect(headlines[0].sourceName).toBe('BBC News')
  })
})

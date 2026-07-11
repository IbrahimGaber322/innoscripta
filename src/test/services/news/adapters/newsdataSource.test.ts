import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildNewsdataRequestUrl,
  NewsdataSource,
} from '@/services/news/adapters/newsdata/newsdataSource'
import { mapNewsdataArticle } from '@/services/news/adapters/newsdata/mapArticle'
import type { NewsdataRawArticle } from '@/services/news/adapters/newsdata/types'

const rawArticle = {
  article_id: 'abc123',
  link: 'https://example.com/story',
  title: 'A headline',
  description: 'A summary',
  image_url: 'https://example.com/img.jpg',
  creator: ['Jane Doe'],
  pubDate: '2026-07-10 08:00:00',
} as unknown as NewsdataRawArticle

describe('buildNewsdataRequestUrl', () => {
  it('omits the page token on the first request', () => {
    const url = new URL(buildNewsdataRequestUrl({ page: 1, pageSize: 10 }))
    expect(url.searchParams.has('page')).toBe(false)
  })

  it('sends the cursor as the opaque page token on later requests', () => {
    const url = new URL(
      buildNewsdataRequestUrl({ page: 2, pageSize: 10, cursor: 'TOKEN2' }),
    )
    expect(url.searchParams.get('page')).toBe('TOKEN2')
  })

  it('never includes the API key', () => {
    expect(buildNewsdataRequestUrl({ page: 1, pageSize: 10 })).not.toContain('apikey')
  })
})

describe('NewsdataSource', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('declares cursor-based pagination', () => {
    expect(new NewsdataSource('key').capabilities.pagination).toBe('cursor')
  })

  it('is configured only with an API key', () => {
    expect(new NewsdataSource(undefined).isConfigured()).toBe(false)
    expect(new NewsdataSource('key').isConfigured()).toBe(true)
  })

  it('exposes nextPage as the page’s continuation cursor', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            status: 'success',
            totalResults: 42,
            nextPage: 'NEXT_TOKEN',
            results: [rawArticle],
          }),
      }),
    )

    const result = await new NewsdataSource('key').fetchArticles({
      page: 1,
      pageSize: 10,
    })

    expect(result.articles.map((a) => a.title)).toEqual(['A headline'])
    expect(result.hasMore).toBe(true)
    expect(result.nextCursor).toBe('NEXT_TOKEN')
  })

  it('reports no more pages when nextPage is null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            status: 'success',
            totalResults: 1,
            nextPage: null,
            results: [rawArticle],
          }),
      }),
    )

    const result = await new NewsdataSource('key').fetchArticles({
      page: 2,
      pageSize: 10,
      cursor: 'SOME_TOKEN',
    })

    expect(result.hasMore).toBe(false)
    expect(result.nextCursor).toBeUndefined()
  })
})

describe('mapNewsdataArticle', () => {
  it('maps a raw article into the domain shape', () => {
    const article = mapNewsdataArticle(rawArticle, 'technology')

    expect(article).toMatchObject({
      id: 'newsdata:abc123',
      sourceId: 'newsdata',
      sourceName: 'NewsData',
      title: 'A headline',
      url: 'https://example.com/story',
      imageUrl: 'https://example.com/img.jpg',
      author: 'Jane Doe',
      category: 'technology',
    })
  })

  it('maps Newsdata category slugs to the unified vocabulary', () => {
    const withCategory = { ...rawArticle, category: ['sports'] } as NewsdataRawArticle
    expect(mapNewsdataArticle(withCategory).category).toBe('sports')
  })

  it('falls back to the query category when no slug maps', () => {
    const unmapped = { ...rawArticle, category: ['lifestyle'] } as NewsdataRawArticle
    expect(mapNewsdataArticle(unmapped, 'world').category).toBe('world')
  })
})

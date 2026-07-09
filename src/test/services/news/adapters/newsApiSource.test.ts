import { describe, expect, it } from 'vitest'
import fixture from '@/test/fixtures/newsapi.everything.json'
import { mapNewsApiArticle } from '@/services/news/adapters/newsapi/mapArticle'
import { buildNewsApiRequestUrl } from '@/services/news/adapters/newsapi/newsApiSource'
import type { NewsApiResponse } from '@/services/news/adapters/newsapi/types'

const response = fixture as NewsApiResponse

describe('mapNewsApiArticle', () => {
  it('maps a raw article to the domain model', () => {
    const article = mapNewsApiArticle(response.articles[0], 'technology')

    expect(article).toEqual({
      id: 'newsapi:https://techcrunch.com/2026/07/01/ai-startups-record-funding/',
      sourceId: 'newsapi',
      sourceName: 'TechCrunch',
      title: 'AI startups raise record funding in 2026',
      description: 'Venture funding for AI companies reached new highs this quarter.',
      url: 'https://techcrunch.com/2026/07/01/ai-startups-record-funding/',
      imageUrl: 'https://techcrunch.com/images/ai-funding.jpg',
      author: 'Jane Smith',
      category: 'technology',
      publishedAt: '2026-07-01T14:30:00Z',
    })
  })

  it('drops "[Removed]" ghost entries', () => {
    expect(mapNewsApiArticle(response.articles[1])).toBeNull()
  })

  it('omits optional fields that the provider left empty', () => {
    const article = mapNewsApiArticle(response.articles[2])

    expect(article?.description).toBeUndefined()
    expect(article?.imageUrl).toBeUndefined()
    expect(article?.author).toBeUndefined()
    expect(article?.category).toBeUndefined()
  })
})

describe('buildNewsApiRequestUrl', () => {
  const base = { page: 1, pageSize: 20 }

  it('uses top-headlines when a category is selected', () => {
    const url = new URL(buildNewsApiRequestUrl({ ...base, category: 'business' }))

    expect(url.pathname).toBe('/v2/top-headlines')
    expect(url.searchParams.get('category')).toBe('business')
  })

  it('uses everything for keyword searches with date filters', () => {
    const url = new URL(
      buildNewsApiRequestUrl({
        ...base,
        keyword: 'climate',
        fromDate: '2026-07-01',
        toDate: '2026-07-09',
      }),
    )

    expect(url.pathname).toBe('/v2/everything')
    expect(url.searchParams.get('q')).toBe('climate')
    expect(url.searchParams.get('from')).toBe('2026-07-01')
    expect(url.searchParams.get('to')).toBe('2026-07-09')
  })

  it('falls back to a broad keyword for date-only filters', () => {
    const url = new URL(buildNewsApiRequestUrl({ ...base, fromDate: '2026-07-01' }))

    expect(url.pathname).toBe('/v2/everything')
    expect(url.searchParams.get('q')).toBe('news')
  })

  it('defaults to general top headlines when no filters are set', () => {
    const url = new URL(buildNewsApiRequestUrl(base))

    expect(url.pathname).toBe('/v2/top-headlines')
    expect(url.searchParams.get('category')).toBe('general')
  })

  it('never leaks the API key into the URL', () => {
    expect(buildNewsApiRequestUrl(base)).not.toContain('apiKey')
  })
})

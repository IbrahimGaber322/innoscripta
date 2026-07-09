import { afterEach, describe, expect, it, vi } from 'vitest'
import fixture from '../../../../test/fixtures/nytimes.articlesearch.json'
import { mapNytArticle } from './mapArticle'
import { buildNytRequestUrl, NytimesSource } from './nytimesSource'
import type { NytResponse } from './types'

const docs = (fixture as NytResponse).response.docs!

function stubFetch(body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
    }),
  )
}

describe('mapNytArticle', () => {
  it('maps a raw doc, prefixing legacy relative image URLs', () => {
    const article = mapNytArticle(docs[0])

    expect(article).toEqual({
      id: 'nytimes:nyt://article/1a2b3c4d',
      sourceId: 'nytimes',
      sourceName: 'The New York Times',
      title: 'Chip Makers Expand Global Manufacturing',
      description:
        'Semiconductor companies are expanding manufacturing capacity worldwide.',
      url: 'https://www.nytimes.com/2026/07/03/technology/chip-manufacturing.html',
      imageUrl:
        'https://www.nytimes.com/images/2026/07/03/technology/chips/chips-articleLarge.jpg',
      author: 'John Doe and Mary Johnson',
      category: 'technology',
      publishedAt: '2026-07-03T12:00:00+0000',
    })
  })

  it('reads absolute image URLs from the 2024+ multimedia schema', () => {
    const article = mapNytArticle(docs[1])

    expect(article.imageUrl).toBe(
      'https://static01.nyt.com/images/2026/07/02/business/markets/markets-superJumbo.jpg',
    )
  })

  it('strips the leading "By " from bylines and tolerates missing ones', () => {
    expect(mapNytArticle(docs[0]).author).toBe('John Doe and Mary Johnson')
    expect(mapNytArticle(docs[1]).author).toBeUndefined()
  })

  it('derives the category from the section name', () => {
    expect(mapNytArticle(docs[1]).category).toBe('business')
  })

  it('maps the U.S. Politics subsection to the politics category', () => {
    const article = mapNytArticle({
      ...docs[1],
      section_name: 'U.S.',
      subsection_name: 'Politics',
    })

    expect(article.category).toBe('politics')
  })
})

describe('buildNytRequestUrl', () => {
  const base = { page: 1, pageSize: 20 }

  it('converts 1-based domain pages to 0-based NYT pages', () => {
    const url = new URL(buildNytRequestUrl({ ...base, page: 3 }))

    expect(url.searchParams.get('page')).toBe('2')
  })

  it('reformats dates to YYYYMMDD', () => {
    const url = new URL(
      buildNytRequestUrl({ ...base, fromDate: '2026-07-01', toDate: '2026-07-09' }),
    )

    expect(url.searchParams.get('begin_date')).toBe('20260701')
    expect(url.searchParams.get('end_date')).toBe('20260709')
  })

  it('filters categories through a section.name fq query', () => {
    const url = new URL(buildNytRequestUrl({ ...base, category: 'world' }))

    expect(url.searchParams.get('fq')).toBe('section.name:"World"')
  })

  it('filters politics through the U.S. subsection', () => {
    const url = new URL(buildNytRequestUrl({ ...base, category: 'politics' }))

    expect(url.searchParams.get('fq')).toBe('subsection.name:"Politics"')
  })

  it('omits the fq filter for general browsing', () => {
    const url = new URL(buildNytRequestUrl({ ...base, category: 'general' }))

    expect(url.searchParams.get('fq')).toBeNull()
  })

  it('never includes the API key', () => {
    expect(buildNytRequestUrl(base)).not.toContain('api-key')
  })
})

describe('NytimesSource.fetchArticles', () => {
  const source = new NytimesSource('test-key')

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reads pagination from the current "metadata" field', async () => {
    stubFetch(fixture)

    const page = await source.fetchArticles({ page: 1, pageSize: 20 })

    expect(page.totalResults).toBe(42)
    expect(page.hasMore).toBe(true)
    expect(page.articles).toHaveLength(2)
  })

  it('still reads pagination from the legacy "meta" field', async () => {
    stubFetch({
      status: 'OK',
      response: { docs: [], meta: { hits: 3, offset: 0 } },
    })

    const page = await source.fetchArticles({ page: 1, pageSize: 20 })

    expect(page.totalResults).toBe(3)
    expect(page.hasMore).toBe(false)
  })

  it('tolerates a response with no pagination block at all', async () => {
    stubFetch({
      status: 'OK',
      response: { docs: (fixture as NytResponse).response.docs },
    })

    const page = await source.fetchArticles({ page: 1, pageSize: 20 })

    expect(page.totalResults).toBe(2)
    expect(page.hasMore).toBe(false)
  })

  it('treats the null docs returned for zero results as an empty page', async () => {
    stubFetch({
      status: 'OK',
      response: { docs: null, metadata: { hits: 0, offset: 0 } },
    })

    const page = await source.fetchArticles({ page: 1, pageSize: 20 })

    expect(page.articles).toEqual([])
    expect(page.totalResults).toBe(0)
    expect(page.hasMore).toBe(false)
  })
})

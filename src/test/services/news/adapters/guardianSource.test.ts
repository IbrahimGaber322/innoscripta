import { afterEach, describe, expect, it, vi } from 'vitest'
import itemFixture from '@/test/fixtures/guardian.item.json'
import fixture from '@/test/fixtures/guardian.search.json'
import {
  buildGuardianItemUrl,
  buildGuardianRequestUrl,
  GuardianSource,
} from '@/services/news/adapters/guardian/guardianSource'
import { mapGuardianArticle } from '@/services/news/adapters/guardian/mapArticle'
import type { GuardianResponse } from '@/services/news/adapters/guardian/types'

const { results } = (fixture as GuardianResponse).response

describe('mapGuardianArticle', () => {
  it('maps a raw article and strips HTML from the trail text', () => {
    const article = mapGuardianArticle(results[0])

    expect(article).toEqual({
      id: 'guardian:technology/2026/jul/02/eu-ai-act-enforcement',
      sourceId: 'guardian',
      sourceName: 'The Guardian',
      title: 'EU begins enforcing AI Act provisions',
      description:
        "Regulators start applying the bloc's landmark rules & companies scramble to comply",
      url: 'https://www.theguardian.com/technology/2026/jul/02/eu-ai-act-enforcement',
      imageUrl: 'https://media.guim.co.uk/eu-ai-act/500.jpg',
      author: 'Alex Hern',
      category: 'technology',
      publishedAt: '2026-07-02T08:45:00Z',
    })
  })

  it('falls back to the contributor tag when the byline field is missing', () => {
    const article = mapGuardianArticle(results[1])

    expect(article.author).toBe('Tumaini Carayol')
  })

  it('derives the category from the Guardian section', () => {
    expect(mapGuardianArticle(results[1]).category).toBe('sports')
  })
})

describe('buildGuardianRequestUrl', () => {
  const base = { page: 1, pageSize: 20 }

  it('requests the fields and tags needed for the domain model', () => {
    const url = new URL(buildGuardianRequestUrl(base))

    expect(url.searchParams.get('show-fields')).toBe('trailText,thumbnail,byline')
    expect(url.searchParams.get('show-tags')).toBe('contributor')
  })

  it('composes keyword, section, and date filters in one request', () => {
    const url = new URL(
      buildGuardianRequestUrl({
        ...base,
        keyword: 'climate',
        category: 'sports',
        fromDate: '2026-07-01',
        toDate: '2026-07-09',
      }),
    )

    expect(url.searchParams.get('q')).toBe('climate')
    expect(url.searchParams.get('section')).toBe('sport')
    expect(url.searchParams.get('from-date')).toBe('2026-07-01')
    expect(url.searchParams.get('to-date')).toBe('2026-07-09')
  })

  it('ranks by relevance for keyword searches and by recency otherwise', () => {
    expect(
      new URL(buildGuardianRequestUrl({ ...base, keyword: 'egypt' })).searchParams.get(
        'order-by',
      ),
    ).toBe('relevance')
    expect(new URL(buildGuardianRequestUrl(base)).searchParams.get('order-by')).toBe(
      'newest',
    )
  })

  it('never includes the API key', () => {
    expect(buildGuardianRequestUrl(base)).not.toContain('api-key')
  })
})

describe('GuardianSource.fetchFullArticle', () => {
  const source = new GuardianSource('test-key')

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('requests the article body on the item endpoint', () => {
    const url = new URL(buildGuardianItemUrl('technology/2026/jul/02/eu-ai-act'))

    expect(url.pathname).toBe('/technology/2026/jul/02/eu-ai-act')
    expect(url.searchParams.get('show-fields')).toContain('body')
  })

  it('resolves a domain id to the article with its full body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(itemFixture),
      }),
    )

    const full = await source.fetchFullArticle(
      'guardian:technology/2026/jul/02/eu-ai-act-enforcement',
    )

    expect(full?.article.title).toBe('EU begins enforcing AI Act provisions')
    expect(full?.bodyHtml).toContain('<h2>What changes now</h2>')
  })

  it('returns null for ids that belong to another source', async () => {
    expect(await source.fetchFullArticle('nytimes:nyt://article/123')).toBeNull()
  })
})

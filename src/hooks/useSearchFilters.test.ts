import { describe, expect, it } from 'vitest'
import { parseFilters, serializeFilters, type SearchFilters } from './useSearchFilters'

describe('parseFilters', () => {
  it('parses all supported params', () => {
    const filters = parseFilters(
      new URLSearchParams(
        'q=climate&categories=technology,science&sources=guardian,nytimes&from=2026-07-01&to=2026-07-09',
      ),
    )

    expect(filters).toEqual({
      keyword: 'climate',
      categories: ['technology', 'science'],
      sourceIds: ['guardian', 'nytimes'],
      fromDate: '2026-07-01',
      toDate: '2026-07-09',
    })
  })

  it('returns empty defaults for a blank URL', () => {
    expect(parseFilters(new URLSearchParams())).toEqual({
      keyword: '',
      categories: [],
      sourceIds: [],
      fromDate: undefined,
      toDate: undefined,
    })
  })

  it('drops invalid categories, sources, and dates', () => {
    const filters = parseFilters(
      new URLSearchParams(
        'categories=technology,nonsense&sources=guardian,not-a-source&from=07-01-2026&to=2026-7-9',
      ),
    )

    expect(filters.categories).toEqual(['technology'])
    expect(filters.sourceIds).toEqual(['guardian'])
    expect(filters.fromDate).toBeUndefined()
    expect(filters.toDate).toBeUndefined()
  })
})

describe('serializeFilters', () => {
  it('round-trips filters through the URL without loss', () => {
    const filters: SearchFilters = {
      keyword: 'ai',
      categories: ['science', 'health'],
      sourceIds: ['newsapi'],
      fromDate: '2026-06-01',
      toDate: undefined,
    }

    expect(parseFilters(serializeFilters(filters))).toEqual(filters)
  })

  it('omits empty values so the URL stays clean', () => {
    const params = serializeFilters({
      keyword: '',
      categories: [],
      sourceIds: [],
      fromDate: undefined,
      toDate: undefined,
    })

    expect(params.toString()).toBe('')
  })
})

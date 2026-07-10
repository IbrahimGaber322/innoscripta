import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { SourceId } from '../domain/article'
import { isCategory, type Category } from '../domain/category'
import { isValidISODate } from '../lib/formatDate'
import { isKnownSourceId } from '../services/news/registry'

/** Search and filter state for the article list. */
export interface SearchFilters {
  keyword: string
  /** Selected categories; empty means all. */
  categories: Category[]
  /** Selected sources; empty means all. */
  sourceIds: SourceId[]
  /** YYYY-MM-DD */
  fromDate?: string
  /** YYYY-MM-DD */
  toDate?: string
}

/** Parses URL params into validated filters; invalid values are dropped. */
export function parseFilters(params: URLSearchParams): SearchFilters {
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''

  return {
    keyword: params.get('q') ?? '',
    categories: (params.get('categories') ?? '').split(',').filter(isCategory),
    sourceIds: (params.get('sources') ?? '').split(',').filter(isKnownSourceId),
    fromDate: isValidISODate(from) ? from : undefined,
    toDate: isValidISODate(to) ? to : undefined,
  }
}

export function serializeFilters(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.keyword) params.set('q', filters.keyword)
  if (filters.categories.length > 0) {
    params.set('categories', filters.categories.join(','))
  }
  if (filters.sourceIds.length > 0) params.set('sources', filters.sourceIds.join(','))
  if (filters.fromDate) params.set('from', filters.fromDate)
  if (filters.toDate) params.set('to', filters.toDate)
  return params
}

/**
 * Filter state lives in the URL: searches are shareable and bookmarkable,
 * survive refreshes, and the back button walks through filter history.
 * Invalid parameter values are dropped during parsing.
 */
export function useSearchFilters() {
  const [params, setParams] = useSearchParams()

  const filters = useMemo(() => parseFilters(params), [params])

  const updateFilters = useCallback(
    (patch: Partial<SearchFilters>, options: { replace?: boolean } = {}) => {
      setParams((previous) => serializeFilters({ ...parseFilters(previous), ...patch }), {
        replace: options.replace,
      })
    },
    [setParams],
  )

  const clearFilters = useCallback(() => {
    setParams(new URLSearchParams())
  }, [setParams])

  const hasActiveFilters =
    filters.keyword !== '' ||
    filters.categories.length > 0 ||
    filters.sourceIds.length > 0 ||
    filters.fromDate !== undefined ||
    filters.toDate !== undefined

  return { filters, updateFilters, clearFilters, hasActiveFilters }
}

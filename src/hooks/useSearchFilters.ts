import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { isSourceId, type SourceId } from '../domain/article'
import { isCategory, type Category } from '../domain/category'

/** Search and filter state for the article list. */
export interface SearchFilters {
  keyword: string
  category?: Category
  /** Selected sources; empty means all. */
  sourceIds: SourceId[]
  /** YYYY-MM-DD */
  fromDate?: string
  /** YYYY-MM-DD */
  toDate?: string
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function parseFilters(params: URLSearchParams): SearchFilters {
  const category = params.get('category') ?? ''
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''

  return {
    keyword: params.get('q') ?? '',
    category: isCategory(category) ? category : undefined,
    sourceIds: (params.get('sources') ?? '').split(',').filter(isSourceId),
    fromDate: DATE_PATTERN.test(from) ? from : undefined,
    toDate: DATE_PATTERN.test(to) ? to : undefined,
  }
}

function serializeFilters(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.keyword) params.set('q', filters.keyword)
  if (filters.category) params.set('category', filters.category)
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
    filters.category !== undefined ||
    filters.sourceIds.length > 0 ||
    filters.fromDate !== undefined ||
    filters.toDate !== undefined

  return { filters, updateFilters, clearFilters, hasActiveFilters }
}

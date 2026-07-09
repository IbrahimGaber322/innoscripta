import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { fetchAcrossCategories } from '../services/news/aggregator'
import { getEffectiveSources } from '../services/news/registry'
import type { SearchFilters } from './useSearchFilters'

const PAGE_SIZE = 12

/** Infinite-scrolling aggregated article search for a set of filters. */
export function useArticleSearch(filters: SearchFilters) {
  const sources = useMemo(
    () => getEffectiveSources(filters.sourceIds),
    [filters.sourceIds],
  )

  return useInfiniteQuery({
    queryKey: ['articles', filters],
    queryFn: ({ pageParam, signal }) =>
      fetchAcrossCategories(
        {
          keyword: filters.keyword || undefined,
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          page: pageParam,
          pageSize: PAGE_SIZE,
        },
        filters.categories,
        sources,
        signal,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length + 1 : undefined,
    placeholderData: keepPreviousData,
  })
}

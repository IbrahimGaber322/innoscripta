import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { fetchAggregated } from '../services/news/aggregator'
import { ALL_SOURCES } from '../services/news/registry'
import type { SearchFilters } from './useSearchFilters'

export const PAGE_SIZE = 12

/** Infinite-scrolling aggregated article search for a set of filters. */
export function useArticleSearch(filters: SearchFilters) {
  const sources = useMemo(
    () =>
      filters.sourceIds.length === 0
        ? ALL_SOURCES
        : ALL_SOURCES.filter((source) => filters.sourceIds.includes(source.id)),
    [filters.sourceIds],
  )

  return useInfiniteQuery({
    queryKey: ['articles', filters],
    queryFn: ({ pageParam, signal }) =>
      fetchAggregated(
        {
          keyword: filters.keyword || undefined,
          category: filters.category,
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          page: pageParam,
          pageSize: PAGE_SIZE,
        },
        sources,
        signal,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length + 1 : undefined,
    placeholderData: keepPreviousData,
  })
}

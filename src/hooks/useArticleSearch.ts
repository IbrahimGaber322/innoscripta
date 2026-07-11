import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  fetchAcrossCategories,
  INITIAL_PAGE_PARAM,
  nextPageParam,
} from '../services/news/aggregator'
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
          page: pageParam.page,
          pageSize: PAGE_SIZE,
        },
        filters.categories,
        sources,
        signal,
        pageParam.cursors,
        pageParam.done,
      ),
    initialPageParam: INITIAL_PAGE_PARAM,
    getNextPageParam: nextPageParam,
    placeholderData: keepPreviousData,
  })
}

import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { ArticleQuery } from '../domain/article'
import {
  fetchAggregated,
  mergeAggregatedPages,
  type AggregatedPage,
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
    queryFn: async ({ pageParam, signal }): Promise<AggregatedPage> => {
      const query: ArticleQuery = {
        keyword: filters.keyword || undefined,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        page: pageParam,
        pageSize: PAGE_SIZE,
      }

      if (filters.categories.length === 0) {
        return fetchAggregated(query, sources, signal)
      }

      // Providers filter by one category per request, so multi-category
      // selections fan out and merge (deduped, newest first).
      const pages = await Promise.all(
        filters.categories.map((category) =>
          fetchAggregated({ ...query, category }, sources, signal),
        ),
      )
      return mergeAggregatedPages(pages)
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length + 1 : undefined,
    placeholderData: keepPreviousData,
  })
}

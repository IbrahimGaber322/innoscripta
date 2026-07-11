import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { Category } from '../domain/category'
import {
  fetchAcrossCategories,
  INITIAL_PAGE_PARAM,
  nextPageParam,
} from '../services/news/aggregator'
import { getEffectiveSources } from '../services/news/registry'
import type { SearchFilters } from './useSearchFilters'

const PAGE_SIZE = 12

/**
 * Topics the bare front page fans out across, so the magazine sections are
 * reliably populated even when the raw "latest" feed skews to breaking news.
 * Kept to four to stay within the providers' free-tier rate limits (notably
 * the NYT's ~5 requests/minute).
 */
const FRONT_PAGE_CATEGORIES: Category[] = ['world', 'business', 'technology', 'sports']

/** Infinite-scrolling aggregated article search for a set of filters. */
export function useArticleSearch(filters: SearchFilters) {
  const sources = useMemo(
    () => getEffectiveSources(filters.sourceIds),
    [filters.sourceIds],
  )

  // Fan out across a fixed spread of topics whenever the feed isn't narrowed by
  // keyword, category, or date — including when the only refinement is a source
  // filter — so the magazine sections stay populated. A keyword, category, or
  // date filter instead fetches exactly what the user asked for (a flat,
  // relevance/date-appropriate list).
  const spreadAcrossTopics =
    !filters.keyword &&
    filters.categories.length === 0 &&
    !filters.fromDate &&
    !filters.toDate
  const categories =
    filters.categories.length > 0
      ? filters.categories
      : spreadAcrossTopics
        ? FRONT_PAGE_CATEGORIES
        : []

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
        categories,
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

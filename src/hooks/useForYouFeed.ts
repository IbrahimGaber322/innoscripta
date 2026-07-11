import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { usePreferences } from './usePreferences'
import type { Article } from '../domain/article'
import {
  fetchAcrossCategories,
  INITIAL_PAGE_PARAM,
  mergeAggregatedPages,
  nextPageParam,
} from '../services/news/aggregator'
import type { SourceError } from '../services/news/NewsSource'
import { getEffectiveSources } from '../services/news/registry'

const FEED_PAGE_SIZE = 12

/** Cap parallel category queries to stay inside provider rate limits. */
const MAX_FEED_CATEGORIES = 4

export interface ForYouFeed {
  isPending: boolean
  /** Any request in flight, including a background refetch of loaded data. */
  isFetching: boolean
  /** Articles by followed authors, pinned above the rest. */
  followed: Article[]
  rest: Article[]
  errors: SourceError[]
  /** True when the user has not personalized anything yet. */
  isDefaultFeed: boolean
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
}

/**
 * Whether a followed author's name appears in the byline as a whole word —
 * so following "John" matches "John Roberts" but not "Johnson".
 */
export function matchesFollowedAuthor(article: Article, authors: string[]): boolean {
  // Defensive: an adapter should map `author` to a plain string, but a
  // misbehaving one (e.g. handing back a provider's raw array) must not crash
  // the whole feed — treat anything non-string as "no byline".
  if (typeof article.author !== 'string' || !article.author) {
    return false
  }
  const byline = article.author.toLowerCase()
  return authors.some((author) => {
    const name = author.trim().toLowerCase()
    if (!name) return false
    // Word-boundary match, escaping any regex-special characters in the name.
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(^|\\W)${escaped}(\\W|$)`).test(byline)
  })
}

/**
 * Builds the personalized feed: one aggregated query per preferred category
 * (or one general query when none are chosen), restricted to preferred
 * sources, paginated for infinite scroll. Followed authors partition the
 * merged result rather than filter it — a hard byline filter would usually
 * leave the page empty.
 */
export function useForYouFeed(): ForYouFeed {
  const { preferences } = usePreferences()

  const sources = useMemo(
    () => getEffectiveSources(preferences.sources),
    [preferences.sources],
  )

  // Drop categories none of the effective sources can serve (e.g. politics
  // with NewsAPI only); an unsupported-only selection falls back to latest
  // news instead of a guaranteed-empty feed.
  const preferred = useMemo(() => {
    const supported = new Set(sources.flatMap((source) => source.capabilities.categories))
    return preferences.categories
      .filter((category) => supported.has(category))
      .slice(0, MAX_FEED_CATEGORIES)
  }, [preferences.categories, sources])

  const query = useInfiniteQuery({
    // Authors are applied client-side, so they stay out of the query key.
    queryKey: ['for-you', preferences.sources, preferred],
    queryFn: ({ pageParam, signal }) =>
      fetchAcrossCategories(
        { page: pageParam.page, pageSize: FEED_PAGE_SIZE },
        preferred,
        sources,
        signal,
        pageParam.cursors,
        pageParam.done,
      ),
    initialPageParam: INITIAL_PAGE_PARAM,
    getNextPageParam: nextPageParam,
  })

  // Merge + partition only when the loaded pages or followed authors change.
  const pages = query.data?.pages
  const merged = useMemo(() => mergeAggregatedPages(pages ?? []), [pages])
  const { followed, rest } = useMemo(
    () => ({
      followed: merged.articles.filter((article) =>
        matchesFollowedAuthor(article, preferences.authors),
      ),
      rest: merged.articles.filter(
        (article) => !matchesFollowedAuthor(article, preferences.authors),
      ),
    }),
    [merged, preferences.authors],
  )

  const isDefaultFeed =
    preferences.sources.length === 0 &&
    preferences.categories.length === 0 &&
    preferences.authors.length === 0

  return {
    isPending: query.isPending,
    isFetching: query.isFetching,
    followed,
    rest,
    errors: merged.errors,
    isDefaultFeed,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  }
}

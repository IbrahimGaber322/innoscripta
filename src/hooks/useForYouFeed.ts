import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'
import { usePreferences } from '../components/preferences/usePreferences'
import { byNewestFirst, type Article } from '../domain/article'
import type { Category } from '../domain/category'
import { fetchAggregated } from '../services/news/aggregator'
import type { SourceError } from '../services/news/NewsSource'
import { ALL_SOURCES } from '../services/news/registry'

const FEED_PAGE_SIZE = 12

/** Cap parallel category queries to stay inside provider rate limits. */
const MAX_FEED_CATEGORIES = 4

export interface ForYouFeed {
  isPending: boolean
  /** Articles by followed authors, pinned above the rest. */
  followed: Article[]
  rest: Article[]
  errors: SourceError[]
  /** True when the user has not personalized anything yet. */
  isDefaultFeed: boolean
}

function matchesFollowedAuthor(article: Article, authors: string[]): boolean {
  if (!article.author) {
    return false
  }
  const byline = article.author.toLowerCase()
  return authors.some((author) => byline.includes(author.toLowerCase()))
}

/**
 * Builds the personalized feed: one aggregated query per preferred category
 * (or one general query when none are chosen), restricted to preferred
 * sources. Followed authors partition the merged result rather than filter
 * it — a hard byline filter would usually leave the page empty.
 */
export function useForYouFeed(): ForYouFeed {
  const { preferences } = usePreferences()

  const sources = useMemo(
    () =>
      preferences.sources.length === 0
        ? ALL_SOURCES
        : ALL_SOURCES.filter((source) => preferences.sources.includes(source.id)),
    [preferences.sources],
  )

  const categories: (Category | undefined)[] =
    preferences.categories.length > 0
      ? preferences.categories.slice(0, MAX_FEED_CATEGORIES)
      : [undefined]

  const results = useQueries({
    queries: categories.map((category) => ({
      queryKey: ['for-you', category ?? 'latest', preferences.sources],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchAggregated({ category, page: 1, pageSize: FEED_PAGE_SIZE }, sources, signal),
    })),
  })

  const isPending = results.some((result) => result.isPending)

  // Merging a few dozen articles is cheap enough to do on every render.
  const byId = new Map<string, Article>()
  const errorsBySource = new Map<string, SourceError>()

  for (const result of results) {
    for (const article of result.data?.articles ?? []) {
      // The same story can come back for two categories; keep one copy.
      byId.set(article.id, article)
    }
    for (const error of result.data?.errors ?? []) {
      errorsBySource.set(error.sourceId, error)
    }
  }

  const merged = [...byId.values()].sort(byNewestFirst)

  const followed = merged.filter((article) =>
    matchesFollowedAuthor(article, preferences.authors),
  )
  const rest = merged.filter(
    (article) => !matchesFollowedAuthor(article, preferences.authors),
  )
  const errors = [...errorsBySource.values()]

  const isDefaultFeed =
    preferences.sources.length === 0 &&
    preferences.categories.length === 0 &&
    preferences.authors.length === 0

  return { isPending, followed, rest, errors, isDefaultFeed }
}

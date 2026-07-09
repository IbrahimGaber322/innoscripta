import { byNewestFirst, type Article, type ArticleQuery } from '../../domain/article'
import type { Category } from '../../domain/category'
import { ApiError } from './http'
import type { NewsSource, SourceError } from './NewsSource'

/** The merged result of querying every eligible source. */
export interface AggregatedPage {
  /** Deduped and sorted by publication date, newest first. */
  articles: Article[]
  /** Sources that were skipped or failed; the page still renders. */
  errors: SourceError[]
  /** True while at least one source has more pages. */
  hasMore: boolean
}

/**
 * Cross-source duplicates are real: NewsAPI indexes theguardian.com and
 * nytimes.com, so the same story can arrive from two adapters. Articles are
 * considered duplicates when they share a URL (ignoring query strings) or a
 * case-insensitive title.
 */
function dedupeArticles(articles: Article[]): Article[] {
  const seenUrls = new Set<string>()
  const seenTitles = new Set<string>()
  const deduped: Article[] = []

  for (const article of articles) {
    const urlKey = article.url.split('?')[0]
    const titleKey = article.title.trim().toLowerCase()
    if (seenUrls.has(urlKey) || seenTitles.has(titleKey)) {
      continue
    }
    seenUrls.add(urlKey)
    seenTitles.add(titleKey)
    deduped.push(article)
  }

  return deduped
}

/**
 * Round-robin merge: first item of each group, then the second of each, and
 * so on. Preserves each source's own ranking while giving every source fair
 * representation near the top.
 */
function interleave<T>(groups: T[][]): T[] {
  const longest = Math.max(0, ...groups.map((group) => group.length))
  const result: T[] = []
  for (let i = 0; i < longest; i++) {
    for (const group of groups) {
      if (i < group.length) {
        result.push(group[i])
      }
    }
  }
  return result
}

/**
 * Merges several aggregated pages (e.g. one per selected category) into one:
 * deduped, newest first, with per-source errors reported once.
 */
export function mergeAggregatedPages(pages: AggregatedPage[]): AggregatedPage {
  const errorsBySource = new Map<string, SourceError>()
  for (const page of pages) {
    for (const error of page.errors) {
      errorsBySource.set(error.sourceId, error)
    }
  }

  return {
    articles: dedupeArticles(pages.flatMap((page) => page.articles)).sort(byNewestFirst),
    errors: [...errorsBySource.values()],
    hasMore: pages.some((page) => page.hasMore),
  }
}

function toSourceError(source: NewsSource, reason: unknown): SourceError {
  const status = reason instanceof ApiError ? reason.status : undefined

  let message = reason instanceof Error ? reason.message : 'Unexpected error'
  if (status === 401 || status === 403) {
    message = 'API key was rejected — check your configuration'
  } else if (status === 429) {
    message = 'Temporarily rate limited — results will return shortly'
  }

  return { sourceId: source.id, sourceName: source.name, message, status }
}

/**
 * Fans a query out to every eligible source and merges the results.
 * Failures are isolated per source: a provider being down, rate limited, or
 * unconfigured never breaks the page — it becomes a SourceError instead.
 */
export async function fetchAggregated(
  query: ArticleQuery,
  sources: NewsSource[],
  signal?: AbortSignal,
): Promise<AggregatedPage> {
  const errors: SourceError[] = []
  const eligible: NewsSource[] = []

  for (const source of sources) {
    if (!source.isConfigured()) {
      errors.push({
        sourceId: source.id,
        sourceName: source.name,
        message: 'No API key configured — source skipped',
      })
    } else if (
      query.category &&
      !source.capabilities.categories.includes(query.category)
    ) {
      // The source cannot filter by this category; skip it rather than
      // returning results that ignore the user's filter.
    } else if (
      query.category &&
      (query.fromDate || query.toDate) &&
      !source.capabilities.dateFilterWithCategory
    ) {
      // The source cannot combine date and category filters; skip it
      // rather than silently dropping the date constraint.
    } else {
      eligible.push(source)
    }
  }

  const settled = await Promise.allSettled(
    eligible.map((source) => source.fetchArticles(query, signal)),
  )

  const perSource: Article[][] = []
  let hasMore = false

  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      perSource.push(result.value.articles)
      hasMore = hasMore || result.value.hasMore
    } else {
      errors.push(toSourceError(eligible[index], result.reason))
    }
  })

  // Keyword searches: each source ranks by relevance, and those scores are
  // not comparable across providers — re-sorting by date would bury the best
  // matches. Interleave the ranked lists round-robin instead. Browsing has no
  // relevance signal, so recency ordering is the right default.
  const ordered = query.keyword
    ? dedupeArticles(interleave(perSource))
    : dedupeArticles(perSource.flat()).sort(byNewestFirst)

  return { articles: ordered, errors, hasMore }
}

/**
 * Runs a query once per category and merges the results. Providers filter by
 * one category per request, so a multi-category selection fans out here.
 * An empty category list runs a single query with no category filter.
 */
export async function fetchAcrossCategories(
  query: ArticleQuery,
  categories: readonly Category[],
  sources: NewsSource[],
  signal?: AbortSignal,
): Promise<AggregatedPage> {
  if (categories.length === 0) {
    return fetchAggregated(query, sources, signal)
  }

  const pages = await Promise.all(
    categories.map((category) =>
      fetchAggregated({ ...query, category }, sources, signal),
    ),
  )
  return mergeAggregatedPages(pages)
}

import type { Article, ArticleQuery } from '../../domain/article'
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

function byNewestFirst(a: Article, b: Article): number {
  return (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0)
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

  const articles: Article[] = []
  let hasMore = false

  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      articles.push(...result.value.articles)
      hasMore = hasMore || result.value.hasMore
    } else {
      errors.push(toSourceError(eligible[index], result.reason))
    }
  })

  return {
    articles: dedupeArticles(articles).sort(byNewestFirst),
    errors,
    hasMore,
  }
}

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
  /**
   * Continuation tokens for the next page, keyed per (category, source) cell —
   * only for cursor-paginated sources. Fed back as the next page's cursors.
   */
  nextCursors: Record<string, string>
  /**
   * Cells whose source has reached its end (offset source with no more pages,
   * or cursor source with no next token). Carried forward so a finished source
   * is not re-queried on later pages — which would waste requests and, for a
   * page-clamping API, re-append duplicate articles.
   */
  nextDone: Record<string, true>
}

/**
 * Pagination state for the infinite feed: a shared page number for
 * offset-paginated sources, a per-cell continuation token for cursor-paginated
 * ones, and the set of cells that have finished (see `cellKey`).
 */
export interface PageParam {
  page: number
  cursors: Record<string, string>
  done: Record<string, true>
}

export const INITIAL_PAGE_PARAM: PageParam = { page: 1, cursors: {}, done: {} }

/** Builds the next infinite-query page param, or stops when nothing has more. */
export function nextPageParam(
  lastPage: AggregatedPage,
  allPages: AggregatedPage[],
): PageParam | undefined {
  return lastPage.hasMore
    ? {
        page: allPages.length + 1,
        cursors: lastPage.nextCursors,
        done: lastPage.nextDone,
      }
    : undefined
}

/**
 * A pagination cell is one (category, source) pair: the same cursor source
 * queried for two categories keeps two independent continuation tokens.
 */
function cellKey(category: Category | undefined, sourceId: string): string {
  return `${category ?? ''}::${sourceId}`
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
    // Cell keys are namespaced by category, so per-category maps never collide.
    nextCursors: Object.assign({}, ...pages.map((page) => page.nextCursors)),
    nextDone: Object.assign({}, ...pages.map((page) => page.nextDone)),
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
  cursors: Record<string, string> = {},
  done: Record<string, true> = {},
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
    } else if ((query.fromDate || query.toDate) && !source.capabilities.dateFilter) {
      // The source cannot filter by date at all; skip it rather than returning
      // latest articles that ignore the requested date range.
    } else if (
      query.category &&
      (query.fromDate || query.toDate) &&
      !source.capabilities.dateFilterWithCategory
    ) {
      // The source cannot combine date and category filters; skip it
      // rather than silently dropping the date constraint.
    } else if (done[cellKey(query.category, source.id)]) {
      // This source already reached the end of this cell on an earlier page.
      // Re-querying it would waste a request and, for a page-clamping API,
      // re-append the same articles.
    } else {
      eligible.push(source)
    }
  }

  const settled = await Promise.allSettled(
    eligible.map((source) => {
      const sourceQuery =
        source.capabilities.pagination === 'cursor'
          ? { ...query, cursor: cursors[cellKey(query.category, source.id)] }
          : query
      return source.fetchArticles(sourceQuery, signal)
    }),
  )

  const articles: Article[] = []
  const nextCursors: Record<string, string> = {}
  // Carry forward cells finished on earlier pages so they stay skipped.
  const nextDone: Record<string, true> = { ...done }
  let hasMore = false

  settled.forEach((result, index) => {
    const source = eligible[index]
    const key = cellKey(query.category, source.id)
    const isCursor = source.capabilities.pagination === 'cursor'

    if (result.status === 'fulfilled') {
      articles.push(...result.value.articles)
      if (isCursor) {
        // A cursor source can only continue if it handed back a token.
        if (result.value.nextCursor) {
          nextCursors[key] = result.value.nextCursor
          hasMore = true
        } else {
          nextDone[key] = true
        }
      } else if (result.value.hasMore) {
        hasMore = true
      } else {
        nextDone[key] = true
      }
    } else {
      errors.push(toSourceError(source, result.reason))
      // A failure is not exhaustion: keep the source alive to retry on the next
      // page by carrying its cursor forward (offset sources retry via page + 1).
      // It resumes only if another source keeps the feed advancing.
      if (isCursor && cursors[key] !== undefined) {
        nextCursors[key] = cursors[key]
      }
    }
  })

  // Relevance is enforced per adapter: a keyword search asks each provider for
  // its best matches (not its newest articles), so everything returned here is
  // already on-topic. The merged set is then presented newest-first.
  return {
    articles: dedupeArticles(articles).sort(byNewestFirst),
    errors,
    hasMore,
    nextCursors,
    nextDone,
  }
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
  cursors: Record<string, string> = {},
  done: Record<string, true> = {},
): Promise<AggregatedPage> {
  if (categories.length === 0) {
    return fetchAggregated(query, sources, signal, cursors, done)
  }

  const pages = await Promise.all(
    categories.map((category) =>
      fetchAggregated({ ...query, category }, sources, signal, cursors, done),
    ),
  )
  return mergeAggregatedPages(pages)
}

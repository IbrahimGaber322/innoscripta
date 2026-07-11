import type { Category } from './category'

/**
 * Identifier of a news source (e.g. "guardian"). Deliberately a plain string,
 * not a fixed union: the set of real sources is defined by the registry at
 * runtime, which keeps the app source-agnostic. Validate an untrusted value
 * with `isKnownSourceId` from the registry, and resolve a display name with
 * `getSourceLabel`.
 */
export type SourceId = string

/** A news article normalized to a single shape, regardless of provider. */
export interface Article {
  /** Globally unique: `${sourceId}:${provider id or url}`. */
  id: string
  /** Which adapter produced the article. */
  sourceId: SourceId
  /** Human-readable publication name, e.g. "The Guardian". */
  sourceName: string
  title: string
  /** Plain-text summary; adapters strip any provider HTML. */
  description?: string
  /** Longer plain-text excerpt where the provider offers one. */
  content?: string
  url: string
  imageUrl?: string
  /** Normalized byline without a leading "By ". */
  author?: string
  /** Set when derivable from the query or the provider's section data. */
  category?: Category
  /** ISO 8601 timestamp. */
  publishedAt: string
}

/**
 * A provider-agnostic article query. Adapters translate it into
 * provider-specific request parameters (date formats, page offsets, ...).
 */
export interface ArticleQuery {
  keyword?: string
  category?: Category
  /** YYYY-MM-DD */
  fromDate?: string
  /** YYYY-MM-DD */
  toDate?: string
  /** 1-based; adapters convert for providers that paginate differently. */
  page: number
  /**
   * Opaque continuation token for cursor-paginated sources (e.g. Newsdata's
   * `nextPage`). Set by the aggregator from the previous page's `nextCursor`;
   * undefined on the first page. Offset-paginated sources ignore it and use
   * `page` instead. See `SourceCapabilities.pagination`.
   */
  cursor?: string
  /** Advisory; providers with fixed page sizes may ignore it. */
  pageSize: number
}

/** One page of results from a single source. */
export interface ArticlePage {
  articles: Article[]
  totalResults: number
  hasMore: boolean
  /**
   * Continuation token for the next page, for cursor-paginated sources. The
   * aggregator feeds it back as the next query's `cursor`. Offset sources omit
   * it and signal continuation through `hasMore` alone.
   */
  nextCursor?: string
}

/** Sort comparator: newest publication date first; unparsable dates last. */
export function byNewestFirst(a: Article, b: Article): number {
  return (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0)
}

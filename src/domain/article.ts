import type { Category } from './category'

/** Identifiers of the news sources bundled with the app. */
export const SOURCE_IDS = ['newsapi', 'guardian', 'nytimes'] as const

export type SourceId = (typeof SOURCE_IDS)[number]

export function isSourceId(value: string): value is SourceId {
  return (SOURCE_IDS as readonly string[]).includes(value)
}

/**
 * Display names for the aggregating sources — the things a user selects in
 * filters and preferences. Distinct from Article.sourceName, which for
 * NewsAPI is the underlying outlet (e.g. "TechCrunch").
 */
export const SOURCE_LABELS: Record<SourceId, string> = {
  newsapi: 'NewsAPI',
  guardian: 'The Guardian',
  nytimes: 'The New York Times',
}

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
  /** Advisory; providers with fixed page sizes may ignore it. */
  pageSize: number
}

/** One page of results from a single source. */
export interface ArticlePage {
  articles: Article[]
  totalResults: number
  hasMore: boolean
}

/** Sort comparator: newest publication date first; unparsable dates last. */
export function byNewestFirst(a: Article, b: Article): number {
  return (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0)
}

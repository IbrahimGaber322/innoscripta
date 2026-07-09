import type { ArticlePage, ArticleQuery, SourceId } from '../../domain/article'
import type { Category } from '../../domain/category'

/**
 * What a source can actually filter on. Providers differ (e.g. NewsAPI cannot
 * combine date and category filters), so adapters declare their capabilities
 * instead of the aggregator or UI guessing.
 */
export interface SourceCapabilities {
  /** Categories this source can be filtered by. */
  categories: readonly Category[]
  /** Whether the source supports from/to date filtering at all. */
  dateFilter: boolean
  /** Whether date and category filters can be combined in one request. */
  dateFilterWithCategory: boolean
}

/**
 * Contract every news provider adapter implements. The aggregator and the UI
 * depend only on this interface, so adding a provider means writing one
 * adapter and registering it — no consumer changes.
 */
export interface NewsSource {
  readonly id: SourceId
  readonly name: string
  readonly capabilities: SourceCapabilities
  /** False when the provider's API key is missing from the environment. */
  isConfigured(): boolean
  fetchArticles(query: ArticleQuery, signal?: AbortSignal): Promise<ArticlePage>
}

/** A per-source failure surfaced to the UI without failing the whole page. */
export interface SourceError {
  sourceId: SourceId
  sourceName: string
  message: string
  status?: number
}

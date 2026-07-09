import type { ArticlePage, ArticleQuery } from '../../../../domain/article'
import { CATEGORIES, type Category } from '../../../../domain/category'
import { buildUrl, getJson } from '../../http'
import type { NewsSource, SourceCapabilities } from '../../NewsSource'
import { mapGuardianArticle } from './mapArticle'
import type { GuardianResponse } from './types'

const BASE_URL = 'https://content.guardianapis.com/search'

/** Unified categories mapped to Guardian section ids. */
const CATEGORY_TO_SECTION: Record<Category, string> = {
  general: 'news',
  business: 'business',
  technology: 'technology',
  science: 'science',
  health: 'society',
  sports: 'sport',
  entertainment: 'culture',
  politics: 'politics',
  world: 'world',
}

/**
 * Builds the request URL for a query, without the API key.
 * The show-fields/show-tags params are required to receive the description,
 * thumbnail, and byline — the API omits them by default.
 */
export function buildGuardianRequestUrl(query: ArticleQuery): string {
  return buildUrl(BASE_URL, {
    q: query.keyword,
    section: query.category ? CATEGORY_TO_SECTION[query.category] : undefined,
    'from-date': query.fromDate,
    'to-date': query.toDate,
    page: query.page,
    'page-size': query.pageSize,
    'order-by': 'newest',
    'show-fields': 'trailText,thumbnail,byline',
    'show-tags': 'contributor',
  })
}

export class GuardianSource implements NewsSource {
  readonly id = 'guardian'
  readonly name = 'The Guardian'
  // All filters compose on the Guardian API, so every capability is on.
  readonly capabilities: SourceCapabilities = {
    categories: CATEGORIES,
    dateFilter: true,
    dateFilterWithCategory: true,
  }

  private readonly apiKey: string | undefined

  constructor(apiKey: string | undefined) {
    this.apiKey = apiKey
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey)
  }

  async fetchArticles(query: ArticleQuery, signal?: AbortSignal): Promise<ArticlePage> {
    const url = new URL(buildGuardianRequestUrl(query))
    url.searchParams.set('api-key', this.apiKey ?? '')

    const data = await getJson<GuardianResponse>(url.toString(), { signal })
    const { total, pages, currentPage, results } = data.response

    return {
      articles: results.map((raw) => mapGuardianArticle(raw, query.category)),
      totalResults: total,
      hasMore: currentPage < pages,
    }
  }
}

import type { ArticlePage, ArticleQuery } from '../../../../domain/article'
import { CATEGORIES, type Category } from '../../../../domain/category'
import { buildUrl, getJson } from '../../http'
import type { FullArticle, NewsSource, SourceCapabilities } from '../../NewsSource'
import { mapGuardianArticle } from './mapArticle'
import type { GuardianItemResponse, GuardianResponse } from './types'

const API_ORIGIN = 'https://content.guardianapis.com'
const BASE_URL = `${API_ORIGIN}/search`

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

/**
 * Builds the single-item URL for a Guardian content id, without the API key.
 * This is the only bundled provider whose API returns full article bodies.
 */
export function buildGuardianItemUrl(providerId: string): string {
  return buildUrl(`${API_ORIGIN}/${providerId}`, {
    'show-fields': 'trailText,thumbnail,byline,body',
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

  async fetchFullArticle(
    articleId: string,
    signal?: AbortSignal,
  ): Promise<FullArticle | null> {
    const providerId = articleId.startsWith(`${this.id}:`)
      ? articleId.slice(this.id.length + 1)
      : null
    if (!providerId) {
      return null
    }

    const url = new URL(buildGuardianItemUrl(providerId))
    url.searchParams.set('api-key', this.apiKey ?? '')

    const data = await getJson<GuardianItemResponse>(url.toString(), { signal })
    const content = data.response.content
    if (!content) {
      return null
    }

    return {
      article: mapGuardianArticle(content),
      bodyHtml: content.fields?.body,
    }
  }
}

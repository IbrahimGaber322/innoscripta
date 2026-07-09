import type { ArticlePage, ArticleQuery } from '../../../../domain/article'
import type { Category } from '../../../../domain/category'
import { buildUrl, getJson } from '../../http'
import type { NewsSource, SourceCapabilities } from '../../NewsSource'
import { mapNytArticle } from './mapArticle'
import type { NytResponse } from './types'

const BASE_URL = 'https://api.nytimes.com/svc/search/v2/articlesearch.json'

/** The Article Search API always returns 10 docs per page. */
export const NYT_PAGE_SIZE = 10

/** The API rejects page indexes beyond 100. */
const MAX_PAGE_INDEX = 100

/** Unified categories mapped to NYT news desk names used in fq filters. */
const CATEGORY_TO_NEWS_DESK: Partial<Record<Category, string>> = {
  business: 'Business',
  technology: 'Technology',
  science: 'Science',
  health: 'Health',
  sports: 'Sports',
  entertainment: 'Culture',
  politics: 'Politics',
  world: 'Foreign',
}

/** YYYY-MM-DD → YYYYMMDD, the format the NYT date params expect. */
function toNytDate(date: string | undefined): string | undefined {
  return date?.replaceAll('-', '')
}

/**
 * Builds the request URL for a query, without the API key.
 * NYT pages are 0-based, so the 1-based domain page is shifted down.
 */
export function buildNytRequestUrl(query: ArticleQuery): string {
  const newsDesk = query.category ? CATEGORY_TO_NEWS_DESK[query.category] : undefined

  return buildUrl(BASE_URL, {
    q: query.keyword,
    fq: newsDesk ? `news_desk:("${newsDesk}")` : undefined,
    begin_date: toNytDate(query.fromDate),
    end_date: toNytDate(query.toDate),
    page: Math.min(query.page - 1, MAX_PAGE_INDEX),
    sort: 'newest',
  })
}

export class NytimesSource implements NewsSource {
  readonly id = 'nytimes'
  readonly name = 'The New York Times'
  readonly capabilities: SourceCapabilities = {
    // "general" browsing works by omitting the fq filter entirely.
    categories: [
      'general',
      'business',
      'technology',
      'science',
      'health',
      'sports',
      'entertainment',
      'politics',
      'world',
    ],
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
    const url = new URL(buildNytRequestUrl(query))
    url.searchParams.set('api-key', this.apiKey ?? '')

    const data = await getJson<NytResponse>(url.toString(), { signal })
    const { docs } = data.response
    // The pagination block was renamed meta → metadata in the 2024 schema
    // revision; fall back to the page itself if neither is present.
    const meta = data.response.metadata ?? data.response.meta
    const hits = meta?.hits ?? docs.length

    return {
      articles: docs.map((raw) => mapNytArticle(raw, query.category)),
      totalResults: hits,
      hasMore: query.page * NYT_PAGE_SIZE < hits && query.page <= MAX_PAGE_INDEX,
    }
  }
}

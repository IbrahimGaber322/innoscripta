import type { ArticlePage, ArticleQuery } from '../../../../domain/article'
import type { Category } from '../../../../domain/category'
import { buildUrl } from '../../http'
import { HttpNewsSource, type SourceRequest } from '../../HttpNewsSource'
import type { SourceCapabilities } from '../../NewsSource'
import { mapNewsApiArticle } from './mapArticle'
import type { NewsApiResponse } from './types'

const BASE_URL = 'https://newsapi.org/v2'

/** Categories supported by NewsAPI's top-headlines endpoint. */
const SUPPORTED_CATEGORIES = [
  'general',
  'business',
  'technology',
  'science',
  'health',
  'sports',
  'entertainment',
] as const satisfies readonly Category[]

/**
 * Picks the endpoint and parameters for a query.
 *
 * NewsAPI splits its features across two endpoints:
 * - /top-headlines supports category filtering but not dates.
 * - /everything supports keyword and date filtering but requires a keyword
 *   and knows nothing about categories.
 *
 * Exported for tests; the URL never includes the API key (sent as a header).
 */
export function buildNewsApiRequestUrl(query: ArticleQuery): string {
  const { keyword, category, fromDate, toDate, page, pageSize } = query

  if (category) {
    return buildUrl(`${BASE_URL}/top-headlines`, {
      category,
      q: keyword,
      page,
      pageSize,
    })
  }

  if (keyword || fromDate || toDate) {
    return buildUrl(`${BASE_URL}/everything`, {
      // /everything rejects requests without a query, so date-only
      // filtering falls back to a broad keyword.
      q: keyword || 'news',
      from: fromDate,
      to: toDate,
      // Rank by match quality for keyword searches, by recency otherwise.
      sortBy: keyword ? 'relevancy' : 'publishedAt',
      language: 'en',
      page,
      pageSize,
    })
  }

  // No filters at all: latest general headlines (top-headlines requires
  // at least one of country, category, sources, or q).
  return buildUrl(`${BASE_URL}/top-headlines`, {
    category: 'general',
    page,
    pageSize,
  })
}

export class NewsApiSource extends HttpNewsSource<NewsApiResponse> {
  readonly id = 'newsapi'
  readonly name = 'NewsAPI'
  readonly capabilities: SourceCapabilities = {
    categories: SUPPORTED_CATEGORIES,
    dateFilter: true,
    dateFilterWithCategory: false,
  }

  protected buildRequest(query: ArticleQuery): SourceRequest {
    return {
      url: buildNewsApiRequestUrl(query),
      // NewsAPI takes the key as a header, keeping it out of the URL.
      headers: { 'X-Api-Key': this.apiKey ?? '' },
    }
  }

  protected parseResponse(data: NewsApiResponse, query: ArticleQuery): ArticlePage {
    const articles = data.articles
      .map((raw) => mapNewsApiArticle(raw, query.category))
      .filter((article) => article !== null)

    return {
      articles,
      totalResults: data.totalResults,
      hasMore: query.page * query.pageSize < data.totalResults,
    }
  }
}

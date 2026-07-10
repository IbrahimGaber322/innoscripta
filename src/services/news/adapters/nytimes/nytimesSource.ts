import type { ArticlePage, ArticleQuery } from '../../../../domain/article'
import type { Category } from '../../../../domain/category'
import { buildUrl } from '../../http'
import { HttpNewsSource, type SourceRequest } from '../../HttpNewsSource'
import type { SourceCapabilities } from '../../NewsSource'
import { mapNytArticle } from './mapArticle'
import type { NytResponse } from './types'

const BASE_URL = 'https://api.nytimes.com/svc/search/v2/articlesearch.json'

/** The Article Search API always returns 10 docs per page. */
export const NYT_PAGE_SIZE = 10

/** The API rejects page indexes beyond 100. */
const MAX_PAGE_INDEX = 100

/**
 * Unified categories mapped to fq filter queries. The current API filters on
 * `section.name` (politics is a subsection of U.S.); the legacy
 * `news_desk`/`section_name` field names silently match nothing.
 * Values verified against live responses.
 */
const CATEGORY_TO_FQ: Partial<Record<Category, string>> = {
  business: 'section.name:"Business"',
  technology: 'section.name:"Technology"',
  science: 'section.name:"Science"',
  health: 'section.name:"Health"',
  sports: 'section.name:"Sports"',
  entertainment: 'section.name:"Arts"',
  politics: 'subsection.name:"Politics"',
  world: 'section.name:"World"',
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
  return buildUrl(BASE_URL, {
    q: query.keyword,
    fq: query.category ? CATEGORY_TO_FQ[query.category] : undefined,
    begin_date: toNytDate(query.fromDate),
    end_date: toNytDate(query.toDate),
    page: Math.min(query.page - 1, MAX_PAGE_INDEX),
    // Rank by match quality for keyword searches, by recency otherwise.
    sort: query.keyword ? 'relevance' : 'newest',
  })
}

export class NytimesSource extends HttpNewsSource<NytResponse> {
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

  protected buildRequest(query: ArticleQuery): SourceRequest {
    const url = new URL(buildNytRequestUrl(query))
    url.searchParams.set('api-key', this.apiKey ?? '')
    return { url: url.toString() }
  }

  protected parseResponse(data: NytResponse, query: ArticleQuery): ArticlePage {
    // The API returns docs: null (not an empty array) for zero results.
    const docs = data.response.docs ?? []
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

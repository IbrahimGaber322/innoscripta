import type { ArticlePage, ArticleQuery } from '../../../../domain/article'
import { type Category } from '../../../../domain/category'
import { buildUrl } from '../../http'
import { HttpNewsSource, type SourceRequest } from '../../HttpNewsSource'
import type { SourceCapabilities } from '../../NewsSource'
import { mapNewsdataArticle } from './mapArticle'
import type { NewsdataResponse } from './types'

const BASE_URL = 'https://newsdata.io/api/1/latest'

const SUPPORTED_CATEGORIES = [
  'business',
  'entertainment',
  'health',
  'politics',
  'science',
  'sports',
  'technology',
  'world',
] as const satisfies readonly Category[]

export function buildNewsdataRequestUrl(query: ArticleQuery): string {
  return buildUrl(BASE_URL, {
    q: query.keyword,
    category: query.category,
    // Newsdata paginates by an opaque token (its `nextPage`), not a page
    // number. The aggregator supplies it as `query.cursor`; it is undefined on
    // the first request, and buildUrl then omits the `page` param entirely.
    page: query.cursor,
  })
}

export class NewsdataSource extends HttpNewsSource<NewsdataResponse> {
  readonly id = 'newsdata'
  readonly name = 'NewsData'

  readonly capabilities: SourceCapabilities = {
    categories: SUPPORTED_CATEGORIES,
    dateFilter: false,
    dateFilterWithCategory: false,
    pagination: 'cursor',
  }

  protected buildRequest(query: ArticleQuery): SourceRequest {
    const requestUrl = new URL(buildNewsdataRequestUrl(query))
    requestUrl.searchParams.set('apikey', this.apiKey ?? '')
    return { url: requestUrl.toString() }
  }

  protected parseResponse(data: NewsdataResponse, query: ArticleQuery): ArticlePage {
    return {
      articles: data.results.map((raw) => mapNewsdataArticle(raw, query.category)),
      totalResults: data.totalResults ?? data.results.length,
      hasMore: Boolean(data.nextPage),
      nextCursor: data.nextPage ?? undefined,
    }
  }
}

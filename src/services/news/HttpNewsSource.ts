import type { ArticlePage, ArticleQuery, SourceId } from '../../domain/article'
import { getJson } from './http'
import type { NewsSource, SourceCapabilities } from './NewsSource'

/** A provider request: the URL plus any auth headers the provider needs. */
export interface SourceRequest {
  url: string
  headers?: Record<string, string>
}

/**
 * Base class for HTTP/JSON news providers. It owns everything every adapter
 * shares — credential storage, `isConfigured()`, and the fetch → map flow — so a
 * concrete source only declares its identity and capabilities and implements two
 * hooks: `buildRequest` (turn a query into a URL + headers) and `parseResponse`
 * (turn the raw envelope into a domain page).
 *
 * Adding a source therefore means subclassing this and writing those two
 * methods plus a mapper — no fetch, error-handling, or credential boilerplate.
 */
export abstract class HttpNewsSource<RawResponse> implements NewsSource {
  abstract readonly id: SourceId
  abstract readonly name: string
  abstract readonly capabilities: SourceCapabilities

  protected readonly apiKey: string | undefined

  constructor(apiKey: string | undefined) {
    this.apiKey = apiKey
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey)
  }

  async fetchArticles(query: ArticleQuery, signal?: AbortSignal): Promise<ArticlePage> {
    const { url, headers } = this.buildRequest(query)
    const raw = await getJson<RawResponse>(url, { headers, signal })
    return this.parseResponse(raw, query)
  }

  /**
   * Provider-specific: build the request for a query, placing the API key
   * wherever the provider expects it (a query param or an auth header).
   */
  protected abstract buildRequest(query: ArticleQuery): SourceRequest

  /** Provider-specific: turn the raw response envelope into a domain page. */
  protected abstract parseResponse(raw: RawResponse, query: ArticleQuery): ArticlePage
}

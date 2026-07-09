import { getApiKey } from '../../config/env'
import type { Article } from '../../domain/article'
import { mapNewsApiArticle } from './adapters/newsapi/mapArticle'
import type { NewsApiResponse } from './adapters/newsapi/types'
import { buildUrl, getJson } from './http'

const ENDPOINT = 'https://newsapi.org/v2/top-headlines'

/** The "top headlines" box needs the NewsAPI key to load. */
export function canFetchTopHeadlines(): boolean {
  return Boolean(getApiKey('newsapi'))
}

/**
 * The day's biggest headlines across NewsAPI's outlets — a real, ranked list
 * powering the front-page "Top headlines" box. Returns an empty list when the
 * NewsAPI key is not configured.
 */
export async function fetchTopHeadlines(
  limit = 6,
  signal?: AbortSignal,
): Promise<Article[]> {
  const apiKey = getApiKey('newsapi')
  if (!apiKey) {
    return []
  }

  const url = buildUrl(ENDPOINT, {
    language: 'en',
    category: 'general',
    pageSize: limit,
  })
  const data = await getJson<NewsApiResponse>(url, {
    headers: { 'X-Api-Key': apiKey },
    signal,
  })

  return data.articles
    .map((raw) => mapNewsApiArticle(raw))
    .filter((article): article is Article => article !== null)
    .slice(0, limit)
}

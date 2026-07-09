import type { Article } from '../../../../domain/article'
import type { Category } from '../../../../domain/category'
import type { NytDoc } from './types'

/** NYT news desks mapped back to the unified category vocabulary. */
const NEWS_DESK_TO_CATEGORY: Record<string, Category> = {
  Business: 'business',
  Technology: 'technology',
  Science: 'science',
  Health: 'health',
  Sports: 'sports',
  Culture: 'entertainment',
  Politics: 'politics',
  Foreign: 'world',
}

/**
 * Resolves an image URL across both NYT multimedia schemas: the legacy
 * array carries site-relative paths, the 2024+ object carries absolute URLs.
 */
function resolveImageUrl(multimedia: NytDoc['multimedia']): string | undefined {
  if (!multimedia) {
    return undefined
  }

  if (Array.isArray(multimedia)) {
    const url = multimedia.find((media) => media.url)?.url
    if (!url) {
      return undefined
    }
    return url.startsWith('http') ? url : `https://www.nytimes.com/${url}`
  }

  return multimedia.default?.url ?? multimedia.thumbnail?.url
}

export function mapNytArticle(raw: NytDoc, fallbackCategory?: Category): Article {
  return {
    id: `nytimes:${raw._id}`,
    sourceId: 'nytimes',
    sourceName: 'The New York Times',
    title: raw.headline.main,
    description: raw.abstract?.trim() || raw.snippet?.trim() || undefined,
    url: raw.web_url,
    imageUrl: resolveImageUrl(raw.multimedia),
    author: raw.byline?.original?.replace(/^by\s+/i, '').trim() || undefined,
    category: (raw.news_desk && NEWS_DESK_TO_CATEGORY[raw.news_desk]) || fallbackCategory,
    publishedAt: raw.pub_date,
  }
}

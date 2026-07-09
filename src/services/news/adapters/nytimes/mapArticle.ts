import type { Article } from '../../../../domain/article'
import type { Category } from '../../../../domain/category'
import type { NytDoc } from './types'

/** NYT section names mapped back to the unified category vocabulary. */
const SECTION_TO_CATEGORY: Record<string, Category> = {
  Business: 'business',
  Technology: 'technology',
  Science: 'science',
  Health: 'health',
  Sports: 'sports',
  Arts: 'entertainment',
  World: 'world',
}

function resolveCategory(raw: NytDoc): Category | undefined {
  // Politics is a subsection of U.S. in the NYT taxonomy.
  if (raw.subsection_name === 'Politics') {
    return 'politics'
  }
  return raw.section_name ? SECTION_TO_CATEGORY[raw.section_name] : undefined
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
    content: raw.lead_paragraph?.trim() || undefined,
    url: raw.web_url,
    imageUrl: resolveImageUrl(raw.multimedia),
    author: raw.byline?.original?.replace(/^by\s+/i, '').trim() || undefined,
    category: resolveCategory(raw) ?? fallbackCategory,
    publishedAt: raw.pub_date,
  }
}

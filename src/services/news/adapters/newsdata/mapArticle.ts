import type { Article } from '../../../../domain/article'
import type { Category } from '../../../../domain/category'
import type { NewsdataRawArticle } from './types'

/** Newsdata category slugs mapped to the app's unified vocabulary. */
const CATEGORY_MAP: Record<string, Category> = {
  business: 'business',
  entertainment: 'entertainment',
  environment: 'science',
  health: 'health',
  politics: 'politics',
  science: 'science',
  sports: 'sports',
  technology: 'technology',
  top: 'general',
  world: 'world',
}

/** First of Newsdata's category slugs that maps to a unified category. */
function mapCategory(slugs: string[] | null): Category | undefined {
  for (const slug of slugs ?? []) {
    const mapped = CATEGORY_MAP[slug]
    if (mapped) return mapped
  }
  return undefined
}

export function mapNewsdataArticle(
  raw: NewsdataRawArticle,
  fallbackCategory?: Category,
): Article {
  return {
    id: `newsdata:${raw.article_id}`,
    sourceId: 'newsdata',
    sourceName: 'NewsData',
    title: raw.title,
    description: raw.description,
    url: raw.link,
    imageUrl: raw.image_url ?? undefined,
    // Newsdata returns `creator` as an array of names (or null); the domain
    // model wants a single plain-text byline.
    author: raw.creator?.join(', ') || undefined,
    // Newsdata tags each article with its own category slugs; map them to the
    // unified vocabulary so they populate the front-page sections.
    category: mapCategory(raw.category) ?? fallbackCategory,
    publishedAt: raw.pubDate ?? undefined,
  }
}

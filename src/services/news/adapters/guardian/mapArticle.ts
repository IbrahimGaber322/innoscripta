import type { Article } from '../../../../domain/article'
import type { Category } from '../../../../domain/category'
import type { GuardianArticle } from './types'

/** Guardian section ids mapped back to the unified category vocabulary. */
const SECTION_TO_CATEGORY: Record<string, Category> = {
  news: 'general',
  business: 'business',
  technology: 'technology',
  science: 'science',
  society: 'health',
  sport: 'sports',
  culture: 'entertainment',
  politics: 'politics',
  world: 'world',
}

/** The trailText field is HTML; the domain model wants plain text. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

export function mapGuardianArticle(
  raw: GuardianArticle,
  fallbackCategory?: Category,
): Article {
  const contributor = raw.tags?.find((tag) => tag.type === 'contributor')

  return {
    id: `guardian:${raw.id}`,
    sourceId: 'guardian',
    sourceName: 'The Guardian',
    title: raw.webTitle,
    description: raw.fields?.trailText ? stripHtml(raw.fields.trailText) : undefined,
    url: raw.webUrl,
    imageUrl: raw.fields?.thumbnail,
    author: raw.fields?.byline || contributor?.webTitle || undefined,
    category: (raw.sectionId && SECTION_TO_CATEGORY[raw.sectionId]) || fallbackCategory,
    publishedAt: raw.webPublicationDate,
  }
}

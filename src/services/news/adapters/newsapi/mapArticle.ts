import type { Article } from '../../../../domain/article'
import type { Category } from '../../../../domain/category'
import type { NewsApiArticle } from './types'

/**
 * Maps a raw NewsAPI article to the domain model.
 * Returns null for the "[Removed]" ghost entries NewsAPI leaves in place of
 * withdrawn articles, and for entries missing the essentials.
 */
/** NewsAPI truncates content and appends e.g. "… [+1234 chars]". */
function cleanContent(content: string | null): string | undefined {
  const cleaned = content?.replace(/\s*\[\+\d+ chars\]$/, '').trim()
  return cleaned || undefined
}

export function mapNewsApiArticle(
  raw: NewsApiArticle,
  category?: Category,
): Article | null {
  if (!raw.url || !raw.title || raw.title === '[Removed]') {
    return null
  }

  return {
    id: `newsapi:${raw.url}`,
    sourceId: 'newsapi',
    sourceName: raw.source.name || 'NewsAPI',
    title: raw.title,
    description: raw.description?.trim() || undefined,
    content: cleanContent(raw.content),
    url: raw.url,
    imageUrl: raw.urlToImage ?? undefined,
    author: raw.author?.trim() || undefined,
    // NewsAPI responses carry no category, so it comes from the query.
    category,
    publishedAt: raw.publishedAt ?? new Date().toISOString(),
  }
}

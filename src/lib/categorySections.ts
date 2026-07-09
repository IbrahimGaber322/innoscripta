import type { Article } from '../domain/article'
import type { Category } from '../domain/category'

export interface CategorySectionData {
  category: Category
  articles: Article[]
}

interface Options {
  /** Articles shown per section (the rest are "view all"). */
  perSection?: number
  /** Minimum articles a category needs to earn its own section. */
  minSize?: number
  /** Cap on how many sections to render. */
  maxSections?: number
}

/**
 * Groups a flat article list into per-category sections, richest first.
 * Only categories with enough articles get a section; the rest of the feed
 * is shown elsewhere (e.g. an "earlier" grid), so nothing is dropped.
 */
export function buildCategorySections(
  articles: Article[],
  { perSection = 3, minSize = 3, maxSections = 4 }: Options = {},
): CategorySectionData[] {
  const byCategory = new Map<Category, Article[]>()
  for (const article of articles) {
    if (!article.category) continue
    const bucket = byCategory.get(article.category)
    if (bucket) {
      bucket.push(article)
    } else {
      byCategory.set(article.category, [article])
    }
  }

  return [...byCategory.entries()]
    .filter(([, bucket]) => bucket.length >= minSize)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, maxSections)
    .map(([category, bucket]) => ({ category, articles: bucket.slice(0, perSection) }))
}

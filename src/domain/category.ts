/**
 * Unified category vocabulary shared by every news source.
 * Each adapter maps these to its provider-specific taxonomy and declares
 * which ones it supports via `NewsSource.capabilities.categories`.
 */
export const CATEGORIES = [
  'general',
  'business',
  'technology',
  'science',
  'health',
  'sports',
  'entertainment',
  'politics',
  'world',
] as const

export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_LABELS: Record<Category, string> = {
  general: 'General',
  business: 'Business',
  technology: 'Technology',
  science: 'Science',
  health: 'Health',
  sports: 'Sports',
  entertainment: 'Entertainment',
  politics: 'Politics',
  world: 'World',
}

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value)
}

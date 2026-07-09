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

/**
 * Editorial accent colour for each category's section header, echoing the
 * design (Sport green, Technology blue, Culture purple, ...).
 */
export const CATEGORY_COLORS: Record<Category, string> = {
  general: '#111110',
  business: '#B45309',
  technology: '#1D4ED8',
  science: '#0F766E',
  health: '#BE185D',
  sports: '#1B7A4E',
  entertainment: '#6D28D9',
  politics: '#9F1239',
  world: '#0369A1',
}

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value)
}

import type { SourceId } from './article'
import type { Category } from './category'

/** User preferences that shape the personalized "For You" feed. */
export interface Preferences {
  /** Preferred sources; empty means all sources. */
  sources: SourceId[]
  /** Preferred categories; empty means latest general news. */
  categories: Category[]
  /** Followed author names, matched case-insensitively against bylines. */
  authors: string[]
}

export const DEFAULT_PREFERENCES: Preferences = {
  sources: [],
  categories: [],
  authors: [],
}

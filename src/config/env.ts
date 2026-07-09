import type { SourceId } from '../domain/article'

const API_KEYS: Record<SourceId, string | undefined> = {
  newsapi: import.meta.env.VITE_NEWSAPI_API_KEY,
  guardian: import.meta.env.VITE_GUARDIAN_API_KEY,
  nytimes: import.meta.env.VITE_NYT_API_KEY,
}

/**
 * Returns the API key for a source, or undefined when it is not configured.
 * Sources without a key are skipped by the aggregator and flagged in the UI.
 */
export function getApiKey(sourceId: SourceId): string | undefined {
  const key = API_KEYS[sourceId]?.trim()
  return key || undefined
}

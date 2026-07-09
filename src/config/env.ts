import type { SourceId } from '../domain/article'

// SECURITY: every VITE_* variable is inlined into the client bundle at build
// time, so these keys are visible to anyone who loads the app. That is fine for
// a local/free-tier take-home; a real deployment must proxy the providers
// server-side and keep the keys off the client (see README, "Known limitations").
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

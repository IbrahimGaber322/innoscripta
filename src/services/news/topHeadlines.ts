import type { Article } from '../../domain/article'
import { ALL_SOURCES } from './registry'

/** The first configured source that can supply a ranked headlines list. */
function topHeadlinesSource() {
  return ALL_SOURCES.find((source) => source.isConfigured() && source.fetchTopHeadlines)
}

/** True when some installed source can power the "top headlines" box. */
export function canFetchTopHeadlines(): boolean {
  return topHeadlinesSource() !== undefined
}

/**
 * The day's biggest headlines for the front-page "Top headlines" box, taken
 * from the first installed source that exposes a cross-outlet ranking
 * (`fetchTopHeadlines`). Returns an empty list when no such source is
 * configured — the box then simply hides.
 */
export async function fetchTopHeadlines(
  limit = 6,
  signal?: AbortSignal,
): Promise<Article[]> {
  const source = topHeadlinesSource()
  if (!source?.fetchTopHeadlines) {
    return []
  }
  return source.fetchTopHeadlines(limit, signal)
}

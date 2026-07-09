import { getApiKey } from '../../config/env'
import type { SourceId } from '../../domain/article'
import { GuardianSource } from './adapters/guardian/guardianSource'
import { NewsApiSource } from './adapters/newsapi/newsApiSource'
import { NytimesSource } from './adapters/nytimes/nytimesSource'
import type { NewsSource } from './NewsSource'

/**
 * Every news source bundled with the app.
 * Adding a provider means writing one adapter folder and one entry here —
 * no other code changes.
 */
export const ALL_SOURCES: NewsSource[] = [
  new NewsApiSource(getApiKey('newsapi')),
  new GuardianSource(getApiKey('guardian')),
  new NytimesSource(getApiKey('nytimes')),
]

/** Sources matching a selection; an empty selection means all of them. */
export function getEffectiveSources(selectedIds: SourceId[]): NewsSource[] {
  return selectedIds.length === 0
    ? ALL_SOURCES
    : ALL_SOURCES.filter((source) => selectedIds.includes(source.id))
}

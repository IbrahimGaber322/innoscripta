import type { SourceId } from '../../domain/article'
import { GuardianSource } from './adapters/guardian/guardianSource'
import { NewsApiSource } from './adapters/newsapi/newsApiSource'
import { NytimesSource } from './adapters/nytimes/nytimesSource'
import { NewsdataSource } from './adapters/newsdata/newsdataSource'
import type { NewsSource } from './NewsSource'

/** Trims an env value and treats a blank string as "not configured". */
function readKey(value: string | undefined): string | undefined {
  return value?.trim() || undefined
}

/**
 * Every news source bundled with the app, each paired with its API key — the
 * single place that wires sources to their credentials. Adding a provider means
 * writing one adapter folder and one entry here; no other code changes.
 *
 * Vite inlines `import.meta.env.VITE_*` at build time, so each key must be
 * referenced statically (a dynamic lookup would not survive the production
 * build).
 */
export const ALL_SOURCES: NewsSource[] = [
  new NewsApiSource(readKey(import.meta.env.VITE_NEWSAPI_API_KEY)),
  new GuardianSource(readKey(import.meta.env.VITE_GUARDIAN_API_KEY)),
  new NytimesSource(readKey(import.meta.env.VITE_NYT_API_KEY)),
  new NewsdataSource(readKey(import.meta.env.VITE_PUB_NEWSDATA_API_KEY)),
]

/** Sources matching a selection; an empty selection means all of them. */
export function getEffectiveSources(selectedIds: SourceId[]): NewsSource[] {
  return selectedIds.length === 0
    ? ALL_SOURCES
    : ALL_SOURCES.filter((source) => selectedIds.includes(source.id))
}

/** The ids of every installed source. */
export function getKnownSourceIds(): SourceId[] {
  return ALL_SOURCES.map((source) => source.id)
}

/** True when an id belongs to an installed source; used to drop stale input. */
export function isKnownSourceId(value: string): boolean {
  return ALL_SOURCES.some((source) => source.id === value)
}

/**
 * Display label for a source id — the installed source's name, falling back to
 * the id itself so an unknown id never renders as blank.
 */
export function getSourceLabel(id: SourceId): string {
  return ALL_SOURCES.find((source) => source.id === id)?.name ?? id
}

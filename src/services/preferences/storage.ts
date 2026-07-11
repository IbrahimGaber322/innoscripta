import { isCategory, type Category } from '../../domain/category'
import { DEFAULT_PREFERENCES, type Preferences } from '../../domain/preferences'
import { isKnownSourceId } from '../news/registry'

/** Versioned so a future shape change can migrate or discard old data. */
export const PREFERENCES_STORAGE_KEY = 'newshub:prefs:v1'

/**
 * Loads preferences, tolerating missing, corrupted, or tampered storage:
 * every field is re-validated and anything invalid falls back to defaults.
 */
export function loadPreferences(): Preferences {
  let raw: string | null
  try {
    raw = localStorage.getItem(PREFERENCES_STORAGE_KEY)
  } catch {
    return DEFAULT_PREFERENCES
  }
  if (!raw) {
    return DEFAULT_PREFERENCES
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      return DEFAULT_PREFERENCES
    }
    const record = parsed as Record<string, unknown>

    return {
      sources: asStringArray(record.sources).filter(isKnownSourceId),
      categories: asStringArray(record.categories).filter((value): value is Category =>
        isCategory(value),
      ),
      authors: asStringArray(record.authors)
        .map((value) => value.trim())
        .filter((value) => value !== ''),
    }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

export function savePreferences(preferences: Preferences): void {
  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
  } catch {
    // Storage can be unavailable (private mode, quota); preferences then
    // simply live in memory for the session.
  }
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

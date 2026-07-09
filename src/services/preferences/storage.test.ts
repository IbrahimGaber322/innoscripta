import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_PREFERENCES } from '../../domain/preferences'
import { loadPreferences, PREFERENCES_STORAGE_KEY, savePreferences } from './storage'

describe('preferences storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('round-trips preferences through localStorage', () => {
    const preferences = {
      sources: ['guardian' as const],
      categories: ['technology' as const, 'science' as const],
      authors: ['Jane Reporter'],
    }

    savePreferences(preferences)

    expect(loadPreferences()).toEqual(preferences)
  })

  it('returns defaults when nothing is stored', () => {
    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES)
  })

  it('returns defaults for corrupted JSON', () => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, 'not-json{')

    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES)
  })

  it('drops invalid entries while keeping valid ones', () => {
    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        sources: ['guardian', 'not-a-source', 42],
        categories: ['technology', 'nonsense'],
        authors: ['  Jane  ', '', 7],
      }),
    )

    expect(loadPreferences()).toEqual({
      sources: ['guardian'],
      categories: ['technology'],
      authors: ['Jane'],
    })
  })
})

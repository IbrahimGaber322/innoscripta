import { useCallback, useState, type ReactNode } from 'react'
import type { Preferences } from '../../domain/preferences'
import { PreferencesContext } from './preferencesContext'
import { loadPreferences, savePreferences } from './storage'

/** Holds user preferences in state and mirrors every change to localStorage. */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences)

  const updatePreferences = useCallback((patch: Partial<Preferences>) => {
    setPreferences((previous) => {
      const next = { ...previous, ...patch }
      savePreferences(next)
      return next
    })
  }, [])

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreferences }}>
      {children}
    </PreferencesContext.Provider>
  )
}

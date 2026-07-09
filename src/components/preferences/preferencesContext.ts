import { createContext } from 'react'
import type { Preferences } from '../../domain/preferences'

export interface PreferencesContextValue {
  preferences: Preferences
  updatePreferences: (patch: Partial<Preferences>) => void
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(null)

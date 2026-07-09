import { useContext } from 'react'
import { PreferencesContext, type PreferencesContextValue } from './preferencesContext'

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext)
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider')
  }
  return context
}

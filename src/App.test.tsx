import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from './App'
import { PreferencesProvider } from './components/preferences/PreferencesProvider'

function renderApp(initialPath = '/') {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PreferencesProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <App />
        </MemoryRouter>
      </PreferencesProvider>
    </QueryClientProvider>,
  )
}

describe('App', () => {
  it('renders the header navigation', () => {
    renderApp()

    expect(screen.getByRole('link', { name: /newshub/i })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
  })

  it('routes to the settings page', () => {
    renderApp('/settings')

    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument()
  })
})

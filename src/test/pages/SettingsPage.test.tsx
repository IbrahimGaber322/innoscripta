import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PreferencesProvider } from '@/context/PreferencesProvider'
import { PREFERENCES_STORAGE_KEY } from '@/services/preferences/storage'
import type { NewsSource } from '@/services/news/NewsSource'
import { SettingsPage } from '@/pages/SettingsPage'

// Fake registry with known capabilities so the category-gating logic is
// deterministic: NewsAPI serves only general + technology.
vi.mock('@/services/news/registry', () => {
  const makeFake = (id: string, name: string, categories: string[]): NewsSource => {
    const source: NewsSource = {
      id,
      name,
      capabilities: {
        categories: categories as NewsSource['capabilities']['categories'],
        dateFilter: true,
        dateFilterWithCategory: true,
      },
      isConfigured: () => true,
      fetchArticles: () =>
        Promise.resolve({ articles: [], totalResults: 0, hasMore: false }),
    }
    return source
  }
  const allSources = () => [
    makeFake('newsapi', 'NewsAPI', ['general', 'technology']),
    makeFake('guardian', 'The Guardian', ['general', 'technology', 'world', 'business']),
  ]
  return {
    get ALL_SOURCES() {
      return allSources()
    },
    getEffectiveSources: (ids: string[]) =>
      ids.length === 0 ? allSources() : allSources().filter((s) => ids.includes(s.id)),
    getKnownSourceIds: () => allSources().map((s) => s.id),
    isKnownSourceId: (value: string) => allSources().some((s) => s.id === value),
    getSourceLabel: (id: string) => allSources().find((s) => s.id === id)?.name ?? id,
  }
})

function renderSettings() {
  render(
    <PreferencesProvider>
      <SettingsPage />
    </PreferencesProvider>,
  )
}

function typeAuthor(name: string) {
  const input = screen.getByLabelText('Author name')
  fireEvent.change(input, { target: { value: name } })
  fireEvent.keyDown(input, { key: 'Enter' })
}

describe('SettingsPage — followed authors', () => {
  beforeEach(() => localStorage.clear())

  it('adds a followed author on Enter', () => {
    renderSettings()
    typeAuthor('Alex Hern')
    expect(screen.getByRole('button', { name: 'Unfollow Alex Hern' })).toBeInTheDocument()
  })

  it('rejects a case-insensitive duplicate', () => {
    renderSettings()
    typeAuthor('Alex Hern')
    typeAuthor('alex hern')
    expect(screen.getAllByRole('button', { name: /^Unfollow/ })).toHaveLength(1)
  })

  it('ignores blank input', () => {
    renderSettings()
    typeAuthor('   ')
    expect(screen.queryByRole('button', { name: /^Unfollow/ })).not.toBeInTheDocument()
  })

  it('unfollows an author', () => {
    renderSettings()
    typeAuthor('Alex Hern')
    fireEvent.click(screen.getByRole('button', { name: 'Unfollow Alex Hern' }))
    expect(
      screen.queryByRole('button', { name: 'Unfollow Alex Hern' }),
    ).not.toBeInTheDocument()
  })
})

describe('SettingsPage — category gating', () => {
  beforeEach(() => localStorage.clear())

  it('disables categories none of the preferred sources can serve', () => {
    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ sources: ['newsapi'], categories: [], authors: [] }),
    )
    renderSettings()
    // NewsAPI (the only preferred source) serves general + technology only.
    expect(screen.getByRole('checkbox', { name: 'Technology' })).toBeEnabled()
    expect(screen.getByRole('checkbox', { name: 'Science' })).toBeDisabled()
  })
})

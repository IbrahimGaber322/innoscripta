import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PreferencesProvider } from '@/context/PreferencesProvider'
import { PREFERENCES_STORAGE_KEY } from '@/services/preferences/storage'
import type { Article, ArticlePage } from '@/domain/article'
import type { NewsSource } from '@/services/news/NewsSource'
import { ForYouPage } from '@/pages/ForYouPage'

function fakeArticle(id: string, sourceId: Article['sourceId'], title: string): Article {
  return {
    id: `${sourceId}:${id}`,
    sourceId,
    sourceName: sourceId,
    title,
    url: `https://example.com/${id}`,
    publishedAt: '2026-07-08T00:00:00Z',
  }
}

const newsapiFetch = vi.fn((): Promise<ArticlePage> =>
  Promise.resolve({
    articles: [fakeArticle('a1', 'newsapi', 'Article from NewsAPI')],
    totalResults: 1,
    hasMore: false,
  }),
)
const guardianFetch = vi.fn((): Promise<ArticlePage> =>
  Promise.resolve({
    articles: [fakeArticle('b1', 'guardian', 'Article from Guardian')],
    totalResults: 1,
    hasMore: false,
  }),
)

vi.mock('@/services/news/registry', () => {
  const makeFake = (
    id: 'newsapi' | 'guardian',
    fetchArticles: () => Promise<ArticlePage>,
  ): NewsSource => ({
    id,
    name: id,
    capabilities: {
      categories: ['general', 'technology'],
      dateFilter: true,
      dateFilterWithCategory: true,
    },
    isConfigured: () => true,
    fetchArticles,
  })
  const allSources = () => [
    makeFake('newsapi', newsapiFetch),
    makeFake('guardian', guardianFetch),
  ]
  return {
    get ALL_SOURCES() {
      return allSources()
    },
    getEffectiveSources: (selectedIds: string[]) =>
      selectedIds.length === 0
        ? allSources()
        : allSources().filter((source) => selectedIds.includes(source.id)),
    getKnownSourceIds: () => allSources().map((source) => source.id),
    isKnownSourceId: (value: string) =>
      allSources().some((source) => source.id === value),
    getSourceLabel: (id: string) =>
      allSources().find((source) => source.id === id)?.name ?? id,
  }
})

function renderForYou() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PreferencesProvider>
        <MemoryRouter initialEntries={['/for-you']}>
          <ForYouPage />
        </MemoryRouter>
      </PreferencesProvider>
    </QueryClientProvider>,
  )
}

describe('ForYouPage source preferences', () => {
  beforeEach(() => {
    localStorage.clear()
    newsapiFetch.mockClear()
    guardianFetch.mockClear()
  })

  it('queries only the preferred sources', async () => {
    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ sources: ['guardian'], categories: [], authors: [] }),
    )

    renderForYou()

    expect(await screen.findByText('Article from Guardian')).toBeInTheDocument()
    expect(screen.queryByText('Article from NewsAPI')).not.toBeInTheDocument()
    expect(guardianFetch).toHaveBeenCalled()
    expect(newsapiFetch).not.toHaveBeenCalled()
  })

  it('queries every source when no preference is set', async () => {
    renderForYou()

    expect(await screen.findByText('Article from Guardian')).toBeInTheDocument()
    expect(await screen.findByText('Article from NewsAPI')).toBeInTheDocument()
  })

  it('pins articles by a followed author above the rest', async () => {
    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ sources: ['guardian'], categories: [], authors: ['Alex Hern'] }),
    )
    guardianFetch.mockResolvedValueOnce({
      articles: [
        { ...fakeArticle('g1', 'guardian', 'Alex Hern on AI'), author: 'Alex Hern' },
        { ...fakeArticle('g2', 'guardian', 'Alex Hern on privacy'), author: 'Alex Hern' },
      ],
      totalResults: 2,
      hasMore: false,
    })

    renderForYou()

    // Two followed articles: one becomes the top pick, the other fills the
    // "From authors you follow" rail — proving the followed/rest partition.
    expect(await screen.findByText('From authors you follow')).toBeInTheDocument()
    expect(screen.getByText('Alex Hern on privacy')).toBeInTheDocument()
  })
})

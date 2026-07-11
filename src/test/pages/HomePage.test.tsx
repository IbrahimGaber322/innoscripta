import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PreferencesProvider } from '@/context/PreferencesProvider'
import type { Article, ArticlePage, ArticleQuery } from '@/domain/article'
import type { Category } from '@/domain/category'
import type { NewsSource } from '@/services/news/NewsSource'
import { HomePage } from '@/pages/HomePage'

function fakeArticle(sourceId: string, category: Category): Article {
  return {
    id: `${sourceId}:${category}`,
    sourceId,
    sourceName: sourceId,
    title: `${sourceId} ${category} story`,
    url: `https://example.com/${sourceId}/${category}`,
    publishedAt: '2026-07-08T00:00:00Z',
    category,
  }
}

// Each source returns one article tagged with the requested category, so the
// front-page topic fan-out (world/business/technology/sports) yields enough
// articles to trigger the magazine layout.
const newsapiFetch = vi.fn((query: ArticleQuery): Promise<ArticlePage> => {
  const category = query.category ?? 'general'
  return Promise.resolve({
    articles: [fakeArticle('newsapi', category)],
    totalResults: 1,
    hasMore: false,
  })
})
const guardianFetch = vi.fn((query: ArticleQuery): Promise<ArticlePage> => {
  const category = query.category ?? 'general'
  return Promise.resolve({
    articles: [fakeArticle('guardian', category)],
    totalResults: 1,
    hasMore: false,
  })
})
const topHeadlinesFetch = vi.fn((): Promise<Article[]> =>
  Promise.resolve([
    {
      id: 'newsapi:top',
      sourceId: 'newsapi',
      sourceName: 'newsapi',
      title: 'Breaking headline',
      url: 'https://example.com/top/1',
      publishedAt: '2026-07-08T00:00:00Z',
    },
  ]),
)

vi.mock('@/services/news/registry', () => {
  const makeFake = (
    id: string,
    fetchArticles: NewsSource['fetchArticles'],
    fetchTopHeadlines?: NewsSource['fetchTopHeadlines'],
  ): NewsSource => {
    const source: NewsSource = {
      id,
      name: id,
      capabilities: {
        categories: ['general', 'world', 'business', 'technology', 'sports'],
        dateFilter: true,
        dateFilterWithCategory: true,
      },
      isConfigured: () => true,
      fetchArticles,
    }
    if (fetchTopHeadlines) source.fetchTopHeadlines = fetchTopHeadlines
    return source
  }
  const allSources = () => [
    makeFake('newsapi', newsapiFetch, topHeadlinesFetch),
    makeFake('guardian', guardianFetch),
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

function renderHome(entry: string) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PreferencesProvider>
        <MemoryRouter initialEntries={[entry]}>
          <HomePage />
        </MemoryRouter>
      </PreferencesProvider>
    </QueryClientProvider>,
  )
}

describe('HomePage', () => {
  beforeEach(() => {
    localStorage.clear()
    newsapiFetch.mockClear()
    guardianFetch.mockClear()
    topHeadlinesFetch.mockClear()
  })

  it('shows the "Latest news" magazine with the Top headlines box on the bare front page', async () => {
    renderHome('/')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Latest news' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Breaking headline')).toBeInTheDocument()
    expect(screen.getByText('Top headlines')).toBeInTheDocument()
  })

  it('keeps the magazine but hides Top headlines when only a source is selected', async () => {
    renderHome('/?sources=guardian')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Filtered news' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('guardian technology story')).toBeInTheDocument()
    expect(screen.queryByText('newsapi technology story')).not.toBeInTheDocument()
    expect(screen.queryByText('Top headlines')).not.toBeInTheDocument()
  })

  it('collapses to a flat list for a keyword search', async () => {
    renderHome('/?q=climate')
    expect(
      screen.getByRole('heading', { level: 1, name: /Results for/ }),
    ).toBeInTheDocument()
    expect(await screen.findByText('guardian general story')).toBeInTheDocument()
    expect(screen.queryByText('Top headlines')).not.toBeInTheDocument()
  })

  it('labels a category filter with the category name', async () => {
    renderHome('/?categories=technology')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Technology' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('guardian technology story')).toBeInTheDocument()
  })

  it('labels a date range and collapses the fan-out to a flat list', async () => {
    renderHome('/?from=2026-02-01&to=2026-02-14')
    expect(
      screen.getByRole('heading', { level: 1, name: /News from Feb 1, 2026/ }),
    ).toBeInTheDocument()
    expect(await screen.findByText('guardian general story')).toBeInTheDocument()
    expect(screen.queryByText('Top headlines')).not.toBeInTheDocument()
  })
})

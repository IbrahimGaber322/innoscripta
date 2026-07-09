import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { Article } from '@/domain/article'
import { articlePath } from '@/lib/articleRoute'
import { ArticlePage } from '@/pages/ArticlePage'

const nytArticle: Article = {
  id: 'nytimes:nyt://article/reader-test',
  sourceId: 'nytimes',
  sourceName: 'The New York Times',
  title: 'Reader page headline',
  description: 'The standfirst of the story.',
  content: 'A longer lead paragraph with more detail than the standfirst.',
  url: 'https://www.nytimes.com/reader-test.html',
  author: 'Jane Reporter',
  publishedAt: '2026-07-08T00:00:00Z',
}

function renderReader(entry?: { pathname: string; state?: object }) {
  const initialEntry = entry ?? {
    pathname: articlePath(nytArticle),
    state: { article: nytArticle },
  }
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="article/:encodedId" element={<ArticlePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ArticlePage', () => {
  it('renders the article passed through navigation state', () => {
    renderReader()

    expect(
      screen.getByRole('heading', { name: 'Reader page headline' }),
    ).toBeInTheDocument()
    expect(screen.getByText('The standfirst of the story.')).toBeInTheDocument()
    expect(
      screen.getByText('A longer lead paragraph with more detail than the standfirst.'),
    ).toBeInTheDocument()
  })

  it('links to the source for the rest of the story', () => {
    renderReader()

    expect(
      screen.getByText(/continue reading at the new york times/i),
    ).toBeInTheDocument()
    const cta = screen.getByRole('link', { name: /open original/i })
    expect(cta).toHaveAttribute('href', nytArticle.url)
    expect(cta).toHaveAttribute('target', '_blank')
  })

  it('falls back gracefully when opened without navigation state', () => {
    renderReader({ pathname: articlePath(nytArticle) })

    expect(
      screen.getByRole('heading', { name: /article unavailable/i }),
    ).toBeInTheDocument()
  })
})

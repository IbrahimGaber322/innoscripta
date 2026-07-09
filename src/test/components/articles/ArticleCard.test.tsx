import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ArticleCard } from '@/components/articles/ArticleCard'
import type { Article } from '@/domain/article'

const article: Article = {
  id: 'guardian:test-article',
  sourceId: 'guardian',
  sourceName: 'The Guardian',
  title: 'Test headline about something important',
  description: 'A short summary of the story.',
  url: 'https://www.theguardian.com/test-article',
  imageUrl: 'https://media.guim.co.uk/test.jpg',
  author: 'Jane Reporter',
  category: 'technology',
  publishedAt: '2026-07-03T12:00:00Z',
}

function renderCard(entry: Article) {
  render(
    <MemoryRouter>
      <ArticleCard article={entry} />
    </MemoryRouter>,
  )
}

describe('ArticleCard', () => {
  it('shows the source, category, byline, and date', () => {
    renderCard(article)

    expect(screen.getByText('The Guardian')).toBeInTheDocument()
    expect(screen.getByText('Technology')).toBeInTheDocument()
    expect(screen.getByText('Jane Reporter')).toBeInTheDocument()
    expect(screen.getByText('Jul 3, 2026')).toBeInTheDocument()
  })

  it('links the headline to the in-app reader page', () => {
    renderCard(article)

    const link = screen.getByRole('link', { name: article.title })
    expect(link.getAttribute('href')).toMatch(/^\/article\//)
  })

  it('renders without optional fields', () => {
    const minimal: Article = {
      id: 'newsapi:minimal',
      sourceId: 'newsapi',
      sourceName: 'NewsAPI',
      title: 'Minimal article',
      url: 'https://example.com/minimal',
      publishedAt: '2026-07-01T00:00:00Z',
    }

    renderCard(minimal)

    expect(screen.getByRole('link', { name: 'Minimal article' })).toBeInTheDocument()
    // No provider image: a branded placeholder keeps the grid aligned.
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('N')).toBeInTheDocument()
  })

  it('badges NewsAPI articles with the aggregating source and the outlet', () => {
    const viaNewsApi: Article = {
      id: 'newsapi:outlet',
      sourceId: 'newsapi',
      sourceName: 'TechCrunch',
      title: 'Outlet-branded article',
      url: 'https://example.com/outlet',
      publishedAt: '2026-07-01T00:00:00Z',
    }

    renderCard(viaNewsApi)

    expect(screen.getByText('NewsAPI')).toBeInTheDocument()
    expect(screen.getByText('TechCrunch')).toBeInTheDocument()
  })
})

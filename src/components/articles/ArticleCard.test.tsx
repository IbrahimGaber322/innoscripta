import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Article } from '../../domain/article'
import { ArticleCard } from './ArticleCard'

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

describe('ArticleCard', () => {
  it('shows the source, category, byline, and date', () => {
    render(<ArticleCard article={article} />)

    expect(screen.getByText('The Guardian')).toBeInTheDocument()
    expect(screen.getByText('Technology')).toBeInTheDocument()
    expect(screen.getByText('Jane Reporter')).toBeInTheDocument()
    expect(screen.getByText('Jul 3, 2026')).toBeInTheDocument()
  })

  it('links the headline to the original article in a new tab', () => {
    render(<ArticleCard article={article} />)

    const link = screen.getByRole('link', { name: article.title })
    expect(link).toHaveAttribute('href', article.url)
    expect(link).toHaveAttribute('target', '_blank')
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

    render(<ArticleCard article={minimal} />)

    expect(screen.getByRole('link', { name: 'Minimal article' })).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})

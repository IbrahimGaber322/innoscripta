import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FeedFooter } from '@/components/articles/FeedFooter'

const LABELS = { loadingLabel: 'Loading more stories', doneLabel: "You're all caught up" }

describe('FeedFooter', () => {
  it('shows the spinner label while loading more', () => {
    render(<FeedFooter isLoadingMore hasMore hasItems {...LABELS} />)

    expect(screen.getByText('Loading more stories')).toBeInTheDocument()
    expect(screen.queryByText("You're all caught up")).not.toBeInTheDocument()
  })

  it('shows the caught-up divider once everything is loaded', () => {
    render(<FeedFooter isLoadingMore={false} hasMore={false} hasItems {...LABELS} />)

    expect(screen.getByText("You're all caught up")).toBeInTheDocument()
  })

  it('renders nothing while more pages remain but none are loading', () => {
    const { container } = render(
      <FeedFooter isLoadingMore={false} hasMore hasItems {...LABELS} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing for an empty feed', () => {
    const { container } = render(
      <FeedFooter isLoadingMore={false} hasMore={false} hasItems={false} {...LABELS} />,
    )

    expect(container).toBeEmptyDOMElement()
  })
})

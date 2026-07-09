import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

/** Minimal IntersectionObserver stub that lets tests drive intersections. */
class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = []
  callback: IntersectionObserverCallback
  observed: Element[] = []
  disconnected = false

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    MockIntersectionObserver.instances.push(this)
  }
  observe(element: Element) {
    this.observed.push(element)
  }
  unobserve() {}
  disconnect() {
    this.disconnected = true
  }
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
  trigger(isIntersecting: boolean) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    )
  }
}

function Harness({ onLoadMore, enabled }: { onLoadMore: () => void; enabled: boolean }) {
  const ref = useInfiniteScroll<HTMLDivElement>(onLoadMore, { enabled })
  return <div ref={ref} data-testid="sentinel" />
}

beforeEach(() => {
  MockIntersectionObserver.instances = []
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useInfiniteScroll', () => {
  it('loads more when the sentinel intersects while enabled', () => {
    const onLoadMore = vi.fn()
    render(<Harness onLoadMore={onLoadMore} enabled />)

    const observer = MockIntersectionObserver.instances[0]
    expect(observer.observed).toHaveLength(1)

    observer.trigger(true)
    expect(onLoadMore).toHaveBeenCalledTimes(1)
  })

  it('does not load more when the sentinel is not intersecting', () => {
    const onLoadMore = vi.fn()
    render(<Harness onLoadMore={onLoadMore} enabled />)

    MockIntersectionObserver.instances[0].trigger(false)
    expect(onLoadMore).not.toHaveBeenCalled()
  })

  it('creates no observer while disabled', () => {
    render(<Harness onLoadMore={vi.fn()} enabled={false} />)
    expect(MockIntersectionObserver.instances).toHaveLength(0)
  })

  it('disconnects the observer on unmount', () => {
    const { unmount } = render(<Harness onLoadMore={vi.fn()} enabled />)
    const observer = MockIntersectionObserver.instances[0]

    unmount()
    expect(observer.disconnected).toBe(true)
  })

  it('always calls the latest callback without recreating the observer', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = render(<Harness onLoadMore={first} enabled />)

    rerender(<Harness onLoadMore={second} enabled />)
    // enabled did not change, so the same observer is reused.
    expect(MockIntersectionObserver.instances).toHaveLength(1)

    MockIntersectionObserver.instances[0].trigger(true)
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})

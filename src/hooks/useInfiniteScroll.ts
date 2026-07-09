import { useEffect, useRef } from 'react'

interface InfiniteScrollOptions {
  /** Only observe while there is more to load and nothing is in flight. */
  enabled: boolean
  /** How far before the sentinel enters view to trigger a load. */
  rootMargin?: string
}

/**
 * Returns a ref for a sentinel element; when it scrolls into view (and the
 * feed is `enabled`), `onLoadMore` fires. Replaces a manual "load more"
 * button with scroll-driven pagination.
 */
export function useInfiniteScroll<T extends Element>(
  onLoadMore: () => void,
  { enabled, rootMargin = '400px 0px' }: InfiniteScrollOptions,
) {
  const sentinelRef = useRef<T | null>(null)
  // Keep the latest callback without re-creating the observer each render.
  const callbackRef = useRef(onLoadMore)
  useEffect(() => {
    callbackRef.current = onLoadMore
  })

  useEffect(() => {
    const node = sentinelRef.current
    // jsdom and very old browsers lack IntersectionObserver; degrade to no-op.
    if (!node || !enabled || typeof IntersectionObserver === 'undefined') {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          callbackRef.current()
        }
      },
      { rootMargin },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [enabled, rootMargin])

  return sentinelRef
}

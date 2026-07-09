interface FeedFooterProps {
  /** True while the next page is loading. */
  isLoadingMore: boolean
  /** True while more pages remain to load. */
  hasMore: boolean
  /** Whether the feed rendered any items at all. */
  hasItems: boolean
  loadingLabel: string
  doneLabel: string
}

/**
 * The tail of an infinite-scrolling feed: a spinner while the next page
 * loads, then an "all caught up" divider once everything is loaded.
 */
export function FeedFooter({
  isLoadingMore,
  hasMore,
  hasItems,
  loadingLabel,
  doneLabel,
}: FeedFooterProps) {
  if (isLoadingMore) {
    return (
      <div
        className="mt-12 flex items-center justify-center gap-3 text-[13.5px] text-stone-500"
        role="status"
      >
        <span className="border-t-accent h-4.5 w-4.5 animate-spin rounded-full border-2 border-stone-300" />
        {loadingLabel}
      </div>
    )
  }

  if (!hasMore && hasItems) {
    return (
      <div className="mt-14 flex items-center gap-4">
        <span className="h-px flex-1 bg-stone-200" />
        <span className="text-[11px] font-semibold tracking-widest text-stone-400 uppercase">
          {doneLabel}
        </span>
        <span className="h-px flex-1 bg-stone-200" />
      </div>
    )
  }

  return null
}

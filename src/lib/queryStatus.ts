/** The subset of a query's status flags that describe an in-flight fetch. */
interface FetchStatus {
  /** Any request for this query is currently in flight. */
  isFetching: boolean
  /** The very first load, with no data yet to show. */
  isPending: boolean
  /** An infinite-scroll request appending the next page. */
  isFetchingNextPage: boolean
}

/**
 * True when a query is refetching in the background while content is already on
 * screen — i.e. not the first load (that shows a skeleton) and not an
 * infinite-scroll append (that has its own footer indicator). This is the
 * signal for the "updating" affordance: a filter change keeps the previous
 * results visible while the new ones load, so without a cue the page looks
 * frozen for the length of the request.
 */
export function isBackgroundRefetching(status: FetchStatus): boolean {
  return status.isFetching && !status.isPending && !status.isFetchingNextPage
}

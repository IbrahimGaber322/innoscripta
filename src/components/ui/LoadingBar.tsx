interface LoadingBarProps {
  /** Show the bar while a background fetch is in flight. */
  active: boolean
}

/**
 * A slim indeterminate progress bar pinned to the top of the viewport, shown
 * while a new query loads in the background (e.g. after a filter change, while
 * the previous results stay on screen). It gives immediate "working on it"
 * feedback without discarding the current content or shifting layout — fixed
 * positioning keeps it out of the document flow, so toggling it never reflows
 * the page. Under reduced-motion the sweep is replaced by a static full-width
 * bar, which still signals activity without animating.
 */
export function LoadingBar({ active }: LoadingBarProps) {
  if (!active) {
    return null
  }

  return (
    <div
      className="fixed inset-x-0 top-0 z-20 h-0.5 overflow-hidden"
      role="progressbar"
      aria-label="Loading"
    >
      <div className="bg-accent animate-loading-bar h-full w-2/5 motion-reduce:w-full motion-reduce:animate-none motion-reduce:opacity-70" />
    </div>
  )
}

import type { SourceError } from '../../services/news/NewsSource'

interface SourceStatusBannerProps {
  errors: SourceError[]
}

/**
 * Failing or skipped sources degrade visibly instead of silently: the rest
 * of the page keeps rendering while each problem source gets a chip here.
 */
export function SourceStatusBanner({ errors }: SourceStatusBannerProps) {
  if (errors.length === 0) {
    return null
  }

  return (
    <div role="status" className="bg-panel rounded-lg px-5 py-4">
      <p className="text-ink text-sm font-semibold">Some sources are unavailable</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {errors.map((error) => (
          <li
            key={error.sourceId}
            className="bg-paper rounded-full border border-stone-200 px-3.5 py-1 text-xs text-stone-600"
          >
            <span className="font-semibold text-stone-700">{error.sourceName}:</span>{' '}
            {error.message}
          </li>
        ))}
      </ul>
    </div>
  )
}

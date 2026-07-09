import { SOURCE_LABELS, type Article } from '../../domain/article'
import { CATEGORY_LABELS } from '../../domain/category'
import { formatDate } from '../../lib/formatDate'

/** Uppercase source/category line shown above article titles. */
export function ArticleKicker({
  article,
  accentColor,
}: {
  article: Article
  /** Overrides the category label colour (e.g. a section's accent). */
  accentColor?: string
}) {
  const sourceLabel = SOURCE_LABELS[article.sourceId]
  // For NewsAPI the article's own source is the underlying outlet
  // (e.g. "TechCrunch"); show it alongside the aggregating source.
  const outlet = article.sourceName !== sourceLabel ? article.sourceName : undefined

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold tracking-widest uppercase">
      <span className="text-stone-400">{sourceLabel}</span>
      {outlet && <span className="text-stone-400">{outlet}</span>}
      {article.category && (
        <span
          className={accentColor ? undefined : 'text-accent'}
          style={accentColor ? { color: accentColor } : undefined}
        >
          {CATEGORY_LABELS[article.category]}
        </span>
      )}
    </div>
  )
}

/** "Author · date" line shown under article excerpts. */
export function ArticleByline({ article }: { article: Article }) {
  return (
    <div className="text-[12.5px] text-stone-400">
      {article.author && (
        <>
          <span className="font-medium text-stone-600">{article.author}</span>
          <span aria-hidden="true"> · </span>
        </>
      )}
      <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
    </div>
  )
}

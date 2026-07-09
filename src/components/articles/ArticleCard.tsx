import { SOURCE_LABELS, type Article } from '../../domain/article'
import { CATEGORY_LABELS } from '../../domain/category'
import { formatDate } from '../../lib/formatDate'

interface ArticleCardProps {
  article: Article
}

export function ArticleCard({ article }: ArticleCardProps) {
  const sourceLabel = SOURCE_LABELS[article.sourceId]
  // For NewsAPI the article's own source is the underlying outlet
  // (e.g. "TechCrunch"); show it alongside the aggregating source.
  const outlet = article.sourceName !== sourceLabel ? article.sourceName : undefined

  return (
    <article className="group flex h-full flex-col">
      {article.imageUrl && (
        <div className="aspect-3/2 overflow-hidden rounded bg-stone-200">
          <img
            src={article.imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            onError={(event) => {
              event.currentTarget.parentElement!.style.display = 'none'
            }}
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold tracking-widest uppercase">
        <span className="text-stone-400">{sourceLabel}</span>
        {outlet && <span className="text-stone-400">{outlet}</span>}
        {article.category && (
          <span className="text-accent">{CATEGORY_LABELS[article.category]}</span>
        )}
      </div>

      <h3 className="mt-2 font-serif text-[21px] leading-tight font-medium">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-accent transition-colors"
        >
          {article.title}
        </a>
      </h3>

      {article.description && (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-500">
          {article.description}
        </p>
      )}

      <div className="mt-auto pt-3 text-[12.5px] text-stone-400">
        {article.author && (
          <>
            <span className="font-medium text-stone-600">{article.author}</span>
            <span aria-hidden="true"> · </span>
          </>
        )}
        <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
      </div>
    </article>
  )
}

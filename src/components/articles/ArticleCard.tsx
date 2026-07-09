import type { Article } from '../../domain/article'
import { CATEGORY_LABELS } from '../../domain/category'
import { formatDate } from '../../lib/formatDate'

interface ArticleCardProps {
  article: Article
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {article.imageUrl && (
        <img
          src={article.imageUrl}
          alt=""
          loading="lazy"
          className="h-44 w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
        />
      )}

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-sky-100 px-2 py-0.5 font-medium text-sky-800">
            {article.sourceName}
          </span>
          {article.category && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
              {CATEGORY_LABELS[article.category]}
            </span>
          )}
        </div>

        <h2 className="leading-snug font-semibold text-slate-900">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-sky-700"
          >
            {article.title}
          </a>
        </h2>

        {article.description && (
          <p className="line-clamp-3 text-sm text-slate-600">{article.description}</p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-2 pt-2 text-xs text-slate-500">
          {article.author && (
            <>
              <span className="font-medium text-slate-600">{article.author}</span>
              <span aria-hidden="true">·</span>
            </>
          )}
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
        </div>
      </div>
    </article>
  )
}

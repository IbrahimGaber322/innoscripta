import { Link } from 'react-router-dom'
import { SOURCE_LABELS, type Article } from '../../domain/article'
import { CATEGORY_LABELS } from '../../domain/category'
import { articlePath } from '../../lib/articleRoute'
import { formatDate } from '../../lib/formatDate'

interface TopPickProps {
  article: Article
}

/** The single most relevant story, featured at the top of the For You feed. */
export function TopPick({ article }: TopPickProps) {
  return (
    <Link
      to={articlePath(article)}
      state={{ article }}
      className="group bg-panel grid overflow-hidden rounded-lg md:grid-cols-[7fr_5fr]"
    >
      <div className="flex flex-col justify-center p-8 sm:p-11">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
          <span className="text-accent flex items-center gap-1.5">
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2l2.6 6.6L21 11l-6.4 2.4L12 20l-2.6-6.6L3 11l6.4-2.4z" />
            </svg>
            Top pick for you
          </span>
          <span className="text-stone-400">· {SOURCE_LABELS[article.sourceId]}</span>
        </div>

        <h2 className="text-ink group-hover:text-accent mt-4 font-serif text-2xl leading-[1.15] font-medium tracking-tight transition-colors sm:text-[32px]">
          {article.title}
        </h2>

        {article.description && (
          <p className="mt-3.5 text-[15px] leading-relaxed text-stone-600">
            {article.description}
          </p>
        )}

        <div className="mt-4 text-[13px] text-stone-400">
          {article.author && (
            <span className="font-medium text-stone-600">{article.author}</span>
          )}
          <span aria-hidden="true"> · </span>
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
          {article.category && (
            <span> · Matches your {CATEGORY_LABELS[article.category]} topic</span>
          )}
        </div>
      </div>

      <div className="relative min-h-56 bg-stone-200 md:min-h-full">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span
              className="font-serif text-6xl font-medium text-stone-300 italic"
              aria-hidden="true"
            >
              N
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}

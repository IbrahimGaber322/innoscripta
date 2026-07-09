import { Link } from 'react-router-dom'
import type { Article } from '../../domain/article'
import { CATEGORY_LABELS } from '../../domain/category'
import { articlePath } from '../../lib/articleRoute'
import { formatDate } from '../../lib/formatDate'

interface ArticleListItemProps {
  article: Article
}

/** A compact horizontal article row: square thumbnail beside the headline. */
export function ArticleListItem({ article }: ArticleListItemProps) {
  return (
    <Link
      to={articlePath(article)}
      state={{ article }}
      className="group flex items-start gap-4.5 border-b border-stone-100 py-5 last:border-b-0"
    >
      <div className="bg-panel aspect-square w-24 shrink-0 overflow-hidden rounded">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.parentElement!.style.display = 'none'
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span
              className="font-serif text-2xl font-medium text-stone-300 italic"
              aria-hidden="true"
            >
              N
            </span>
          </div>
        )}
      </div>

      <div>
        {article.category && (
          <div className="text-accent text-[11px] font-semibold tracking-widest uppercase">
            {CATEGORY_LABELS[article.category]}
          </div>
        )}
        <h3 className="group-hover:text-accent mt-1.5 font-serif text-[18px] leading-snug font-medium transition-colors">
          {article.title}
        </h3>
        <div className="mt-2 text-[12.5px] text-stone-400">
          {article.author && <span>{article.author} · </span>}
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
        </div>
      </div>
    </Link>
  )
}

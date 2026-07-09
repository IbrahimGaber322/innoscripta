import { Link } from 'react-router-dom'
import type { Article } from '../../domain/article'
import { articlePath } from '../../lib/articleRoute'
import { ArticleImage } from './ArticleImage'
import { ArticleByline, ArticleKicker } from './ArticleMeta'

interface ArticleCardProps {
  article: Article
}

export function ArticleCard({ article }: ArticleCardProps) {
  const readerPath = articlePath(article)

  return (
    <article className="group flex h-full flex-col">
      <Link to={readerPath} state={{ article }} tabIndex={-1} aria-hidden="true">
        <ArticleImage article={article} />
      </Link>

      <div className="mt-4">
        <ArticleKicker article={article} />
      </div>

      <h3 className="mt-2 font-serif text-[21px] leading-tight font-medium">
        <Link
          to={readerPath}
          state={{ article }}
          className="hover:text-accent transition-colors"
        >
          {article.title}
        </Link>
      </h3>

      {article.description && (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-500">
          {article.description}
        </p>
      )}

      <div className="mt-auto pt-3">
        <ArticleByline article={article} />
      </div>
    </article>
  )
}

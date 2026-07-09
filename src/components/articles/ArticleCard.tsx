import { Link } from 'react-router-dom'
import type { Article } from '../../domain/article'
import { articlePath } from '../../lib/articleRoute'
import { ArticleImage } from './ArticleImage'
import { ArticleByline, ArticleKicker } from './ArticleMeta'

interface ArticleCardProps {
  article: Article
  /** Section accent colour applied to the category kicker and title hover. */
  accentColor?: string
}

/** React.CSSProperties omits CSS custom properties, so widen it for the var. */
type StyleWithAccent = React.CSSProperties & Record<'--card-accent', string>

export function ArticleCard({ article, accentColor }: ArticleCardProps) {
  const readerPath = articlePath(article)
  const style: StyleWithAccent | undefined = accentColor
    ? { '--card-accent': accentColor }
    : undefined

  return (
    <article className="group flex h-full flex-col" style={style}>
      <Link to={readerPath} state={{ article }} tabIndex={-1} aria-hidden="true">
        <ArticleImage article={article} />
      </Link>

      <div className="mt-4">
        <ArticleKicker article={article} accentColor={accentColor} />
      </div>

      <h3 className="mt-2 font-serif text-[21px] leading-tight font-medium">
        <Link
          to={readerPath}
          state={{ article }}
          className={
            accentColor
              ? 'transition-colors hover:text-(--card-accent)'
              : 'hover:text-accent transition-colors'
          }
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

import { Link } from 'react-router-dom'
import type { Article } from '../../domain/article'
import { articlePath } from '../../lib/articleRoute'
import { ArticleImage } from './ArticleImage'
import { ArticleByline, ArticleKicker } from './ArticleMeta'

interface LeadArticleProps {
  article: Article
}

/** The newest story, featured above the grid in a two-column spread. */
export function LeadArticle({ article }: LeadArticleProps) {
  const readerPath = articlePath(article)

  return (
    <article className="group grid items-center gap-8 border-b border-stone-200 pb-12 md:grid-cols-[7fr_5fr] md:gap-10">
      <Link to={readerPath} state={{ article }} tabIndex={-1} aria-hidden="true">
        <ArticleImage article={article} aspectClass="aspect-16/10" />
      </Link>

      <div>
        <ArticleKicker article={article} />
        <h2 className="mt-3 font-serif text-2xl leading-[1.15] font-medium tracking-tight sm:text-[34px]">
          <Link
            to={readerPath}
            state={{ article }}
            className="hover:text-accent transition-colors"
          >
            {article.title}
          </Link>
        </h2>
        {article.description && (
          <p className="mt-3.5 text-[15px] leading-relaxed text-stone-600">
            {article.description}
          </p>
        )}
        <div className="mt-4">
          <ArticleByline article={article} />
        </div>
      </div>
    </article>
  )
}

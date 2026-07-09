import type { Article } from '../../domain/article'
import { ArticleByline, ArticleKicker } from './ArticleMeta'

interface LeadArticleProps {
  article: Article
}

/** The newest story, featured above the grid in a two-column spread. */
export function LeadArticle({ article }: LeadArticleProps) {
  return (
    <article className="group grid items-center gap-8 border-b border-stone-200 pb-12 md:grid-cols-[7fr_5fr] md:gap-10">
      {article.imageUrl && (
        <div className="aspect-16/10 overflow-hidden rounded bg-stone-200">
          <img
            src={article.imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            onError={(event) => {
              event.currentTarget.parentElement!.style.display = 'none'
            }}
          />
        </div>
      )}

      <div>
        <ArticleKicker article={article} />
        <h2 className="mt-3 font-serif text-2xl leading-[1.15] font-medium tracking-tight sm:text-[34px]">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent transition-colors"
          >
            {article.title}
          </a>
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

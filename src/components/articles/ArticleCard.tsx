import type { Article } from '../../domain/article'
import { ArticleByline, ArticleKicker } from './ArticleMeta'

interface ArticleCardProps {
  article: Article
}

export function ArticleCard({ article }: ArticleCardProps) {
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

      <div className="mt-4">
        <ArticleKicker article={article} />
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

      <div className="mt-auto pt-3">
        <ArticleByline article={article} />
      </div>
    </article>
  )
}

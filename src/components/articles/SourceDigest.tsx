import type { Article, SourceId } from '../../domain/article'
import { getSourceLabel } from '../../services/news/registry'
import { ArticleListItem } from './ArticleListItem'

interface SourceDigestProps {
  sourceId: SourceId
  articles: Article[]
}

/** "From The Guardian" — a short digest of a followed source's latest stories. */
export function SourceDigest({ sourceId, articles }: SourceDigestProps) {
  return (
    <div>
      <div className="border-ink flex items-baseline justify-between gap-4 border-t-2 pt-3.5">
        <h2 className="font-serif text-2xl font-medium">
          From {getSourceLabel(sourceId)}
        </h2>
        <span className="text-[11px] font-semibold tracking-widest text-stone-400 uppercase">
          Source you follow
        </span>
      </div>
      <div className="flex flex-col">
        {articles.map((article) => (
          <ArticleListItem key={article.id} article={article} />
        ))}
      </div>
    </div>
  )
}

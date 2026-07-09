import { Link } from 'react-router-dom'
import { SOURCE_LABELS, type Article } from '../../domain/article'
import { CATEGORY_LABELS } from '../../domain/category'
import { articlePath } from '../../lib/articleRoute'
import { formatDate } from '../../lib/formatDate'
import { ArticleImage } from './ArticleImage'

/** Guardian liveblogs end their headline with "— live". */
function isLiveArticle(article: Article): boolean {
  return /[-–—]\s*live$/i.test(article.title.trim())
}

function LeadKicker({ article }: { article: Article }) {
  const meta = [SOURCE_LABELS[article.sourceId]]
  if (article.category) {
    meta.push(CATEGORY_LABELS[article.category])
  }

  return (
    <div className="flex items-center gap-2.5 text-[11px] font-semibold tracking-widest uppercase">
      {isLiveArticle(article) && (
        <span className="flex items-center gap-1.5 text-red-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-700" />
          Live
        </span>
      )}
      <span className="text-stone-400">{meta.join(' · ')}</span>
    </div>
  )
}

interface TopStoriesProps {
  lead: Article
  /** Secondary headlines shown in the "Latest" rail. */
  latest: Article[]
}

/** Front-page package: a large lead story beside a rail of latest headlines. */
export function TopStories({ lead, latest }: TopStoriesProps) {
  return (
    <div className="grid gap-x-0 gap-y-10 border-b border-stone-200 pb-14 md:grid-cols-[8fr_4fr]">
      <article className="group md:pr-10">
        <Link to={articlePath(lead)} state={{ article: lead }} className="block">
          <ArticleImage article={lead} aspectClass="aspect-16/9" />
          <div className="mt-5">
            <LeadKicker article={lead} />
          </div>
          <h2 className="text-ink group-hover:text-accent mt-3 max-w-2xl font-serif text-3xl leading-[1.1] font-medium tracking-tight transition-colors sm:text-[40px]">
            {lead.title}
          </h2>
        </Link>
        {lead.description && (
          <p className="mt-3.5 max-w-xl text-[15px] leading-relaxed text-stone-600">
            {lead.description}
          </p>
        )}
        <div className="mt-4 text-[13px] text-stone-400">
          {lead.author && (
            <>
              <span className="font-medium text-stone-600">{lead.author}</span>
              <span aria-hidden="true"> · </span>
            </>
          )}
          <time dateTime={lead.publishedAt}>{formatDate(lead.publishedAt)}</time>
        </div>
      </article>

      {latest.length > 0 && (
        <aside className="flex flex-col md:border-l md:border-stone-200 md:pl-10">
          <div className="text-accent text-[11px] font-bold tracking-widest uppercase">
            The latest
          </div>
          <div className="flex flex-col">
            {latest.map((article) => (
              <Link
                key={article.id}
                to={articlePath(article)}
                state={{ article }}
                className="group border-b border-stone-100 py-4.5 last:border-b-0"
              >
                <div className="text-[11px] font-semibold tracking-widest text-stone-400 uppercase">
                  {SOURCE_LABELS[article.sourceId]}
                </div>
                <h3 className="text-ink group-hover:text-accent mt-1.5 font-serif text-[17.5px] leading-snug font-medium transition-colors">
                  {article.title}
                </h3>
              </Link>
            ))}
          </div>
        </aside>
      )}
    </div>
  )
}

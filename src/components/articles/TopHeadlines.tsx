import { Link } from 'react-router-dom'
import { SOURCE_LABELS, type Article } from '../../domain/article'
import { articlePath } from '../../lib/articleRoute'

interface TopHeadlinesProps {
  articles: Article[]
}

/**
 * The dark "Top headlines" package: a ranked list of the day's biggest
 * stories. Sourced from NewsAPI's cross-outlet headlines.
 */
export function TopHeadlines({ articles }: TopHeadlinesProps) {
  if (articles.length === 0) {
    return null
  }

  return (
    <section className="bg-ink mt-18 rounded-[10px] px-6 py-10 sm:px-12">
      <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
        <h2 className="text-paper font-serif text-[27px] font-medium">Top headlines</h2>
        <span className="text-xs text-stone-400">The day's biggest stories</span>
      </div>

      <ol className="mt-7 grid grid-cols-1 gap-x-16 md:grid-cols-2">
        {articles.map((article, index) => (
          <li key={article.id}>
            <Link
              to={articlePath(article)}
              state={{ article }}
              className="group flex items-baseline gap-5 border-b border-stone-800 py-4"
            >
              <span className="text-accent min-w-8 font-serif text-[28px] font-medium">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>
                <span className="text-paper group-hover:text-accent block font-serif text-[18px] leading-snug font-medium transition-colors">
                  {article.title}
                </span>
                <span className="mt-1.5 block text-[11px] font-semibold tracking-widest text-stone-400 uppercase">
                  {article.sourceName || SOURCE_LABELS[article.sourceId]}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}

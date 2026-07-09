import { Link } from 'react-router-dom'
import type { Article } from '../../domain/article'
import { CATEGORY_COLORS, CATEGORY_LABELS, type Category } from '../../domain/category'
import { ArticleCard } from './ArticleCard'

interface CategorySectionProps {
  category: Category
  articles: Article[]
}

/** A front-page section grouping a category's stories under a coloured rule. */
export function CategorySection({ category, articles }: CategorySectionProps) {
  const color = CATEGORY_COLORS[category]

  return (
    <section className="mt-14">
      <div
        className="flex items-baseline justify-between gap-4 border-t-2 pt-3.5"
        style={{ borderTopColor: color }}
      >
        <h2
          className="font-serif text-[27px] font-medium tracking-tight"
          style={{ color }}
        >
          {CATEGORY_LABELS[category]}
        </h2>
        <Link
          to={`/?categories=${category}`}
          className="hover:text-ink flex items-center gap-1.5 text-[13px] font-semibold text-stone-500 transition-colors"
        >
          View all
          <svg
            className="h-3.25 w-3.25"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} accentColor={color} />
        ))}
      </div>
    </section>
  )
}

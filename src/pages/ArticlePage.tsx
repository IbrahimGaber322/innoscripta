import { useQuery } from '@tanstack/react-query'
import DOMPurify from 'dompurify'
import { useEffect } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArticleImage } from '../components/articles/ArticleImage'
import { EmptyState } from '../components/articles/EmptyState'
import { CATEGORY_LABELS } from '../domain/category'
import { SOURCE_LABELS, type Article } from '../domain/article'
import { articlePath, decodeArticleId } from '../lib/articleRoute'
import { formatDate } from '../lib/formatDate'
import { useRelatedArticles } from '../hooks/useRelatedArticles'
import { ALL_SOURCES } from '../services/news/registry'

const COLUMN = 'mx-auto max-w-[760px]'

const BODY_CLASS =
  'mt-8 font-serif text-[17px] leading-[1.75] text-stone-800 ' +
  '[&_p]:mt-5 [&_h2]:mt-9 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-medium ' +
  '[&_a]:text-accent [&_a]:underline [&_a]:underline-offset-3 ' +
  '[&_figure]:my-7 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded ' +
  '[&_figcaption]:mt-2 [&_figcaption]:font-sans [&_figcaption]:text-xs [&_figcaption]:text-stone-400 ' +
  '[&_blockquote]:mt-5 [&_blockquote]:border-l-2 [&_blockquote]:border-stone-300 [&_blockquote]:pl-4 [&_blockquote]:italic ' +
  '[&_ul]:mt-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mt-5 [&_ol]:list-decimal [&_ol]:pl-6'

/** Two-letter monogram from the byline (or the source, when anonymous). */
function initials(article: Article): string {
  const source = article.author ?? SOURCE_LABELS[article.sourceId]
  const words = source
    .replace(/^by\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
  return (words[0]?.[0] ?? 'N') + (words[1]?.[0] ?? '')
}

function BodySkeleton() {
  return (
    <div
      className={`${COLUMN} mt-8 animate-pulse space-y-4`}
      role="status"
      aria-label="Loading article"
    >
      {Array.from({ length: 7 }, (_, index) => (
        <div
          key={index}
          className={`h-4 rounded bg-stone-200 ${index % 3 === 2 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

function ContinueReading({
  article,
  fullBody,
}: {
  article: Article
  /** True when the full article body is rendered above (Guardian only). */
  fullBody: boolean
}) {
  const sourceLabel = SOURCE_LABELS[article.sourceId]
  return (
    <div className="bg-panel mt-14 flex flex-wrap items-center justify-between gap-6 rounded-lg p-8">
      <div>
        <div className="font-serif text-xl font-medium">
          {fullBody
            ? `Read more at ${sourceLabel}`
            : `Continue reading at ${sourceLabel}`}
        </div>
        <p className="mt-1 text-[13.5px] text-stone-500">
          {fullBody
            ? 'You’ve read the full story here. Visit the original for comments and related coverage.'
            : `${sourceLabel} shares only a summary through its API — open the original for the full story.`}
        </p>
      </div>
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-ink text-paper hover:bg-accent inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors"
      >
        Open original ↗
      </a>
    </div>
  )
}

function MoreLikeThis({ articles }: { articles: Article[] }) {
  return (
    <div className={`${COLUMN} mt-18`}>
      <h2 className="border-t border-stone-200 pt-6 font-serif text-2xl font-medium">
        More like this
      </h2>
      <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
        {articles.map((article) => (
          <Link
            key={article.id}
            to={articlePath(article)}
            state={{ article }}
            className="group flex items-start gap-4"
          >
            <div className="bg-panel aspect-3/2 w-30 shrink-0 overflow-hidden rounded">
              {article.imageUrl && (
                <img
                  src={article.imageUrl}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none'
                  }}
                />
              )}
            </div>
            <div>
              <div className="text-[11px] font-semibold tracking-widest text-stone-400 uppercase">
                {SOURCE_LABELS[article.sourceId]}
              </div>
              <h3 className="group-hover:text-accent mt-1.5 font-serif text-[17px] leading-snug font-medium transition-colors">
                {article.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function ArticlePage() {
  const { encodedId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  // Opening a new article (e.g. from "More like this") should start at the top,
  // not wherever the previous article was scrolled to.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [encodedId])

  const articleId = encodedId ? decodeArticleId(encodedId) : null
  const stateArticle = (location.state as { article?: Article } | undefined)?.article

  const source = articleId
    ? ALL_SOURCES.find((entry) => articleId.startsWith(`${entry.id}:`))
    : undefined
  // Only the Guardian can resolve an article (with its full body) by id;
  // articles from other sources arrive via navigation state.
  const canFetchFull = Boolean(
    articleId && source?.fetchFullArticle && source.isConfigured(),
  )

  const fullQuery = useQuery({
    queryKey: ['full-article', articleId],
    queryFn: ({ signal }) => source!.fetchFullArticle!(articleId!, signal),
    enabled: canFetchFull,
    staleTime: 30 * 60 * 1000,
  })

  const article = stateArticle ?? fullQuery.data?.article
  const bodyHtml = fullQuery.data?.bodyHtml
  const related = useRelatedArticles(article).data ?? []

  if (!article) {
    if (canFetchFull && fullQuery.isPending) {
      return <BodySkeleton />
    }
    return (
      <EmptyState
        title="Article unavailable"
        message="This article is no longer available in this session. Head back to the headlines to keep reading."
      >
        <button
          type="button"
          onClick={() => navigate('/')}
          className="bg-ink text-paper hover:bg-accent rounded-full px-6 py-2.5 text-sm font-semibold transition-colors"
        >
          Back to headlines
        </button>
      </EmptyState>
    )
  }

  const sourceLabel = SOURCE_LABELS[article.sourceId]
  // Avoid repeating the standfirst when the provider's longer text is
  // just the description again.
  const extendedText =
    article.content && article.content !== article.description
      ? article.content
      : undefined

  return (
    <article>
      <button
        type="button"
        onClick={() => (window.history.state?.idx ? navigate(-1) : navigate('/'))}
        className="hover:text-ink flex items-center gap-2 text-[13px] font-semibold text-stone-500 transition-colors"
      >
        ← Back
      </button>

      <header className={`${COLUMN} mt-12`}>
        <div className="flex items-center gap-3 text-[11px] font-semibold tracking-widest uppercase">
          <span className="text-stone-400">{sourceLabel}</span>
          {article.category && (
            <>
              <span className="h-[3px] w-[3px] rounded-full bg-stone-300" />
              <span className="text-accent">{CATEGORY_LABELS[article.category]}</span>
            </>
          )}
        </div>

        <h1 className="mt-5 font-serif text-3xl leading-[1.1] font-medium tracking-tight sm:text-[48px]">
          {article.title}
        </h1>

        {article.description && (
          <p className="mt-5 font-serif text-[21px] leading-relaxed text-stone-600">
            {article.description}
          </p>
        )}

        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-y border-stone-200 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="bg-ink text-paper flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold uppercase">
              {initials(article)}
            </span>
            <div className="min-w-0">
              {article.author && (
                <div className="text-ink line-clamp-2 text-sm font-semibold">
                  {article.author}
                </div>
              )}
              <div className="text-[12.5px] text-stone-400">
                <time dateTime={article.publishedAt}>
                  {formatDate(article.publishedAt)}
                </time>
              </div>
            </div>
          </div>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink hover:text-accent text-[13px] font-semibold transition-colors"
          >
            Read at {sourceLabel} ↗
          </a>
        </div>
      </header>

      {article.imageUrl && (
        <figure className="mx-auto mt-12 max-w-[1000px]">
          <ArticleImage article={article} aspectClass="aspect-16/9" />
          <figcaption className="mt-2.5 text-[12.5px] text-stone-400">
            Photograph via {sourceLabel}
          </figcaption>
        </figure>
      )}

      <div className={COLUMN}>
        {bodyHtml ? (
          <div
            className={BODY_CLASS}
            // Provider HTML is sanitized before it ever reaches the DOM.
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(bodyHtml, { USE_PROFILES: { html: true } }),
            }}
          />
        ) : canFetchFull && fullQuery.isPending ? (
          <div className="mt-8 animate-pulse space-y-4">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className={`h-4 rounded bg-stone-200 ${index % 3 === 2 ? 'w-3/4' : 'w-full'}`}
              />
            ))}
          </div>
        ) : (
          extendedText && (
            <div className={BODY_CLASS}>
              <p>{extendedText}</p>
            </div>
          )
        )}

        <ContinueReading article={article} fullBody={Boolean(bodyHtml)} />
      </div>

      {related.length > 0 && <MoreLikeThis articles={related} />}
    </article>
  )
}

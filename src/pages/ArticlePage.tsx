import { useQuery } from '@tanstack/react-query'
import DOMPurify from 'dompurify'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArticleImage } from '../components/articles/ArticleImage'
import { ArticleByline, ArticleKicker } from '../components/articles/ArticleMeta'
import { EmptyState } from '../components/articles/EmptyState'
import { SOURCE_LABELS, type Article } from '../domain/article'
import { decodeArticleId } from '../lib/articleRoute'
import { ALL_SOURCES } from '../services/news/registry'

const BODY_CLASS =
  'mt-8 font-serif text-[17px] leading-[1.75] text-stone-800 ' +
  '[&_p]:mt-5 [&_h2]:mt-9 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-medium ' +
  '[&_a]:text-accent [&_a]:underline [&_a]:underline-offset-3 ' +
  '[&_figure]:my-7 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded ' +
  '[&_figcaption]:mt-2 [&_figcaption]:font-sans [&_figcaption]:text-xs [&_figcaption]:text-stone-400 ' +
  '[&_blockquote]:mt-5 [&_blockquote]:border-l-2 [&_blockquote]:border-stone-300 [&_blockquote]:pl-4 [&_blockquote]:italic ' +
  '[&_ul]:mt-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mt-5 [&_ol]:list-decimal [&_ol]:pl-6'

function BodySkeleton() {
  return (
    <div
      className="mt-8 animate-pulse space-y-4"
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

export function ArticlePage() {
  const { encodedId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

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

  if (!article) {
    if (canFetchFull && fullQuery.isPending) {
      return (
        <div className="mx-auto max-w-180">
          <BodySkeleton />
        </div>
      )
    }
    return (
      <div className="mx-auto max-w-180">
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
      </div>
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
    <article className="mx-auto max-w-180">
      <button
        type="button"
        onClick={() => (window.history.state?.idx ? navigate(-1) : navigate('/'))}
        className="hover:text-ink text-[13px] font-semibold text-stone-500 transition-colors"
      >
        ← Back
      </button>

      <div className="mt-6">
        <ArticleKicker article={article} />
      </div>

      <h1 className="mt-3 font-serif text-3xl leading-[1.1] font-medium tracking-tight sm:text-[44px]">
        {article.title}
      </h1>

      {article.description && (
        <p className="mt-4 text-[17px] leading-relaxed text-stone-600">
          {article.description}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-y border-stone-200 py-3">
        <ArticleByline article={article} />
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:text-ink text-[13px] font-semibold transition-colors"
        >
          Read at {sourceLabel} ↗
        </a>
      </div>

      {article.imageUrl && (
        <div className="mt-8">
          <ArticleImage article={article} aspectClass="aspect-16/9" />
        </div>
      )}

      {bodyHtml ? (
        <div
          className={BODY_CLASS}
          // Provider HTML is sanitized before it ever reaches the DOM.
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(bodyHtml, { USE_PROFILES: { html: true } }),
          }}
        />
      ) : canFetchFull && fullQuery.isPending ? (
        <BodySkeleton />
      ) : (
        <div className={BODY_CLASS}>
          {extendedText && <p>{extendedText}</p>}
          <div className="mt-10 font-sans">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-ink text-paper hover:bg-accent inline-block rounded-full px-6 py-2.5 text-sm font-semibold transition-colors"
            >
              Continue reading at {sourceLabel}
            </a>
            <p className="mt-3 text-xs text-stone-400">
              The {sourceLabel} API shares a summary only — the full story lives on their
              site.
            </p>
          </div>
        </div>
      )}
    </article>
  )
}

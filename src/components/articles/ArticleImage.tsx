import { useState } from 'react'
import type { Article } from '../../domain/article'

interface ArticleImageProps {
  article: Article
  /** Aspect-ratio utility for the frame, e.g. "aspect-3/2". */
  aspectClass?: string
}

/**
 * The card image frame. Articles without a usable image (missing or failing
 * to load) get a branded placeholder instead, so grid rows stay aligned.
 */
export function ArticleImage({ article, aspectClass = 'aspect-3/2' }: ArticleImageProps) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(article.imageUrl) && !failed

  return (
    <div className={`${aspectClass} bg-panel overflow-hidden rounded`}>
      {showImage ? (
        <img
          src={article.imageUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span
            className="font-serif text-6xl font-medium text-stone-300 italic select-none"
            aria-hidden="true"
          >
            N
          </span>
        </div>
      )}
    </div>
  )
}

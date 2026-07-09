import { useState } from 'react'
import { CheckboxChip } from '../components/ui/CheckboxChip'
import type { SourceId } from '../domain/article'
import { CATEGORIES, CATEGORY_LABELS, type Category } from '../domain/category'
import { usePreferences } from '../hooks/usePreferences'
import { ALL_SOURCES, getEffectiveSources } from '../services/news/registry'

function toggleItem<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item]
}

function PreferenceSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="border-t border-stone-200 pt-6">
      <h2 className="font-serif text-2xl font-medium">{title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-stone-500">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function AuthorTagInput({
  authors,
  onChange,
}: {
  authors: string[]
  onChange: (authors: string[]) => void
}) {
  const [draft, setDraft] = useState('')

  function addAuthor() {
    const name = draft.trim()
    const exists = authors.some((author) => author.toLowerCase() === name.toLowerCase())
    if (name && !exists) {
      onChange([...authors, name])
    }
    setDraft('')
  }

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-stone-300 pb-2.5">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              addAuthor()
            }
          }}
          placeholder="e.g. Alex Hern"
          aria-label="Author name"
          className="text-ink flex-1 border-none bg-transparent text-[15px] placeholder:text-stone-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={addAuthor}
          className="bg-ink text-paper hover:bg-accent rounded-full px-5 py-2 text-[13px] font-semibold transition-colors"
        >
          Follow
        </button>
      </div>

      {authors.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2.5">
          {authors.map((author) => (
            <li
              key={author}
              className="bg-chip flex items-center gap-2 rounded-full py-1.5 pr-2 pl-3.5 text-[13px] font-medium text-stone-700"
            >
              {author}
              <button
                type="button"
                aria-label={`Unfollow ${author}`}
                onClick={() => onChange(authors.filter((entry) => entry !== author))}
                className="hover:text-ink rounded-full p-0.5 text-stone-400 transition-colors"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function SettingsPage() {
  const { preferences, updatePreferences } = usePreferences()

  // Categories at least one effective source can serve — picking anything
  // else would guarantee an empty feed (e.g. NewsAPI has no politics/world).
  const supportedCategories = new Set(
    getEffectiveSources(preferences.sources).flatMap(
      (source) => source.capabilities.categories,
    ),
  )

  return (
    <div className="max-w-170">
      <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">
        Settings
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-stone-500">
        Choose the sources, categories, and authors that shape your For You feed.
      </p>

      <div className="mt-14 flex flex-col gap-12">
        <PreferenceSection
          title="Preferred sources"
          description="Only articles from these sources appear in your feed. None selected means all sources."
        >
          <div className="flex flex-wrap gap-2.5">
            {ALL_SOURCES.map((source) => (
              <CheckboxChip
                key={source.id}
                label={source.name}
                checked={preferences.sources.includes(source.id)}
                onToggle={() =>
                  updatePreferences({
                    sources: toggleItem<SourceId>(preferences.sources, source.id),
                  })
                }
              />
            ))}
          </div>
        </PreferenceSection>

        <PreferenceSection
          title="Preferred categories"
          description="Your feed pulls the latest articles from each selected category. None selected means general news."
        >
          <div className="flex flex-wrap gap-2.5">
            {CATEGORIES.map((category) => {
              const supported = supportedCategories.has(category)
              return (
                <CheckboxChip
                  key={category}
                  label={CATEGORY_LABELS[category]}
                  checked={preferences.categories.includes(category)}
                  disabled={!supported}
                  disabledReason="None of your preferred sources supports this category"
                  onToggle={() =>
                    updatePreferences({
                      categories: toggleItem<Category>(preferences.categories, category),
                    })
                  }
                />
              )
            })}
          </div>
          {CATEGORIES.some((category) => !supportedCategories.has(category)) && (
            <p className="mt-3 text-xs text-stone-400">
              Grayed-out categories aren't offered by your preferred sources.
            </p>
          )}
        </PreferenceSection>

        <PreferenceSection
          title="Followed authors"
          description="Articles by these authors are pinned to the top of your feed. Enter a full name — matching is by whole word, so “Alex Hern” won’t catch “Hernandez”."
        >
          <AuthorTagInput
            authors={preferences.authors}
            onChange={(authors) => updatePreferences({ authors })}
          />
        </PreferenceSection>
      </div>
    </div>
  )
}

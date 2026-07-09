import { useState } from 'react'
import { usePreferences } from '../hooks/usePreferences'
import { CheckboxChip } from '../components/ui/CheckboxChip'
import type { SourceId } from '../domain/article'
import { CATEGORIES, CATEGORY_LABELS, type Category } from '../domain/category'
import { ALL_SOURCES, getEffectiveSources } from '../services/news/registry'

function toggleItem<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item]
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
      <div className="mt-4">{children}</div>
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
      <div className="flex gap-2">
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
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none"
        />
        <button
          type="button"
          onClick={addAuthor}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Follow
        </button>
      </div>

      {authors.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {authors.map((author) => (
            <li
              key={author}
              className="flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pr-1.5 pl-3 text-sm text-slate-700"
            >
              {author}
              <button
                type="button"
                aria-label={`Unfollow ${author}`}
                onClick={() => onChange(authors.filter((entry) => entry !== author))}
                className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <svg
                  className="h-4 w-4"
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
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <p className="text-slate-600">
        Choose the sources, categories, and authors that shape your For You feed.
      </p>

      <SectionCard
        title="Preferred sources"
        description="Only articles from these sources appear in your feed. None selected means all sources."
      >
        <div className="flex flex-wrap gap-2">
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
      </SectionCard>

      <SectionCard
        title="Preferred categories"
        description="Your feed pulls the latest articles from each selected category. None selected means general news."
      >
        <div className="flex flex-wrap gap-2">
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
          <p className="mt-3 text-xs text-slate-500">
            Grayed-out categories aren't offered by your preferred sources.
          </p>
        )}
      </SectionCard>

      <SectionCard
        title="Followed authors"
        description="Articles by these authors are pinned to the top of your feed."
      >
        <AuthorTagInput
          authors={preferences.authors}
          onChange={(authors) => updatePreferences({ authors })}
        />
      </SectionCard>
    </div>
  )
}

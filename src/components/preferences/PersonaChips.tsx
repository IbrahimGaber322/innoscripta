import { CATEGORY_LABELS } from '../../domain/category'
import type { Preferences } from '../../domain/preferences'
import { getSourceLabel } from '../../services/news/registry'

interface Chip {
  key: string
  label: string
  color: string
  border: string
}

/** Small pills describing what the For You feed is built from. */
export function PersonaChips({ preferences }: { preferences: Preferences }) {
  const chips: Chip[] = [
    ...preferences.categories.map((category) => ({
      key: `category-${category}`,
      label: CATEGORY_LABELS[category],
      color: '#1D4ED8',
      border: '#C3D4F8',
    })),
    ...preferences.sources.map((source) => ({
      key: `source-${source}`,
      label: getSourceLabel(source),
      color: '#44403C',
      border: '#D6D3D1',
    })),
    ...preferences.authors.map((author) => ({
      key: `author-${author}`,
      label: `@ ${author}`,
      color: '#B45309',
      border: '#EBD5B3',
    })),
  ]

  if (chips.length === 0) {
    return <span className="text-stone-600">the latest across all sources</span>
  }

  return (
    <>
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center rounded-full border px-3 py-1 text-[12.5px] font-semibold"
          style={{ color: chip.color, borderColor: chip.border }}
        >
          {chip.label}
        </span>
      ))}
    </>
  )
}

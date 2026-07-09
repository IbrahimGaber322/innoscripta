import { CATEGORIES, CATEGORY_LABELS, type Category } from '../../domain/category'

interface CategoryTabsProps {
  /** Selected categories; empty means all. */
  value: Category[]
  onChange: (categories: Category[]) => void
}

/** Multi-select category row styled as underlined text tabs. */
export function CategoryTabs({ value, onChange }: CategoryTabsProps) {
  function toggle(category: Category) {
    onChange(
      value.includes(category)
        ? value.filter((entry) => entry !== category)
        : [...value, category],
    )
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
      {CATEGORIES.map((category) => {
        const selected = value.includes(category)
        return (
          <button
            key={category}
            type="button"
            onClick={() => toggle(category)}
            aria-pressed={selected}
            className={`border-b-2 pb-1 text-sm transition-colors ${
              selected
                ? 'border-ink text-ink font-semibold'
                : 'hover:text-ink border-transparent font-medium text-stone-500'
            }`}
          >
            {CATEGORY_LABELS[category]}
          </button>
        )
      })}
    </div>
  )
}

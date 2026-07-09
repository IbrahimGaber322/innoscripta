import {
  CATEGORIES,
  CATEGORY_LABELS,
  isCategory,
  type Category,
} from '../../domain/category'

interface CategorySelectProps {
  value?: Category
  onChange: (category?: Category) => void
}

export function CategorySelect({ value, onChange }: CategorySelectProps) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
      Category
      <select
        value={value ?? ''}
        onChange={(event) => {
          const selected = event.target.value
          onChange(isCategory(selected) ? selected : undefined)
        }}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none"
      >
        <option value="">All categories</option>
        {CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {CATEGORY_LABELS[category]}
          </option>
        ))}
      </select>
    </label>
  )
}

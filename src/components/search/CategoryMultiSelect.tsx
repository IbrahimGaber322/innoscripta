import { CATEGORIES, CATEGORY_LABELS, type Category } from '../../domain/category'
import { CheckboxChip } from '../ui/CheckboxChip'

interface CategoryMultiSelectProps {
  /** Selected categories; empty means all. */
  value: Category[]
  onChange: (categories: Category[]) => void
}

export function CategoryMultiSelect({ value, onChange }: CategoryMultiSelectProps) {
  function toggle(category: Category) {
    onChange(
      value.includes(category)
        ? value.filter((entry) => entry !== category)
        : [...value, category],
    )
  }

  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="text-xs font-medium text-slate-600">
        Categories <span className="font-normal">(none checked = all)</span>
      </legend>
      <div className="flex flex-wrap gap-2 pt-1">
        {CATEGORIES.map((category) => (
          <CheckboxChip
            key={category}
            label={CATEGORY_LABELS[category]}
            checked={value.includes(category)}
            onToggle={() => toggle(category)}
          />
        ))}
      </div>
    </fieldset>
  )
}

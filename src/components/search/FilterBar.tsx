import type { SearchFilters } from '../../hooks/useSearchFilters'
import { CategorySelect } from './CategorySelect'
import { DateRangeFields } from './DateRangeFields'
import { SourceMultiSelect } from './SourceMultiSelect'

interface FilterBarProps {
  filters: SearchFilters
  onChange: (patch: Partial<SearchFilters>) => void
  onClear: () => void
  hasActiveFilters: boolean
}

export function FilterBar({
  filters,
  onChange,
  onClear,
  hasActiveFilters,
}: FilterBarProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CategorySelect
          value={filters.category}
          onChange={(category) => onChange({ category })}
        />
        <DateRangeFields
          fromDate={filters.fromDate}
          toDate={filters.toDate}
          onChange={(range) => onChange(range)}
        />
        <SourceMultiSelect
          value={filters.sourceIds}
          onChange={(sourceIds) => onChange({ sourceIds })}
        />
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 text-sm font-medium text-sky-700 hover:text-sky-900"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}

import type { SearchFilters } from '../../hooks/useSearchFilters'
import { CategoryMultiSelect } from './CategoryMultiSelect'
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <CategoryMultiSelect
            value={filters.categories}
            onChange={(categories) => onChange({ categories })}
          />
        </div>
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

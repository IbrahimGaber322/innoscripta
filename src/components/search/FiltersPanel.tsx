import type { SearchFilters } from '../../hooks/useSearchFilters'
import { ALL_SOURCES } from '../../services/news/registry'
import { CheckboxChip } from '../ui/CheckboxChip'

interface FiltersPanelProps {
  filters: SearchFilters
  onChange: (patch: Partial<SearchFilters>) => void
  onClear: () => void
  hasActiveFilters: boolean
}

const GROUP_LABEL = 'text-[11px] font-semibold tracking-widest uppercase text-stone-400'

const DATE_INPUT =
  'border-0 border-b border-stone-300 bg-transparent py-1 text-[13px] text-stone-600 focus:border-ink focus:outline-none'

/** Expandable panel with the source and date refinements. */
export function FiltersPanel({
  filters,
  onChange,
  onClear,
  hasActiveFilters,
}: FiltersPanelProps) {
  function toggleSource(sourceId: SearchFilters['sourceIds'][number]) {
    onChange({
      sourceIds: filters.sourceIds.includes(sourceId)
        ? filters.sourceIds.filter((id) => id !== sourceId)
        : [...filters.sourceIds, sourceId],
    })
  }

  return (
    <div className="bg-panel mt-5 flex flex-wrap items-center gap-x-10 gap-y-4 rounded-lg px-7 py-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className={GROUP_LABEL}>Sources</span>
        {ALL_SOURCES.map((source) => (
          <CheckboxChip
            key={source.id}
            label={source.name}
            checked={filters.sourceIds.includes(source.id)}
            onToggle={() => toggleSource(source.id)}
          />
        ))}
      </div>

      <div className="flex items-center gap-3">
        <span className={GROUP_LABEL}>Dates</span>
        <input
          type="date"
          aria-label="From date"
          value={filters.fromDate ?? ''}
          max={filters.toDate}
          onChange={(event) => onChange({ fromDate: event.target.value || undefined })}
          className={DATE_INPUT}
        />
        <span className="text-[13px] text-stone-400">–</span>
        <input
          type="date"
          aria-label="To date"
          value={filters.toDate ?? ''}
          min={filters.fromDate}
          onChange={(event) => onChange({ toDate: event.target.value || undefined })}
          className={DATE_INPUT}
        />
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="text-accent hover:text-ink ml-auto text-[13px] font-semibold transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}

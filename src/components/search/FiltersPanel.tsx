import type { SearchFilters } from '../../hooks/useSearchFilters'
import { todayISO } from '../../lib/formatDate'
import { ALL_SOURCES } from '../../services/news/registry'
import { CheckboxChip } from '../ui/CheckboxChip'
import { DatePicker } from './DatePicker'

interface FiltersPanelProps {
  filters: SearchFilters
  onChange: (patch: Partial<SearchFilters>) => void
  onClear: () => void
  hasActiveFilters: boolean
}

const GROUP_LABEL = 'text-[11px] font-semibold tracking-widest uppercase text-stone-400'

/** Expandable panel with the source and date refinements. */
export function FiltersPanel({
  filters,
  onChange,
  onClear,
  hasActiveFilters,
}: FiltersPanelProps) {
  const today = todayISO()

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

      <div className="flex flex-wrap items-center gap-2.5">
        <span className={GROUP_LABEL}>Dates</span>
        <span className="text-[11px] font-semibold tracking-widest text-stone-400 uppercase">
          From
        </span>
        <DatePicker
          ariaLabel="From date"
          placeholder="Any date"
          value={filters.fromDate}
          // Never past today, and never after the "to" date.
          max={filters.toDate && filters.toDate < today ? filters.toDate : today}
          onChange={(value) => onChange({ fromDate: value })}
        />
        <span className="text-[11px] font-semibold tracking-widest text-stone-400 uppercase">
          To
        </span>
        <DatePicker
          ariaLabel="To date"
          placeholder="Any date"
          value={filters.toDate}
          min={filters.fromDate}
          max={today}
          onChange={(value) => onChange({ toDate: value })}
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

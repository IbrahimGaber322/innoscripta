import type { SearchFilters } from '../../hooks/useSearchFilters'
import { todayISO } from '../../lib/formatDate'
import { ALL_SOURCES } from '../../services/news/registry'
import { CheckboxChip } from '../ui/CheckboxChip'

interface FiltersPanelProps {
  filters: SearchFilters
  onChange: (patch: Partial<SearchFilters>) => void
  onClear: () => void
  hasActiveFilters: boolean
}

const GROUP_LABEL = 'text-[11px] font-semibold tracking-widest uppercase text-stone-400'

const DATE_FIELD =
  'rounded-lg border border-stone-300 bg-paper px-3 py-1.5 text-[13px] text-stone-700 shadow-sm transition-colors [color-scheme:light] focus:border-ink focus:ring-2 focus:ring-stone-200 focus:outline-none'

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

  // Never accept a date past today, even if one is typed into the field.
  function setDate(key: 'fromDate' | 'toDate', value: string) {
    if (value && value > today) return
    onChange({ [key]: value || undefined })
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
        <label className="flex items-center gap-2 text-[11px] font-semibold tracking-widest text-stone-400 uppercase">
          From
          <input
            type="date"
            aria-label="From date"
            value={filters.fromDate ?? ''}
            max={filters.toDate && filters.toDate < today ? filters.toDate : today}
            onChange={(event) => setDate('fromDate', event.target.value)}
            className={DATE_FIELD}
          />
        </label>
        <label className="flex items-center gap-2 text-[11px] font-semibold tracking-widest text-stone-400 uppercase">
          To
          <input
            type="date"
            aria-label="To date"
            value={filters.toDate ?? ''}
            min={filters.fromDate}
            max={today}
            onChange={(event) => setDate('toDate', event.target.value)}
            className={DATE_FIELD}
          />
        </label>
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

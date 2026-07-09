import { useEffect, useRef, useState } from 'react'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'

interface SearchBarProps {
  value: string
  onChange: (keyword: string) => void
  filtersOpen: boolean
  onToggleFilters: () => void
  /** Active refinements inside the filter panel (sources, dates). */
  filterCount: number
}

/**
 * Keyword input with debounced writes: keystrokes update local state
 * immediately, the URL only after the user pauses typing. The Filters
 * button toggles the expandable panel below.
 */
export function SearchBar({
  value,
  onChange,
  filtersOpen,
  onToggleFilters,
  filterCount,
}: SearchBarProps) {
  const [input, setInput] = useState(value)
  const debouncedInput = useDebouncedValue(input)
  const lastEmitted = useRef(value)

  useEffect(() => {
    if (debouncedInput !== lastEmitted.current) {
      lastEmitted.current = debouncedInput
      onChange(debouncedInput)
    }
  }, [debouncedInput, onChange])

  // Adopt external changes (back button, clear filters) without re-emitting.
  useEffect(() => {
    if (value !== lastEmitted.current) {
      lastEmitted.current = value
      setInput(value)
    }
  }, [value])

  return (
    <div className="mt-8 flex items-center gap-4 border-b border-stone-300 pb-3">
      <svg
        className="h-4.5 w-4.5 shrink-0 text-stone-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>

      <input
        type="search"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Search articles by keyword"
        aria-label="Search articles"
        className="text-ink flex-1 border-none bg-transparent text-base placeholder:text-stone-400 focus:outline-none"
      />

      <button
        type="button"
        onClick={onToggleFilters}
        aria-expanded={filtersOpen}
        className={`flex shrink-0 items-center gap-2 text-[13px] font-semibold transition-colors ${
          filtersOpen ? 'text-ink' : 'hover:text-ink text-stone-600'
        }`}
      >
        <svg
          className="h-3.75 w-3.75"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 6h16M7 12h10M10 18h4" />
        </svg>
        Filters
        {filterCount > 0 && (
          <span className="bg-accent text-paper inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold">
            {filterCount}
          </span>
        )}
      </button>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'

interface SearchBarProps {
  value: string
  onChange: (keyword: string) => void
}

/**
 * Keyword input with debounced writes: keystrokes update local state
 * immediately, the URL only after the user pauses typing.
 */
export function SearchBar({ value, onChange }: SearchBarProps) {
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
    <div className="relative">
      <svg
        className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
        />
      </svg>
      <input
        type="search"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Search articles by keyword..."
        aria-label="Search articles"
        className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pr-4 pl-10 text-sm shadow-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none"
      />
    </div>
  )
}

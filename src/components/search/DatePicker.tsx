import { useEffect, useMemo, useRef, useState } from 'react'
import { formatDate } from '../../lib/formatDate'

interface DatePickerProps {
  /** Selected date as YYYY-MM-DD. */
  value?: string
  onChange: (value: string | undefined) => void
  /** Inclusive bounds as YYYY-MM-DD. */
  min?: string
  max?: string
  ariaLabel: string
  placeholder?: string
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function toISO(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function fromISO(value?: string): Date | null {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

/** Six weeks of day cells covering (and padding around) the shown month. */
function buildWeeks(view: Date): { date: Date; inMonth: boolean }[][] {
  const first = new Date(view.getFullYear(), view.getMonth(), 1)
  const cursor = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay())
  return Array.from({ length: 6 }, () =>
    Array.from({ length: 7 }, () => {
      const cell = {
        date: new Date(cursor),
        inMonth: cursor.getMonth() === view.getMonth(),
      }
      cursor.setDate(cursor.getDate() + 1)
      return cell
    }),
  )
}

/** A themed calendar field that replaces the unstyleable native date popup. */
export function DatePicker({
  value,
  onChange,
  min,
  max,
  ariaLabel,
  placeholder = 'Any date',
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = fromISO(value)
  const today = toISO(new Date())
  const [view, setView] = useState<Date>(() => selected ?? fromISO(max) ?? new Date())

  // Re-centre on the selected month each time the calendar opens.
  useEffect(() => {
    if (open) setView(fromISO(value) ?? fromISO(max) ?? new Date())
  }, [open, value, max])

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const weeks = useMemo(() => buildWeeks(view), [view])

  function isDisabled(date: Date): boolean {
    const iso = toISO(date)
    return (min !== undefined && iso < min) || (max !== undefined && iso > max)
  }

  function pick(date: Date) {
    if (isDisabled(date)) return
    onChange(toISO(date))
    setOpen(false)
  }

  const prevMonthLast = toISO(new Date(view.getFullYear(), view.getMonth(), 0))
  const nextMonthFirst = toISO(new Date(view.getFullYear(), view.getMonth() + 1, 1))
  const prevDisabled = min !== undefined && prevMonthLast < min
  const nextDisabled = max !== undefined && nextMonthFirst > max
  const todayDisabled =
    (min !== undefined && today < min) || (max !== undefined && today > max)

  function shiftMonth(delta: number) {
    setView((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1))
  }

  const navButton =
    'flex h-7 w-7 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30'

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px] shadow-sm transition-colors ${
          open ? 'border-ink' : 'border-stone-300 hover:border-stone-400'
        } bg-paper`}
      >
        <svg
          className="h-3.5 w-3.5 text-stone-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden="true"
        >
          <rect x="3" y="4.5" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 3v3M16 3v3" />
        </svg>
        <span className={selected ? 'text-stone-700' : 'text-stone-400'}>
          {selected ? formatDate(value!) : placeholder}
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={ariaLabel}
          className="bg-paper absolute left-0 z-20 mt-2 w-72 rounded-xl border border-stone-200 p-3 shadow-lg"
        >
          <div className="flex items-center justify-between px-1">
            <div className="font-serif text-[15px] font-medium">
              {MONTHS[view.getMonth()]} {view.getFullYear()}
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                className={navButton}
                aria-label="Previous month"
                disabled={prevDisabled}
                onClick={() => shiftMonth(-1)}
              >
                ‹
              </button>
              <button
                type="button"
                className={navButton}
                aria-label="Next month"
                disabled={nextDisabled}
                onClick={() => shiftMonth(1)}
              >
                ›
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-y-1 text-center">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="text-[11px] font-semibold tracking-wide text-stone-400 uppercase"
              >
                {day}
              </div>
            ))}
            {weeks.flat().map(({ date, inMonth }) => {
              const iso = toISO(date)
              const disabled = isDisabled(date)
              const isSelected = value === iso
              const isToday = today === iso
              return (
                <div key={iso} className="flex justify-center">
                  <button
                    type="button"
                    disabled={disabled}
                    aria-label={formatDate(iso)}
                    aria-current={isToday ? 'date' : undefined}
                    aria-pressed={isSelected}
                    onClick={() => pick(date)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] transition-colors ${
                      isSelected
                        ? 'bg-ink text-paper font-semibold'
                        : disabled
                          ? 'cursor-not-allowed text-stone-300'
                          : inMonth
                            ? 'text-stone-700 hover:bg-stone-100'
                            : 'text-stone-400 hover:bg-stone-100'
                    } ${isToday && !isSelected ? 'ring-accent ring-1 ring-inset' : ''}`}
                  >
                    {date.getDate()}
                  </button>
                </div>
              )
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-stone-100 px-1 pt-2">
            <button
              type="button"
              onClick={() => {
                onChange(undefined)
                setOpen(false)
              }}
              className="hover:text-ink text-[12.5px] font-semibold text-stone-500 transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              disabled={todayDisabled}
              onClick={() => pick(new Date())}
              className="text-accent hover:text-ink text-[12.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

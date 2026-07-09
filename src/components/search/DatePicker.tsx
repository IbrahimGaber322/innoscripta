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

const POPOVER_WIDTH = 288 // matches w-72

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function toISO(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Parses YYYY-MM-DD, rejecting impossible dates (e.g. 2026-02-30 overflows). */
function fromISO(value?: string): Date | null {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

/** Six weeks of day cells covering (and padding around) the shown month. */
function buildWeeks(view: Date): { date: Date; inMonth: boolean }[][] {
  const first = startOfMonth(view)
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
  const triggerRef = useRef<HTMLButtonElement>(null)
  const focusedDayRef = useRef<HTMLButtonElement | null>(null)

  const selected = fromISO(value)
  const today = toISO(new Date())
  const [view, setView] = useState<Date>(() => selected ?? fromISO(max) ?? new Date())
  // The keyboard-focused day within the grid (roving tabindex).
  const [focusISO, setFocusISO] = useState<string | null>(null)
  // Horizontal shift (px, relative to the trigger) that keeps the popover on
  // screen even when the field sits near the right edge on small viewports.
  const [offsetLeft, setOffsetLeft] = useState(0)

  function clampToRange(date: Date): Date {
    const iso = toISO(date)
    if (min !== undefined && iso < min) return fromISO(min) ?? date
    if (max !== undefined && iso > max) return fromISO(max) ?? date
    return date
  }

  function close(returnFocus = true) {
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }

  // On open: seed the view + keyboard focus, and clamp the popover to the viewport.
  useEffect(() => {
    if (!open) return
    const base = clampToRange(fromISO(value) ?? new Date())
    setView(startOfMonth(base))
    setFocusISO(toISO(base))

    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      const width = Math.min(POPOVER_WIDTH, window.innerWidth - 16)
      const wantLeft = Math.max(8, Math.min(rect.left, window.innerWidth - 8 - width))
      setOffsetLeft(wantLeft - rect.left)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Keep the roving-tabindex day focused as it moves.
  useEffect(() => {
    if (open && focusISO) focusedDayRef.current?.focus()
  }, [open, focusISO])

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) close(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const weeks = useMemo(() => buildWeeks(view), [view])

  function isDisabled(date: Date): boolean {
    const iso = toISO(date)
    return (min !== undefined && iso < min) || (max !== undefined && iso > max)
  }

  function pick(date: Date) {
    if (isDisabled(date)) return
    onChange(toISO(date))
    close()
  }

  function moveFocus(next: Date) {
    const clamped = clampToRange(next)
    setFocusISO(toISO(clamped))
    setView(startOfMonth(clamped))
  }

  function onGridKeyDown(event: React.KeyboardEvent) {
    const current = focusISO ? fromISO(focusISO) : null
    if (!current) return
    switch (event.key) {
      case 'ArrowLeft':
        moveFocus(addDays(current, -1))
        break
      case 'ArrowRight':
        moveFocus(addDays(current, 1))
        break
      case 'ArrowUp':
        moveFocus(addDays(current, -7))
        break
      case 'ArrowDown':
        moveFocus(addDays(current, 7))
        break
      case 'Home':
        moveFocus(addDays(current, -current.getDay()))
        break
      case 'End':
        moveFocus(addDays(current, 6 - current.getDay()))
        break
      case 'PageUp':
        moveFocus(
          new Date(current.getFullYear(), current.getMonth() - 1, current.getDate()),
        )
        break
      case 'PageDown':
        moveFocus(
          new Date(current.getFullYear(), current.getMonth() + 1, current.getDate()),
        )
        break
      case 'Enter':
      case ' ':
        pick(current)
        break
      default:
        return
    }
    event.preventDefault()
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
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
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
          aria-modal="true"
          aria-label={ariaLabel}
          style={{ left: offsetLeft }}
          className="bg-paper absolute z-20 mt-2 w-[min(18rem,calc(100vw-1rem))] rounded-xl border border-stone-200 p-3 shadow-lg"
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

          <div
            role="grid"
            onKeyDown={onGridKeyDown}
            className="mt-3 grid grid-cols-7 gap-y-1 text-center"
          >
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
              const isFocusTarget = focusISO === iso
              return (
                <div key={iso} className="flex justify-center">
                  <button
                    ref={isFocusTarget ? focusedDayRef : undefined}
                    type="button"
                    disabled={disabled}
                    tabIndex={isFocusTarget ? 0 : -1}
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
                close()
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

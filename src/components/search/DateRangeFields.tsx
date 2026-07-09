interface DateRangeFieldsProps {
  fromDate?: string
  toDate?: string
  onChange: (range: { fromDate?: string; toDate?: string }) => void
}

export function DateRangeFields({ fromDate, toDate, onChange }: DateRangeFieldsProps) {
  const inputClass =
    'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none'

  return (
    <div className="flex gap-3">
      <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
        From
        <input
          type="date"
          value={fromDate ?? ''}
          max={toDate}
          onChange={(event) =>
            onChange({ fromDate: event.target.value || undefined, toDate })
          }
          className={inputClass}
        />
      </label>
      <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
        To
        <input
          type="date"
          value={toDate ?? ''}
          min={fromDate}
          onChange={(event) =>
            onChange({ fromDate, toDate: event.target.value || undefined })
          }
          className={inputClass}
        />
      </label>
    </div>
  )
}

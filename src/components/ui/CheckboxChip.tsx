interface CheckboxChipProps {
  label: string
  checked: boolean
  onToggle: () => void
  disabled?: boolean
  /** Tooltip explaining why the chip is disabled. */
  disabledReason?: string
}

/** A pill-shaped checkbox used for source and category pickers. */
export function CheckboxChip({
  label,
  checked,
  onToggle,
  disabled = false,
  disabledReason,
}: CheckboxChipProps) {
  return (
    <label
      title={disabled ? disabledReason : undefined}
      className={`rounded-full border px-3 py-1.5 text-sm select-none ${
        disabled
          ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
          : checked
            ? 'cursor-pointer border-sky-600 bg-sky-50 font-medium text-sky-800'
            : 'cursor-pointer border-slate-300 bg-white text-slate-600 hover:border-slate-400'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        disabled={disabled}
        className="sr-only"
      />
      {label}
    </label>
  )
}

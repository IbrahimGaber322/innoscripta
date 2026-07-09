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
      className={`rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors select-none ${
        disabled
          ? 'cursor-not-allowed border-stone-200 bg-stone-100 text-stone-300'
          : checked
            ? 'border-ink bg-ink text-paper cursor-pointer'
            : 'cursor-pointer border-stone-300 bg-transparent text-stone-600 hover:border-stone-500'
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

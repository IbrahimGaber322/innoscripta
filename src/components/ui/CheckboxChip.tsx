interface CheckboxChipProps {
  label: string
  checked: boolean
  onToggle: () => void
}

/** A pill-shaped checkbox used for source and category pickers. */
export function CheckboxChip({ label, checked, onToggle }: CheckboxChipProps) {
  return (
    <label
      className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm select-none ${
        checked
          ? 'border-sky-600 bg-sky-50 font-medium text-sky-800'
          : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
      }`}
    >
      <input type="checkbox" checked={checked} onChange={onToggle} className="sr-only" />
      {label}
    </label>
  )
}

import type { SourceId } from '../../domain/article'
import { ALL_SOURCES } from '../../services/news/registry'

interface SourceMultiSelectProps {
  /** Selected sources; empty means all. */
  value: SourceId[]
  onChange: (sourceIds: SourceId[]) => void
}

export function SourceMultiSelect({ value, onChange }: SourceMultiSelectProps) {
  function toggle(sourceId: SourceId) {
    onChange(
      value.includes(sourceId)
        ? value.filter((id) => id !== sourceId)
        : [...value, sourceId],
    )
  }

  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="text-xs font-medium text-slate-600">
        Sources <span className="font-normal">(none checked = all)</span>
      </legend>
      <div className="flex flex-wrap gap-2 pt-1">
        {ALL_SOURCES.map((source) => {
          const checked = value.includes(source.id)
          return (
            <label
              key={source.id}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm select-none ${
                checked
                  ? 'border-sky-600 bg-sky-50 font-medium text-sky-800'
                  : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(source.id)}
                className="sr-only"
              />
              {source.name}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

import type { SourceId } from '../../domain/article'
import { ALL_SOURCES } from '../../services/news/registry'
import { CheckboxChip } from '../ui/CheckboxChip'

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
        {ALL_SOURCES.map((source) => (
          <CheckboxChip
            key={source.id}
            label={source.name}
            checked={value.includes(source.id)}
            onToggle={() => toggle(source.id)}
          />
        ))}
      </div>
    </fieldset>
  )
}

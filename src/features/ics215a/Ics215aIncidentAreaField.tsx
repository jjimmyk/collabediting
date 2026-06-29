import {
  Ics202FieldLabel,
  Ics202ReadOnlyField,
} from '@/features/ics202/Ics202SectionToolbar'
import { formatIcs215aIncidentAreaLabel } from '@/features/ics215a/location-utils'
import type { Ics215aIncidentArea } from '@/features/ics215a/types'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from '@/components/ui/native-select'
import { Input } from '@/components/ui/input'

const CUSTOM_AREA_VALUE = '__custom__'

type Ics215aIncidentAreaFieldProps = {
  value: Ics215aIncidentArea
  onChange: (value: Ics215aIncidentArea) => void
  positionCatalog: WorkspacePositionCatalog
  canEdit: boolean
  label?: string
}

export function Ics215aIncidentAreaField({
  value,
  onChange,
  positionCatalog,
  canEdit,
  label = '5. Incident Area',
}: Ics215aIncidentAreaFieldProps) {
  const selectValue =
    value.kind === 'roster-position' && value.position.trim()
      ? value.position
      : CUSTOM_AREA_VALUE

  if (!canEdit) {
    return (
      <div className="space-y-1">
        <Ics202FieldLabel>{label}</Ics202FieldLabel>
        <Ics202ReadOnlyField
          value={formatIcs215aIncidentAreaLabel(value, positionCatalog)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <Ics202FieldLabel>{label}</Ics202FieldLabel>
      <NativeSelect
        value={selectValue}
        onChange={(event) => {
          const next = event.target.value
          if (next === CUSTOM_AREA_VALUE) {
            onChange({
              kind: 'custom',
              name: value.kind === 'custom' ? value.name : '',
            })
            return
          }
          onChange({ kind: 'roster-position', position: next })
        }}
        className="h-8 w-full text-xs"
      >
        <NativeSelectOption value="">Select incident area</NativeSelectOption>
        <NativeSelectOptGroup label="Roster positions">
          {positionCatalog.rosterPositionNames.map((position) => (
            <NativeSelectOption key={position} value={position}>
              {position}
            </NativeSelectOption>
          ))}
        </NativeSelectOptGroup>
        <NativeSelectOption value={CUSTOM_AREA_VALUE}>Custom area</NativeSelectOption>
      </NativeSelect>
      {selectValue === CUSTOM_AREA_VALUE && (
        <Input
          value={value.kind === 'custom' ? value.name : ''}
          onChange={(event) =>
            onChange({ kind: 'custom', name: event.target.value })
          }
          placeholder="Custom area name"
          className="h-8 text-xs"
        />
      )}
    </div>
  )
}

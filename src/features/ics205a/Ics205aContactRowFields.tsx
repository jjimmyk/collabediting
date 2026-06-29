import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from '@/components/ui/native-select'
import {
  Ics202FieldLabel,
  Ics202ReadOnlyField,
} from '@/features/ics202/Ics202SectionToolbar'
import {
  ICS205A_ASSIGNED_POSITION_GROUPS,
  ICS205A_CUSTOM_NAME_VALUE,
  ICS205A_NAME_GROUPS,
  buildIcs205aAssignedPositionOptions,
  buildIcs205aContactNameOptions,
  encodeCustomIcs205aName,
  isCustomIcs205aName,
  mergeLegacyIcs205aContactNameOption,
  parseCustomIcs205aName,
  resolveDefaultNameForAssignedPosition,
  resolveIcs205aContactDisplayLabels,
  type Ics205aContactRowOptionsInput,
} from '@/features/ics205a/ics205a-contact-row-options'
import type { Ics205aContactRow } from '@/features/ics205a/types'
import { cn } from '@/lib/utils'

type Ics205aContactRowFieldsProps = {
  row: Ics205aContactRow
  canEdit: boolean
  layout?: 'stack' | 'table'
  optionsInput: Ics205aContactRowOptionsInput
  onChange: (patch: Partial<Ics205aContactRow>) => void
}

function renderGroupedOptions(
  groups: readonly string[],
  options: Array<{ value: string; label: string; group: string; disabled?: boolean }>
) {
  return groups.map((group) => {
    const groupOptions = options.filter((option) => option.group === group)
    if (groupOptions.length === 0) return null
    return (
      <NativeSelectOptGroup key={group} label={group}>
        {groupOptions.map((option) => (
          <NativeSelectOption key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelectOptGroup>
    )
  })
}

function useIcs205aContactRowFieldState(
  row: Ics205aContactRow,
  optionsInput: Ics205aContactRowOptionsInput,
  onChange: (patch: Partial<Ics205aContactRow>) => void
) {
  const displayLabels = useMemo(
    () => resolveIcs205aContactDisplayLabels(row, optionsInput),
    [row, optionsInput]
  )

  const assignedPositionOptions = useMemo(
    () => buildIcs205aAssignedPositionOptions(optionsInput, row.assignedPosition),
    [optionsInput, row.assignedPosition]
  )

  const nameOptions = useMemo(() => {
    const base = buildIcs205aContactNameOptions(optionsInput, row.assignedPosition)
    return mergeLegacyIcs205aContactNameOption(base, row.name, optionsInput.roster, {
      assetsByKey: optionsInput.assetsByKey,
    })
  }, [optionsInput, row.assignedPosition, row.name])

  const nameSelectValue = isCustomIcs205aName(row.name)
    ? ICS205A_CUSTOM_NAME_VALUE
    : row.name

  const handleAssignedPositionChange = (value: string) => {
    const defaultName = resolveDefaultNameForAssignedPosition(value, optionsInput)
    onChange({
      assignedPosition: value,
      name: defaultName,
    })
  }

  return {
    displayLabels,
    assignedPositionOptions,
    nameOptions,
    nameSelectValue,
    handleAssignedPositionChange,
  }
}

const fieldClassName = 'h-8 w-full text-xs'

export function Ics205aContactRowTableCells({
  row,
  canEdit,
  optionsInput,
  onChange,
}: Omit<Ics205aContactRowFieldsProps, 'layout'>) {
  const {
    displayLabels,
    assignedPositionOptions,
    nameOptions,
    nameSelectValue,
    handleAssignedPositionChange,
  } = useIcs205aContactRowFieldState(row, optionsInput, onChange)

  if (!canEdit) {
    return (
      <>
        <td className="px-2 py-2 align-top">{displayLabels.assignedPosition}</td>
        <td className="px-2 py-2 align-top">{displayLabels.name}</td>
        <td className="px-2 py-2 align-top">{row.cellPhone}</td>
        <td className="px-2 py-2 align-top">{row.radioFrequency}</td>
        <td className="px-2 py-2 align-top">{row.other}</td>
      </>
    )
  }

  return (
    <>
      <td className="min-w-[14rem] px-2 py-2 align-top">
        <NativeSelect
          value={row.assignedPosition}
          onChange={(event) => handleAssignedPositionChange(event.target.value)}
          className={cn(fieldClassName, 'w-full')}
        >
          <NativeSelectOption value="">Select position</NativeSelectOption>
          {renderGroupedOptions(ICS205A_ASSIGNED_POSITION_GROUPS, assignedPositionOptions)}
        </NativeSelect>
      </td>
      <td className="min-w-[14rem] px-2 py-2 align-top">
        <NativeSelect
          value={nameSelectValue}
          onChange={(event) => {
            const next = event.target.value
            if (next === ICS205A_CUSTOM_NAME_VALUE) {
              onChange({
                name: isCustomIcs205aName(row.name)
                  ? row.name
                  : encodeCustomIcs205aName(''),
              })
              return
            }
            onChange({ name: next })
          }}
          className={cn(fieldClassName, 'w-full')}
          disabled={!row.assignedPosition.trim() && nameOptions.length === 0}
        >
          <NativeSelectOption value="">Select name</NativeSelectOption>
          {renderGroupedOptions(ICS205A_NAME_GROUPS, nameOptions)}
          <NativeSelectOption value={ICS205A_CUSTOM_NAME_VALUE}>Custom name</NativeSelectOption>
        </NativeSelect>
        {nameSelectValue === ICS205A_CUSTOM_NAME_VALUE && (
          <Input
            value={parseCustomIcs205aName(row.name)}
            onChange={(event) => onChange({ name: encodeCustomIcs205aName(event.target.value) })}
            placeholder="Enter custom name"
            className="mt-1 h-8 text-xs"
          />
        )}
      </td>
      <td className="min-w-[10rem] px-2 py-2 align-top">
        <Input
          value={row.cellPhone}
          onChange={(event) => onChange({ cellPhone: event.target.value })}
          placeholder="Cell Phone #"
          className="h-8 w-full min-w-[9rem] text-xs"
        />
      </td>
      <td className="min-w-[10rem] px-2 py-2 align-top">
        <Input
          value={row.radioFrequency}
          onChange={(event) => onChange({ radioFrequency: event.target.value })}
          placeholder="Radio Frequency"
          className="h-8 w-full min-w-[9rem] text-xs"
        />
      </td>
      <td className="min-w-[10rem] px-2 py-2 align-top">
        <Input
          value={row.other}
          onChange={(event) => onChange({ other: event.target.value })}
          placeholder="Other"
          className="h-8 w-full min-w-[9rem] text-xs"
        />
      </td>
    </>
  )
}

export function Ics205aContactRowFields({
  row,
  canEdit,
  layout = 'stack',
  optionsInput,
  onChange,
}: Ics205aContactRowFieldsProps) {
  const {
    displayLabels,
    assignedPositionOptions,
    nameOptions,
    nameSelectValue,
    handleAssignedPositionChange,
  } = useIcs205aContactRowFieldState(row, optionsInput, onChange)

  if (layout === 'table') {
    return (
      <Ics205aContactRowTableCells
        row={row}
        canEdit={canEdit}
        optionsInput={optionsInput}
        onChange={onChange}
      />
    )
  }

  if (!canEdit) {
    return (
      <div className="space-y-2">
        <div className="space-y-1">
          <Ics202FieldLabel>Incident Assigned Position</Ics202FieldLabel>
          <Ics202ReadOnlyField value={displayLabels.assignedPosition} />
        </div>
        <div className="space-y-1">
          <Ics202FieldLabel>Name</Ics202FieldLabel>
          <Ics202ReadOnlyField value={displayLabels.name} />
        </div>
        <div className="space-y-1">
          <Ics202FieldLabel>Cell Phone #</Ics202FieldLabel>
          <Ics202ReadOnlyField value={row.cellPhone} />
        </div>
        <div className="space-y-1">
          <Ics202FieldLabel>Radio Frequency</Ics202FieldLabel>
          <Ics202ReadOnlyField value={row.radioFrequency} />
        </div>
        <div className="space-y-1">
          <Ics202FieldLabel>Other</Ics202FieldLabel>
          <Ics202ReadOnlyField value={row.other} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Ics202FieldLabel>Incident Assigned Position</Ics202FieldLabel>
        <NativeSelect
          value={row.assignedPosition}
          onChange={(event) => handleAssignedPositionChange(event.target.value)}
          className={fieldClassName}
        >
          <NativeSelectOption value="">Select position</NativeSelectOption>
          {renderGroupedOptions(ICS205A_ASSIGNED_POSITION_GROUPS, assignedPositionOptions)}
        </NativeSelect>
      </div>
      <div className="space-y-1">
        <Ics202FieldLabel>Name</Ics202FieldLabel>
        <NativeSelect
          value={nameSelectValue}
          onChange={(event) => {
            const next = event.target.value
            if (next === ICS205A_CUSTOM_NAME_VALUE) {
              onChange({
                name: isCustomIcs205aName(row.name)
                  ? row.name
                  : encodeCustomIcs205aName(''),
              })
              return
            }
            onChange({ name: next })
          }}
          className={fieldClassName}
          disabled={!row.assignedPosition.trim() && nameOptions.length === 0}
        >
          <NativeSelectOption value="">Select name</NativeSelectOption>
          {renderGroupedOptions(ICS205A_NAME_GROUPS, nameOptions)}
          <NativeSelectOption value={ICS205A_CUSTOM_NAME_VALUE}>Custom name</NativeSelectOption>
        </NativeSelect>
        {nameSelectValue === ICS205A_CUSTOM_NAME_VALUE && (
          <Input
            value={parseCustomIcs205aName(row.name)}
            onChange={(event) => onChange({ name: encodeCustomIcs205aName(event.target.value) })}
            placeholder="Enter custom name"
            className="mt-1 h-8 text-xs"
          />
        )}
      </div>
      <div className="space-y-1">
        <Ics202FieldLabel>Cell Phone #</Ics202FieldLabel>
        <Input
          value={row.cellPhone}
          onChange={(event) => onChange({ cellPhone: event.target.value })}
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-1">
        <Ics202FieldLabel>Radio Frequency</Ics202FieldLabel>
        <Input
          value={row.radioFrequency}
          onChange={(event) => onChange({ radioFrequency: event.target.value })}
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-1">
        <Ics202FieldLabel>Other</Ics202FieldLabel>
        <Input
          value={row.other}
          onChange={(event) => onChange({ other: event.target.value })}
          className="h-8 text-xs"
        />
      </div>
    </div>
  )
}

export function formatIcs205aContactRowSummary(
  row: Ics205aContactRow,
  optionsInput: Ics205aContactRowOptionsInput
): string {
  const { assignedPosition, name } = resolveIcs205aContactDisplayLabels(row, optionsInput)
  return (
    [assignedPosition, name, row.cellPhone, row.radioFrequency, row.other]
      .filter(Boolean)
      .join(' · ') || 'No contact details'
  )
}

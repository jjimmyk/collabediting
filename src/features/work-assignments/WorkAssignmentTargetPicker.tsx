import { useMemo } from 'react'
import { CompetencyFunctionSelect } from '@/features/roster/CompetencyFunctionSelect'
import {
  parseWorkAssignmentTarget,
  updateMemberTargetCompetency,
} from '@/lib/work-assignment-target'
import type { WorkAssignmentTargetOption } from '@/lib/work-assignment-target-options'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import { cn } from '@/lib/utils'

type WorkAssignmentTargetPickerProps = {
  value: string
  options: WorkAssignmentTargetOption[]
  editable: boolean
  roster?: WorkspaceRosterMember[]
  competencyOptions?: string[]
  showMemberCompetencyEditor?: boolean
  className?: string
  selectClassName?: string
  onChange: (value: string) => void
}

export function WorkAssignmentTargetPicker({
  value,
  options,
  editable,
  roster = [],
  competencyOptions = [],
  showMemberCompetencyEditor = false,
  className,
  selectClassName,
  onChange,
}: WorkAssignmentTargetPickerProps) {
  const target = useMemo(() => parseWorkAssignmentTarget(value, roster), [value, roster])
  const displayLabel =
    options.find((option) => option.value === value)?.label ??
    parseWorkAssignmentTarget(value, roster).label

  const groupedOptions = useMemo(() => {
    const groups = new Map<string, WorkAssignmentTargetOption[]>()
    for (const option of options) {
      const existing = groups.get(option.group) ?? []
      existing.push(option)
      groups.set(option.group, existing)
    }
    return [...groups.entries()]
  }, [options])

  if (!editable) {
    return (
      <p className={cn('truncate text-sm font-semibold leading-tight', className)}>
        {displayLabel || 'Unassigned'}
      </p>
    )
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <select
        value={value}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          event.stopPropagation()
          onChange(event.target.value)
        }}
        className={cn(
          'h-8 w-full max-w-md rounded-md border bg-transparent px-2 text-sm font-semibold outline-none',
          selectClassName
        )}
      >
        <option value="">Select assignee</option>
        {groupedOptions.map(([group, groupOptions]) => (
          <optgroup key={group} label={group}>
            {groupOptions.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {showMemberCompetencyEditor && target.type === 'member' ? (
        <CompetencyFunctionSelect
          compact
          value={target.competencyFunction}
          options={competencyOptions}
          onChange={(next) => onChange(updateMemberTargetCompetency(value, next, roster))}
        />
      ) : null}
    </div>
  )
}

export function WorkAssignmentTargetReadOnlyField({
  value,
  options,
  roster = [],
  className,
}: {
  value: string
  options: Array<{ value: string; label: string }>
  roster?: WorkspaceRosterMember[]
  className?: string
}) {
  const label =
    options.find((option) => option.value === value)?.label ??
    parseWorkAssignmentTarget(value, roster).label

  return (
    <p className={cn('truncate text-sm font-semibold leading-tight', className)}>
      {label || 'Unassigned'}
    </p>
  )
}

import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export type Ics204AssignedUnitOption = {
  value: string
  label: string
  disabled?: boolean
}

const NOBODY_SCHEDULED_SUFFIX = '(Nobody Scheduled for Next OP)'

export function classifyIcs204AssignedUnitOption(
  entry: PositionRosterEntry
): Ics204AssignedUnitOption | null {
  const { position, members, scheduledAssignees, scheduledUnassignees, opAdvanceLabel } = entry

  if (opAdvanceLabel === 'retire_on_op_advance') {
    return null
  }

  const hasCurrentMembers = members.length > 0
  const hasScheduledAssignees = scheduledAssignees.length > 0

  if (!hasCurrentMembers && !hasScheduledAssignees) {
    return null
  }

  const allCurrentRetiring =
    hasCurrentMembers &&
    members.every((member) => scheduledUnassignees.some((scheduled) => scheduled.id === member.id))

  if (allCurrentRetiring && !hasScheduledAssignees) {
    return {
      value: position,
      label: `${position} ${NOBODY_SCHEDULED_SUFFIX}`,
      disabled: true,
    }
  }

  return {
    value: position,
    label: position,
    disabled: false,
  }
}

export function buildIcs204AssignedUnitOptions(
  entries: PositionRosterEntry[]
): Ics204AssignedUnitOption[] {
  return entries
    .map((entry) => classifyIcs204AssignedUnitOption(entry))
    .filter((option): option is Ics204AssignedUnitOption => option !== null)
    .sort((left, right) => left.label.localeCompare(right.label))
}

export function mergeLegacyIcs204AssignedUnitOption(
  options: Ics204AssignedUnitOption[],
  currentValue: string
): Ics204AssignedUnitOption[] {
  const trimmed = currentValue.trim()
  if (!trimmed || options.some((option) => option.value === trimmed)) {
    return options
  }

  return [
    ...options,
    {
      value: trimmed,
      label: `${trimmed} (legacy)`,
      disabled: true,
    },
  ]
}

export function isIcs204AssignedUnitSelectable(
  positionName: string,
  options: Ics204AssignedUnitOption[]
): boolean {
  const option = options.find((entry) => entry.value === positionName)
  return Boolean(option && !option.disabled)
}

export function resolveIcs204AssignedUnitDisplayLabel(
  positionName: string,
  options: Ics204AssignedUnitOption[]
): string {
  const trimmed = positionName.trim()
  if (!trimmed) {
    return 'Unassigned Unit'
  }

  const option = options.find((entry) => entry.value === trimmed)
  return option?.label ?? trimmed
}

export function resolveIcs204AssignedUnitRecipients(
  positionName: string,
  roster: WorkspaceRosterMember[],
  schedulesByPosition: Record<string, { assignMemberIds: string[]; unassignMemberIds: string[] }>
): string[] {
  const trimmed = positionName.trim()
  if (!trimmed) {
    return []
  }

  const memberById = new Map(roster.map((member) => [member.id, member]))
  const emails = new Set<string>()

  for (const member of roster) {
    if (member.status !== 'removed' && member.icsPositions.includes(trimmed)) {
      emails.add(member.email.toLowerCase())
    }
  }

  const schedule = schedulesByPosition[trimmed]
  for (const memberId of schedule?.assignMemberIds ?? []) {
    const member = memberById.get(memberId)
    if (member && member.status !== 'removed') {
      emails.add(member.email.toLowerCase())
    }
  }

  return [...emails]
}

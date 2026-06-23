import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import {
  buildWorkAssignmentTarget,
  formatWorkAssignmentTargetLabel,
  memberIsEligibleForPosition,
  parseWorkAssignmentTarget,
  type WorkAssignmentTargetType,
} from '@/lib/work-assignment-target'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export type WorkAssignmentTargetOption = {
  value: string
  label: string
  group: string
  disabled?: boolean
  targetType: WorkAssignmentTargetType
}

export type WorkAssignmentTargetOptionsInput = {
  roster: WorkspaceRosterMember[]
  positionEntries: PositionRosterEntry[]
  competencyOptions?: string[]
  schedulesByPosition?: Record<string, { assignMemberIds: string[]; unassignMemberIds: string[] }>
  includeUnassigned?: boolean
}

const NOBODY_SCHEDULED_SUFFIX = '(Nobody Scheduled for Next OP)'

function classifyPositionTargetOption(
  entry: PositionRosterEntry,
  roster: WorkspaceRosterMember[]
): WorkAssignmentTargetOption | null {
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
      value: encodePosition(position),
      label: `${position} ${NOBODY_SCHEDULED_SUFFIX}`,
      group: 'Positions',
      disabled: true,
      targetType: 'position',
    }
  }

  const positionTarget = buildWorkAssignmentTarget({
    type: 'position',
    position,
    roster,
  })
  return {
    value: positionTarget.value,
    label: positionTarget.label,
    group: 'Positions',
    targetType: 'position',
  }
}

function encodePosition(position: string): string {
  return buildWorkAssignmentTarget({ type: 'position', position }).value
}

function sortedUniqueCompetencies(competencyOptions: string[] = []): string[] {
  return [...new Set(competencyOptions.map((entry) => entry.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  )
}

export function buildWorkAssignmentTargetOptions(
  input: WorkAssignmentTargetOptionsInput
): WorkAssignmentTargetOption[] {
  const {
    roster,
    positionEntries,
    competencyOptions = [],
    schedulesByPosition = {},
    includeUnassigned = false,
  } = input
  const options: WorkAssignmentTargetOption[] = []
  const competencies = sortedUniqueCompetencies(competencyOptions)
  const activeRoster = roster.filter((member) => member.status !== 'removed')

  if (includeUnassigned) {
    options.push({
      value: '',
      label: 'Unassigned',
      group: 'Assignment',
      targetType: 'unassigned',
    })
  }

  for (const entry of positionEntries) {
    if (!entry.allowWorkAssignment) continue

    const positionOption = classifyPositionTargetOption(entry, roster)
    if (!positionOption) continue

    options.push(positionOption)
    if (positionOption.disabled) continue

    for (const competency of competencies) {
      const roleTarget = buildWorkAssignmentTarget({
        type: 'position_competency',
        position: entry.position,
        competencyFunction: competency,
        roster,
      })
      options.push({
        value: roleTarget.value,
        label: roleTarget.label,
        group: 'Position roles',
        targetType: 'position_competency',
      })
    }
  }

  for (const member of activeRoster.filter((entry) => entry.assignmentKind === 'single_resource')) {
    const target = buildWorkAssignmentTarget({
      type: 'single_resource',
      memberId: member.id,
      roster,
    })
    options.push({
      value: target.value,
      label: target.label,
      group: 'Single resources',
      targetType: 'single_resource',
    })
  }

  for (const entry of positionEntries) {
    if (!entry.allowWorkAssignment || entry.opAdvanceLabel === 'retire_on_op_advance') continue
    const scheduledIds = schedulesByPosition[entry.position]?.assignMemberIds ?? []
    const members = [
      ...entry.members,
      ...entry.scheduledAssignees.filter(
        (member) => !entry.members.some((current) => current.id === member.id)
      ),
    ]

    for (const member of members) {
      if (!memberIsEligibleForPosition(member, entry.position, scheduledIds)) continue
      const target = buildWorkAssignmentTarget({
        type: 'member',
        memberId: member.id,
        position: entry.position,
        competencyFunction: member.competencyByPosition?.[entry.position] ?? null,
        roster,
      })
      options.push({
        value: target.value,
        label: target.label,
        group: 'Members',
        targetType: 'member',
      })
    }
  }

  const seen = new Set<string>()
  return options.filter((option) => {
    if (seen.has(option.value)) return false
    seen.add(option.value)
    return true
  })
}

export function toAssignedUnitOptions(
  options: WorkAssignmentTargetOption[]
): Array<{ value: string; label: string; disabled?: boolean }> {
  return options.map(({ value, label, disabled }) => ({ value, label, disabled }))
}

export function mergeLegacyWorkAssignmentTargetOption(
  options: WorkAssignmentTargetOption[],
  currentValue: string,
  roster: WorkspaceRosterMember[] = []
): WorkAssignmentTargetOption[] {
  const trimmed = currentValue.trim()
  if (!trimmed || options.some((option) => option.value === trimmed)) {
    return options
  }

  const parsed = parseWorkAssignmentTarget(trimmed, roster)
  if (options.some((option) => option.value === parsed.value)) {
    return options
  }

  return [
    ...options,
    {
      value: trimmed,
      label: `${formatWorkAssignmentTargetLabel(trimmed, roster)} (legacy)`,
      group: 'Legacy',
      disabled: true,
      targetType: parsed.type === 'unassigned' ? 'position' : parsed.type,
    },
  ]
}

export const mergeLegacyWorkAssignmentTargetOptions = mergeLegacyWorkAssignmentTargetOption

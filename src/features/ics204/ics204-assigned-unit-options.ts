import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import {
  buildWorkAssignmentTargetOptions,
  mergeLegacyWorkAssignmentTargetOption,
  toAssignedUnitOptions,
  type WorkAssignmentTargetOption,
} from '@/lib/work-assignment-target-options'
import {
  formatWorkAssignmentTargetLabel,
  isWorkAssignmentTargetSelectable,
  normalizeWorkAssignmentTargetValue,
  parseWorkAssignmentTarget,
  resolveWorkAssignmentTargetRecipients,
} from '@/lib/work-assignment-target'

export type Ics204AssignedUnitOption = {
  value: string
  label: string
  disabled?: boolean
}

export function buildIcs204AssignedUnitOptions(
  entries: PositionRosterEntry[],
  roster: WorkspaceRosterMember[] = [],
  competencyOptions: string[] = [],
  schedulesByPosition: Record<
    string,
    { assignMemberIds: string[]; unassignMemberIds: string[] }
  > = {},
  catalog?: WorkspacePositionCatalog,
  assetsByKey: Record<string, import('@/features/resources/types').ResourceListItemData> = {}
): Ics204AssignedUnitOption[] {
  return toAssignedUnitOptions(
    buildWorkAssignmentTargetOptions({
      roster,
      positionEntries: entries,
      catalog,
      competencyOptions,
      schedulesByPosition,
      assetsByKey,
    })
  )
}

export function buildIcs204AssignedUnitTargetOptions(
  entries: PositionRosterEntry[],
  roster: WorkspaceRosterMember[] = [],
  competencyOptions: string[] = [],
  schedulesByPosition: Record<
    string,
    { assignMemberIds: string[]; unassignMemberIds: string[] }
  > = {},
  catalog?: WorkspacePositionCatalog,
  assetsByKey: Record<string, import('@/features/resources/types').ResourceListItemData> = {}
): WorkAssignmentTargetOption[] {
  return buildWorkAssignmentTargetOptions({
    roster,
    positionEntries: entries,
    catalog,
    competencyOptions,
    schedulesByPosition,
    assetsByKey,
  })
}

export function mergeLegacyIcs204AssignedUnitOption(
  options: Ics204AssignedUnitOption[],
  currentValue: string,
  roster: WorkspaceRosterMember[] = []
): Ics204AssignedUnitOption[] {
  const asTargetOptions: WorkAssignmentTargetOption[] = options.map((option) => ({
    ...option,
    group: 'Assignment',
    targetType: parseWorkAssignmentTarget(option.value, roster).type,
  }))
  return toAssignedUnitOptions(
    mergeLegacyWorkAssignmentTargetOption(asTargetOptions, currentValue, roster)
  )
}

export function mergeLegacyWorkAssignmentTargetOptions(
  options: WorkAssignmentTargetOption[],
  currentValue: string,
  roster: WorkspaceRosterMember[] = []
): WorkAssignmentTargetOption[] {
  return mergeLegacyWorkAssignmentTargetOption(options, currentValue, roster)
}

export function isIcs204AssignedUnitSelectable(
  assignedUnit: string,
  options: Ics204AssignedUnitOption[],
  roster: WorkspaceRosterMember[] = []
): boolean {
  return isWorkAssignmentTargetSelectable(assignedUnit, options, roster)
}

export function resolveIcs204AssignedUnitDisplayLabel(
  assignedUnit: string,
  options: Ics204AssignedUnitOption[],
  roster: WorkspaceRosterMember[] = []
): string {
  const trimmed = assignedUnit.trim()
  if (!trimmed) {
    return 'Unassigned Unit'
  }
  const option = options.find((entry) => entry.value === trimmed)
  return option?.label ?? formatWorkAssignmentTargetLabel(trimmed, roster)
}

export function resolveIcs204AssignedUnitRecipients(
  assignedUnit: string,
  roster: WorkspaceRosterMember[],
  schedulesByPosition: Record<string, { assignMemberIds: string[]; unassignMemberIds: string[] }>
): string[] {
  return resolveWorkAssignmentTargetRecipients(assignedUnit, roster, schedulesByPosition)
}

export function normalizeIcs204AssignedUnitValue(
  assignedUnit: string,
  roster: WorkspaceRosterMember[] = []
): string {
  return normalizeWorkAssignmentTargetValue(assignedUnit, roster)
}

/** @deprecated Use buildIcs204AssignedUnitOptions with roster context. */
export function classifyIcs204AssignedUnitOption(
  entry: PositionRosterEntry
): Ics204AssignedUnitOption | null {
  const options = buildIcs204AssignedUnitOptions([entry])
  return options[0] ?? null
}

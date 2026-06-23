import type { Ics204FormState } from '@/features/ics204/types'
import { resolveIcs204ListTitle } from '@/features/ics204/utils'
import { formatWorkAssignmentTargetLabel } from '@/lib/work-assignment-target'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export type Ics204AssignmentNotificationContext = {
  workspaceLabel: string
  assignedByEmail: string | null
  roster?: WorkspaceRosterMember[]
}

function truncate(value: string, maxLength: number): string {
  const trimmed = value.trim()
  if (trimmed.length <= maxLength) {
    return trimmed
  }
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`
}

function resolveIcs204Leader(form: Ics204FormState): string {
  return (
    form.divisionGroupSupervisor.trim() ||
    form.branchDirector.trim() ||
    form.sectionChief.trim() ||
    'Unassigned'
  )
}

export function buildIcs204AssignmentNotificationTitle(
  form: Ics204FormState,
  roster: WorkspaceRosterMember[] = []
): string {
  const assignedUnit = form.assignedUnit.trim()
  if (assignedUnit.length > 0) {
    return `ICS-204 assigned: ${formatWorkAssignmentTargetLabel(assignedUnit, roster)}`
  }
  return `ICS-204 assigned: ${resolveIcs204ListTitle(form, roster)}`
}

export function buildIcs204AssignmentNotificationSummary(
  form: Ics204FormState,
  context: Ics204AssignmentNotificationContext
): string {
  const assignedUnit =
    formatWorkAssignmentTargetLabel(form.assignedUnit, context.roster ?? []) || 'Unassigned Unit'
  const leader = resolveIcs204Leader(form)
  const assignmentLines = form.workAssignments
    .map((row) => row.assignment.trim())
    .filter((line) => line.length > 0)
    .slice(0, 2)
  const assignmentSummary =
    assignmentLines.length > 0
      ? assignmentLines.join('; ')
      : `${form.workAssignments.length} work assignment(s)`

  const lines = [
    `${context.assignedByEmail ?? 'A roster member'} assigned you an ICS-204 in ${context.workspaceLabel}.`,
    `Assigned Unit: ${assignedUnit}`,
    `Leader: ${leader}`,
    `Branch: ${form.branch.trim() || '—'} • Division: ${form.division.trim() || '—'} • Group: ${form.group.trim() || '—'}`,
    `Staging Area: ${form.stagingArea.trim() || '—'}`,
    `Work Assignments (${form.workAssignments.length}): ${assignmentSummary}`,
    `Resources Assigned: ${form.resourcesAssigned.length}`,
  ]

  if (form.specialInstructions.trim().length > 0) {
    lines.push(`Special Instructions: ${truncate(form.specialInstructions, 180)}`)
  }

  return lines.join('\n')
}

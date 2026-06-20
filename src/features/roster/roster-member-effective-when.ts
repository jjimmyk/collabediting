import { getPositionMemberSchedulePolicy } from '@/lib/roster-member-schedule-policy'
import type { MemberAssignmentKind, RosterMemberEffectiveWhen } from '@/lib/roster-member-assignment'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'

export function validateRosterMemberEffectiveWhen(params: {
  effectiveWhen: RosterMemberEffectiveWhen
  assignmentKind: MemberAssignmentKind
  icsPositions: string[]
  orgChartReportsTo: string
  catalog: WorkspacePositionCatalog
  operationalPeriodsEnabled: boolean
}): string | null {
  if (!params.operationalPeriodsEnabled) {
    return null
  }

  if (params.effectiveWhen === 'next_op_advance') {
    if (params.assignmentKind === 'ics_position') {
      if (params.icsPositions.length !== 1) {
        return 'Next operational period assignment requires exactly one ICS position.'
      }
      const position = params.icsPositions[0]
      const policy = getPositionMemberSchedulePolicy(params.catalog.positionMetaByName[position])
      if (!policy.allowScheduleAssign) {
        return `Cannot schedule assignment to ${position} on the next operational period.`
      }
      return null
    }

    if (!params.orgChartReportsTo.trim()) {
      return 'Select a position to report to.'
    }
    const policy = getPositionMemberSchedulePolicy(
      params.catalog.positionMetaByName[params.orgChartReportsTo]
    )
    if (!policy.allowActiveAssignment && !policy.allowScheduleAssign) {
      return 'Cannot schedule single-resource placement under this position.'
    }
    return null
  }

  if (params.assignmentKind === 'ics_position') {
    for (const position of params.icsPositions) {
      const policy = getPositionMemberSchedulePolicy(params.catalog.positionMetaByName[position])
      if (!policy.allowActiveAssignment) {
        return `${position} activates on the next operational period — choose Next operational period instead.`
      }
    }
    return null
  }

  const policy = getPositionMemberSchedulePolicy(
    params.catalog.positionMetaByName[params.orgChartReportsTo]
  )
  if (!policy.allowActiveAssignment) {
    return `${params.orgChartReportsTo} is not available for immediate assignment.`
  }

  return null
}

export function effectiveWhenSummary(params: {
  effectiveWhen: RosterMemberEffectiveWhen
  assignmentKind: MemberAssignmentKind
  icsPositions: string[]
  orgChartReportsTo: string
}): string {
  if (params.effectiveWhen === 'next_op_advance') {
    if (params.assignmentKind === 'single_resource') {
      return `Added to the roster now; appears under ${params.orgChartReportsTo} when the next operational period starts.`
    }
    return `Added to the roster now; assigned to ${params.icsPositions[0]} when the next operational period starts.`
  }

  if (params.assignmentKind === 'single_resource') {
    return `Appears under ${params.orgChartReportsTo} immediately.`
  }

  if (params.icsPositions.length === 1) {
    return `Assigned to ${params.icsPositions[0]} immediately.`
  }

  return `Assigned to ${params.icsPositions.join(', ')} immediately.`
}

import { getPositionMemberSchedulePolicy } from '@/lib/roster-member-schedule-policy'
import type { AssetAssignmentKind } from '@/lib/roster-asset-assignment'
import type { RosterMemberEffectiveWhen } from '@/lib/roster-member-assignment'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'

export function validateAssetEffectiveWhen(params: {
  effectiveWhen: RosterMemberEffectiveWhen
  assignmentKind: AssetAssignmentKind
  icsPosition: string
  orgChartReportsTo: string
  pointOfContactMemberId: string | null
  pointOfContactUserId?: string | null
  catalog: WorkspacePositionCatalog
  operationalPeriodsEnabled: boolean
  allowOrgPointOfContact?: boolean
}): string | null {
  if (params.assignmentKind === 'ics_position') {
    const hasPoc =
      Boolean(params.pointOfContactMemberId) ||
      (params.allowOrgPointOfContact && Boolean(params.pointOfContactUserId))
    if (!hasPoc) {
      return 'Select a Point of Contact before assigning this asset to a position.'
    }
  }

  if (!params.operationalPeriodsEnabled) {
    if (params.assignmentKind === 'ics_position' && params.icsPosition.trim()) {
      const policy = getPositionMemberSchedulePolicy(
        params.catalog.positionMetaByName[params.icsPosition]
      )
      if (!policy.allowActiveAssignment) {
        return `${params.icsPosition} activates on the next operational period — operational periods must be enabled to schedule.`
      }
    }
    if (params.assignmentKind === 'single_resource' && params.orgChartReportsTo.trim()) {
      const policy = getPositionMemberSchedulePolicy(
        params.catalog.positionMetaByName[params.orgChartReportsTo]
      )
      if (!policy.allowActiveAssignment) {
        return `${params.orgChartReportsTo} is not available for immediate assignment.`
      }
    }
    return null
  }

  if (params.effectiveWhen === 'next_op_advance') {
    if (params.assignmentKind === 'ics_position') {
      if (!params.icsPosition.trim()) {
        return 'Select an ICS position.'
      }
      const policy = getPositionMemberSchedulePolicy(
        params.catalog.positionMetaByName[params.icsPosition]
      )
      if (!policy.allowScheduleAssign) {
        return `Cannot schedule assignment to ${params.icsPosition} on the next operational period.`
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
    if (!params.icsPosition.trim()) {
      return 'Select an ICS position.'
    }
    const policy = getPositionMemberSchedulePolicy(
      params.catalog.positionMetaByName[params.icsPosition]
    )
    if (!policy.allowActiveAssignment) {
      return `${params.icsPosition} activates on the next operational period — choose Next operational period instead.`
    }
    return null
  }

  if (!params.orgChartReportsTo.trim()) {
    return 'Select a position to report to.'
  }
  const policy = getPositionMemberSchedulePolicy(
    params.catalog.positionMetaByName[params.orgChartReportsTo]
  )
  if (!policy.allowActiveAssignment) {
    return `${params.orgChartReportsTo} is not available for immediate assignment.`
  }

  return null
}

export function assetEffectiveWhenSummary(params: {
  effectiveWhen: RosterMemberEffectiveWhen
  assignmentKind: AssetAssignmentKind
  icsPosition: string
  orgChartReportsTo: string
}): string {
  if (params.effectiveWhen === 'next_op_advance') {
    if (params.assignmentKind === 'single_resource') {
      return `Asset stays in the workspace; appears under ${params.orgChartReportsTo} when the next operational period starts.`
    }
    return `Asset stays in the workspace; assigned to ${params.icsPosition} when the next operational period starts.`
  }

  if (params.assignmentKind === 'single_resource') {
    return `Appears under ${params.orgChartReportsTo} on the org chart immediately.`
  }

  return `Assigned to ${params.icsPosition} immediately.`
}

import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { RosterSchedulingPhase } from '@/lib/roster-scheduling-phase'

export type RosterInviteAssignmentMode = 'assign_now' | 'schedule_on_op_advance'

export type PositionRosterInviteSubmitResult = 'success' | 'password_overwrite_required' | 'error'

export type PositionRosterInlineInviteProps = {
  isSupabaseEnabled: boolean
  isSubmitting: boolean
  onSubmit: (
    params: {
      email: string
      password: string
      position: string
      mode: RosterInviteAssignmentMode
    },
    confirmPasswordOverwrite?: boolean
  ) => Promise<PositionRosterInviteSubmitResult>
}

export function assignExistingMembersEmptyMessage(
  entry: PositionRosterEntry,
  assignableCount: number,
  options?: { rosterSchedulingPhase?: RosterSchedulingPhase; orgSearchEnabled?: boolean }
): string {
  if (assignableCount > 0) {
    return ''
  }

  if (options?.orgSearchEnabled) {
    if (entry.members.length > 0) {
      return 'Use Existing Person above to search organization members.'
    }
    return 'Use Existing Person above to add someone from your organization.'
  }

  if (entry.members.length > 0) {
    return 'All roster members are already assigned here.'
  }

  if (entry.isPlanned) {
    return 'No other roster members available to assign.'
  }

  return 'No roster members available to assign.'
}

export function scheduleAssignMembersEmptyMessage(
  assignableCount: number,
  options?: { orgSearchEnabled?: boolean }
): string {
  if (assignableCount > 0) {
    return ''
  }
  if (options?.orgSearchEnabled) {
    return 'Use Existing Person above to schedule someone from your organization.'
  }
  return 'No roster members available to schedule.'
}

export function scheduleUnassignMembersEmptyMessage(
  entry: PositionRosterEntry,
  unassignableCount: number
): string {
  if (unassignableCount > 0) {
    return ''
  }
  if (entry.members.length === 0 && entry.assets.length === 0) {
    return 'No users or assets are assigned to this position yet.'
  }
  return 'No assigned users or assets can be scheduled to unassign.'
}

export function assignNowCombinedEmptyMessage(
  entry: PositionRosterEntry,
  showAssets: boolean
): string {
  if (entry.members.length > 0 || entry.assets.length > 0) {
    return ''
  }
  return showAssets
    ? 'No users or assets assigned yet.'
    : 'No users assigned yet.'
}

export function scheduleOrgChartCombinedEmptyMessage(
  entry: PositionRosterEntry,
  showAssets: boolean
): string {
  if (
    entry.scheduledOrgChartMembers.length > 0 ||
    (showAssets && entry.scheduledOrgChartAssets.length > 0)
  ) {
    return ''
  }
  return showAssets
    ? 'No org chart users or assets scheduled for next OP.'
    : 'No org chart users scheduled for next OP.'
}

export function scheduleAssignCombinedEmptyMessage(
  entry: PositionRosterEntry,
  showAssets: boolean
): string {
  if (entry.scheduledAssignees.length > 0 || entry.scheduledAssignAssets.length > 0) {
    return ''
  }
  return showAssets
    ? 'No users or assets scheduled to assign.'
    : 'No users scheduled to assign.'
}

export function scheduleUnassignCombinedEmptyMessage(
  entry: PositionRosterEntry,
  showAssets: boolean
): string {
  if (entry.scheduledUnassignees.length > 0 || entry.scheduledUnassignAssets.length > 0) {
    return ''
  }
  return showAssets
    ? 'No users or assets scheduled to unassign.'
    : 'No users scheduled to unassign.'
}

export function assignableAssetsEmptyMessage(showAssets: boolean): string {
  if (!showAssets) return ''
  return 'No workspace assets are available for this action.'
}

export function scheduleUnassignAssetsEmptyMessage(): string {
  return 'No assigned assets can be scheduled to unassign.'
}

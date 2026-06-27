import type { PositionAssetRosterEntry } from '@/lib/workspace-position-asset-types'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { PositionResourceCategoryEntry } from '@/lib/workspace-resource-category-types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export type RosterPresence = 'active' | 'scheduled_next_op'

export type AssigneeEligibility = {
  eligible: boolean
  disabled: boolean
  presence: RosterPresence | null
  disabledReason?: string
}

export const ROSTER_PRESENCE_LABELS: Record<RosterPresence, string> = {
  active: '(active roster)',
  scheduled_next_op: '(scheduled next OP)',
}

export function formatAssigneeOptionLabel(
  baseLabel: string,
  presence: RosterPresence | null,
  extras?: { disabledReason?: string; unfilled?: boolean }
): string {
  const parts = [baseLabel]
  if (extras?.unfilled) {
    parts.push('(unfilled)')
  }
  if (presence) {
    parts.push(ROSTER_PRESENCE_LABELS[presence])
  }
  if (extras?.disabledReason) {
    parts.push(`(${extras.disabledReason})`)
  }
  return parts.join(' ')
}

export function isMemberScheduledToUnassign(
  memberId: string,
  entry: PositionRosterEntry
): boolean {
  return entry.scheduledUnassignees.some((member) => member.id === memberId)
}

export function isAssetScheduledToUnassign(
  assetKey: string,
  entry: PositionRosterEntry
): boolean {
  return entry.scheduledUnassignAssets.some((asset) => asset.assetKey === assetKey)
}

export function isMemberActiveAtPosition(
  member: WorkspaceRosterMember,
  position: string
): boolean {
  return member.icsPositions.includes(position)
}

export function isMemberScheduledForNextOpAssign(
  memberId: string,
  entry: PositionRosterEntry
): boolean {
  return (
    entry.scheduledAssignees.some((member) => member.id === memberId) ||
    entry.scheduledOrgChartMembers.some((member) => member.id === memberId)
  )
}

export function isAssetActiveAtPosition(assetKey: string, entry: PositionRosterEntry): boolean {
  return entry.assets.some((asset) => asset.assetKey === assetKey)
}

export function isAssetScheduledForNextOpAssign(
  assetKey: string,
  entry: PositionRosterEntry
): boolean {
  return (
    entry.scheduledAssignAssets.some((asset) => asset.assetKey === assetKey) ||
    entry.scheduledOrgChartAssets.some((asset) => asset.assetKey === assetKey)
  )
}

export function canMemberContinueToNextOp(
  member: WorkspaceRosterMember,
  entry: PositionRosterEntry
): boolean {
  return (
    isMemberActiveAtPosition(member, entry.position) &&
    !isMemberScheduledToUnassign(member.id, entry) &&
    !isMemberScheduledForNextOpAssign(member.id, entry)
  )
}

export function canAssetContinueToNextOp(assetKey: string, entry: PositionRosterEntry): boolean {
  return (
    isAssetActiveAtPosition(assetKey, entry) &&
    !isAssetScheduledToUnassign(assetKey, entry) &&
    !isAssetScheduledForNextOpAssign(assetKey, entry)
  )
}

export function canResourceCategoryContinueToNextOp(
  category: PositionResourceCategoryEntry,
  entry: PositionRosterEntry
): boolean {
  if (entry.opAdvanceLabel === 'retire_on_op_advance') {
    return false
  }
  if (category.lifecycle !== 'active') {
    return false
  }
  const normalizedName = category.name.trim()
  return !entry.resourceCategories.some(
    (other) =>
      other.lifecycle === 'scheduled_assign' && other.name.trim() === normalizedName
  )
}

export function classifyPositionAssigneeEligibility(entry: PositionRosterEntry): AssigneeEligibility {
  if (entry.opAdvanceLabel === 'retire_on_op_advance') {
    return {
      eligible: false,
      disabled: true,
      presence: null,
      disabledReason: 'retiring next OP',
    }
  }

  const hasCurrent =
    entry.members.length > 0 ||
    entry.assets.length > 0 ||
    entry.resourceCategories.some((category) => category.lifecycle === 'active')
  const hasScheduled =
    entry.scheduledAssignees.length > 0 ||
    entry.scheduledOrgChartMembers.length > 0 ||
    entry.scheduledAssignAssets.length > 0 ||
    entry.scheduledOrgChartAssets.length > 0 ||
    entry.resourceCategories.some((category) => category.lifecycle === 'scheduled_assign')

  if (!hasCurrent && !hasScheduled) {
    return { eligible: false, disabled: true, presence: null }
  }

  const allMembersRetiring =
    entry.members.length > 0 &&
    entry.members.every((member) => isMemberScheduledToUnassign(member.id, entry))
  const allAssetsRetiring =
    entry.assets.length > 0 &&
    entry.assets.every((asset) => isAssetScheduledToUnassign(asset.assetKey, entry))
  const noReplacement =
    entry.scheduledAssignees.length === 0 &&
    entry.scheduledAssignAssets.length === 0 &&
    entry.scheduledOrgChartMembers.length === 0 &&
    entry.scheduledOrgChartAssets.length === 0 &&
    !entry.resourceCategories.some((category) => category.lifecycle === 'scheduled_assign')

  if (allMembersRetiring && allAssetsRetiring && entry.members.length + entry.assets.length > 0 && noReplacement) {
    return {
      eligible: true,
      disabled: true,
      presence: null,
      disabledReason: 'nobody scheduled for next OP',
    }
  }

  return {
    eligible: true,
    disabled: false,
    presence: hasCurrent ? 'active' : 'scheduled_next_op',
  }
}

export function classifyMemberAtPositionEligibility(
  member: WorkspaceRosterMember,
  entry: PositionRosterEntry
): AssigneeEligibility {
  if (entry.opAdvanceLabel === 'retire_on_op_advance') {
    return { eligible: false, disabled: true, presence: null, disabledReason: 'retiring next OP' }
  }

  const isActive = member.icsPositions.includes(entry.position)
  const isScheduledAssign = entry.scheduledAssignees.some((scheduled) => scheduled.id === member.id)

  if (!isActive && !isScheduledAssign) {
    return { eligible: false, disabled: true, presence: null }
  }

  if (isMemberScheduledToUnassign(member.id, entry)) {
    return {
      eligible: true,
      disabled: true,
      presence: 'active',
      disabledReason: 'retiring next OP',
    }
  }

  return {
    eligible: true,
    disabled: false,
    presence: isActive ? 'active' : 'scheduled_next_op',
  }
}

export function classifySingleResourceMemberEligibility(
  member: WorkspaceRosterMember
): AssigneeEligibility {
  if (member.status === 'removed') {
    return { eligible: false, disabled: true, presence: null }
  }

  const isActive = Boolean(member.orgChartReportsTo?.trim())
  const isScheduled = Boolean(member.pendingOrgChartReportsTo?.trim())

  if (!isActive && !isScheduled) {
    return { eligible: false, disabled: true, presence: null }
  }

  return {
    eligible: true,
    disabled: false,
    presence: isActive ? 'active' : 'scheduled_next_op',
  }
}

export function classifyPositionAssetEligibility(
  asset: PositionAssetRosterEntry,
  entry: PositionRosterEntry,
  presence: RosterPresence
): AssigneeEligibility {
  if (entry.opAdvanceLabel === 'retire_on_op_advance') {
    return { eligible: false, disabled: true, presence: null, disabledReason: 'retiring next OP' }
  }

  if (presence === 'active' && isAssetScheduledToUnassign(asset.assetKey, entry)) {
    return {
      eligible: true,
      disabled: true,
      presence: 'active',
      disabledReason: 'retiring next OP',
    }
  }

  return {
    eligible: true,
    disabled: false,
    presence,
  }
}

export function classifyResourceCategoryAssigneeEligibility(
  category: PositionResourceCategoryEntry,
  entry: PositionRosterEntry
): AssigneeEligibility {
  if (entry.opAdvanceLabel === 'retire_on_op_advance') {
    return { eligible: false, disabled: true, presence: null, disabledReason: 'retiring next OP' }
  }

  const presence: RosterPresence =
    category.lifecycle === 'scheduled_assign' ? 'scheduled_next_op' : 'active'

  if (category.lifecycle === 'scheduled_unassign') {
    return {
      eligible: true,
      disabled: true,
      presence: 'active',
      disabledReason: 'vacating next OP',
    }
  }

  return {
    eligible: true,
    disabled: false,
    presence,
  }
}

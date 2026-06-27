import type { HaveLinkPositionChild } from '@/features/ics215/build-have-link-position-tree'
import type { HaveLinkOperationalPeriod } from '@/features/ics215/have-link-roster-actions'
import type { HaveLinkRosterActions } from '@/features/ics215/have-link-roster-actions'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { PositionMemberSchedulePolicy } from '@/lib/roster-member-schedule-policy'
import { parseWorkAssignmentTarget } from '@/lib/work-assignment-target'
import {
  canAssetContinueToNextOp,
  canMemberContinueToNextOp,
  canResourceCategoryContinueToNextOp,
} from '@/lib/work-assignment-roster-eligibility'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export function canShowHaveLinkScheduleForNextOp(
  child: HaveLinkPositionChild,
  op: HaveLinkOperationalPeriod,
  positionEntry: PositionRosterEntry | null,
  roster: WorkspaceRosterMember[]
): boolean {
  if (op !== 'current' || !positionEntry || child.disabled) {
    return false
  }

  const parsed = parseWorkAssignmentTarget(child.ref)
  if (parsed.type === 'member' && parsed.memberId) {
    const member = roster.find((entry) => entry.id === parsed.memberId)
    return member ? canMemberContinueToNextOp(member, positionEntry) : false
  }
  if (parsed.type === 'position_asset' && parsed.assetKey) {
    return canAssetContinueToNextOp(parsed.assetKey, positionEntry)
  }
  if (parsed.type === 'resource_category' && parsed.categoryId) {
    const category = positionEntry.resourceCategories.find(
      (entry) => entry.id === parsed.categoryId
    )
    return category ? canResourceCategoryContinueToNextOp(category, positionEntry) : false
  }
  return false
}

export function canShowHaveLinkRemoveFromOp(
  child: HaveLinkPositionChild,
  op: HaveLinkOperationalPeriod,
  rosterActions: HaveLinkRosterActions | undefined,
  memberSchedulePolicy: PositionMemberSchedulePolicy
): boolean {
  if (!rosterActions?.canManageRoster || child.disabled) {
    return false
  }

  if (op === 'current') {
    return memberSchedulePolicy.allowActiveAssignment
  }

  if (op === 'next') {
    return memberSchedulePolicy.allowScheduleAssign
  }

  return false
}

export function canShowHaveLinkRemoveScheduledUnassign(
  child: HaveLinkPositionChild,
  rosterActions: HaveLinkRosterActions | undefined,
  memberSchedulePolicy: PositionMemberSchedulePolicy
): boolean {
  if (!rosterActions?.canManageRoster || child.disabled) {
    return false
  }
  return memberSchedulePolicy.allowScheduleUnassign
}

export function invokeHaveLinkScheduleForNextOp(
  child: HaveLinkPositionChild,
  position: string,
  rosterActions: HaveLinkRosterActions
) {
  const parsed = parseWorkAssignmentTarget(child.ref)
  if (parsed.type === 'member' && parsed.memberId) {
    void rosterActions.onAlsoScheduleMemberForNextOp(parsed.memberId, position)
    return
  }
  if (parsed.type === 'position_asset' && parsed.assetKey) {
    void rosterActions.onAlsoScheduleAssetForNextOp(parsed.assetKey, position)
    return
  }
  if (parsed.type === 'resource_category' && parsed.categoryId) {
    void rosterActions.onAlsoScheduleResourceCategoryForNextOp(parsed.categoryId, position)
  }
}

export function invokeHaveLinkRemoveFromOp(
  child: HaveLinkPositionChild,
  op: HaveLinkOperationalPeriod,
  position: string,
  positionEntry: PositionRosterEntry | null,
  rosterActions: HaveLinkRosterActions
) {
  const parsed = parseWorkAssignmentTarget(child.ref)

  if (parsed.type === 'member' && parsed.memberId) {
    if (op === 'next') {
      void rosterActions.onRemoveMemberFromNextOp(parsed.memberId, position)
      return
    }
    const scheduledUnassign = positionEntry?.scheduledUnassignees.some(
      (member) => member.id === parsed.memberId
    )
    if (scheduledUnassign) {
      void rosterActions.onRemoveMemberFromScheduledUnassign(parsed.memberId, position)
    } else {
      void rosterActions.onRemoveMemberFromCurrentOp(parsed.memberId, position)
    }
    return
  }

  if (parsed.type === 'position_asset' && parsed.assetKey) {
    if (op === 'next') {
      void rosterActions.onRemoveAssetFromNextOp(parsed.assetKey, position)
      return
    }
    const scheduledUnassign = positionEntry?.scheduledUnassignAssets.some(
      (asset) => asset.assetKey === parsed.assetKey
    )
    if (scheduledUnassign) {
      void rosterActions.onRemoveAssetFromScheduledUnassign(parsed.assetKey, position)
    } else {
      void rosterActions.onRemoveAssetFromCurrentOp(parsed.assetKey, position)
    }
    return
  }

  if (parsed.type === 'resource_category' && parsed.categoryId) {
    void rosterActions.onRemoveResourceCategory(parsed.categoryId, position)
  }
}

export function invokeHaveLinkRemoveScheduledUnassign(
  child: HaveLinkPositionChild,
  position: string,
  positionEntry: PositionRosterEntry | null,
  rosterActions: HaveLinkRosterActions
) {
  const parsed = parseWorkAssignmentTarget(child.ref)

  if (parsed.type === 'member' && parsed.memberId) {
    void rosterActions.onRemoveMemberFromScheduledUnassign(parsed.memberId, position)
    return
  }

  if (parsed.type === 'position_asset' && parsed.assetKey) {
    void rosterActions.onRemoveAssetFromScheduledUnassign(parsed.assetKey, position)
    return
  }

  if (parsed.type === 'resource_category' && parsed.categoryId) {
    void rosterActions.onRemoveResourceCategory(parsed.categoryId, position)
  }

  void positionEntry
}

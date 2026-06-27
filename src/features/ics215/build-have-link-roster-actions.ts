import { toast } from 'sonner'
import type { PositionRosterInviteSubmitResult } from '@/features/roster/position-roster-messages'
import type { RosterInviteAssignmentMode } from '@/features/roster/position-roster-messages'
import type { ResourceListItemData } from '@/features/resources/types'
import {
  findResourceCategoryId,
  mapHaveLinkOpToCategoryLifecycle,
  mapHaveLinkOpToInviteMode,
  resolveMemberHaveRef,
  resolveMemberHaveRefByEmail,
  resolvePositionAssetHaveRef,
  resolveResourceCategoryHaveRef,
  type HaveLinkOperationalPeriod,
  type HaveLinkRosterActions,
} from '@/features/ics215/have-link-roster-actions'
import type { OrgMemberSearchResult } from '@/lib/workspace-service'
import type { WorkspaceResourceCategoryRow } from '@/lib/workspace-resource-category-types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export type BuildHaveLinkRosterActionsInput = {
  canManageRoster: boolean
  isSupabaseEnabled: boolean
  showPositionAssets: boolean
  isPositionBusy: (position: string) => boolean
  assignableByPosition: Record<string, WorkspaceRosterMember[]>
  scheduleAssignableByPosition: Record<string, WorkspaceRosterMember[]>
  assignableAssetsByPosition: Record<string, ResourceListItemData[]>
  scheduleAssignableAssetsByPosition: Record<string, ResourceListItemData[]>
  pocMembers: WorkspaceRosterMember[]
  workspaceRosterMembers: WorkspaceRosterMember[]
  workspaceResourceCategories: WorkspaceResourceCategoryRow[]
  assetsByKey: Record<string, ResourceListItemData>
  inlinePositionInvite?: HaveLinkRosterActions['inlinePositionInvite']
  onSearchOrgMembers?: (query: string, position?: string) => Promise<OrgMemberSearchResult[]>
  reloadRosterForHaveLink: () => Promise<void>
  getRosterSnapshot: () => WorkspaceRosterMember[]
  getResourceCategoriesSnapshot: () => WorkspaceResourceCategoryRow[]
  onAssignmentAdded?: (ref: string) => void
  assignExistingMemberToPosition: (memberId: string, position: string) => Promise<void>
  scheduleAssignMemberToPosition: (memberId: string, position: string) => Promise<void>
  assignOrgMemberToPositionRow: (userId: string, position: string) => Promise<void>
  submitInlinePositionInvite: (
    params: {
      email: string
      password: string
      position: string
      mode: RosterInviteAssignmentMode
    },
    confirmPasswordOverwrite?: boolean
  ) => Promise<PositionRosterInviteSubmitResult>
  assignAssetToPosition: (
    assetKey: string,
    position: string,
    pointOfContactMemberId?: string
  ) => Promise<void>
  scheduleAssignAssetToPosition: (assetKey: string, position: string) => Promise<void>
  createResourceCategoryForPosition: (
    position: string,
    name: string,
    lifecycle: ReturnType<typeof mapHaveLinkOpToCategoryLifecycle>
  ) => Promise<void>
  scheduleResourceCategoryForNextOp: (categoryId: string, position: string) => Promise<void>
  unassignMemberFromPosition: (memberId: string, position: string) => Promise<void>
  removeScheduledAssignFromPosition: (memberId: string, position: string) => Promise<void>
  removeScheduledUnassignFromPosition: (memberId: string, position: string) => Promise<void>
  unassignAssetFromPosition: (assetKey: string, position: string) => Promise<void>
  removeScheduledAssignAssetFromPosition: (assetKey: string, position: string) => Promise<void>
  removeScheduledUnassignAssetFromPosition: (assetKey: string, position: string) => Promise<void>
  deleteResourceCategoryById: (categoryId: string) => Promise<void>
  onAssignmentRemoved?: (ref: string) => void
}

function notifyAssignmentAdded(
  ref: string | null,
  onAssignmentAdded?: (ref: string) => void
) {
  if (ref && onAssignmentAdded) {
    onAssignmentAdded(ref)
  }
}

function notifyAssignmentRemoved(
  ref: string | null,
  onAssignmentRemoved?: (ref: string) => void
) {
  if (ref && onAssignmentRemoved) {
    onAssignmentRemoved(ref)
  }
}

export function buildHaveLinkRosterActions(
  input: BuildHaveLinkRosterActionsInput
): HaveLinkRosterActions {
  const afterMutation = async (resolveRef: () => string | null) => {
    await input.reloadRosterForHaveLink()
    notifyAssignmentAdded(resolveRef(), input.onAssignmentAdded)
  }

  const afterRemove = async (ref: string) => {
    await input.reloadRosterForHaveLink()
    notifyAssignmentRemoved(ref, input.onAssignmentRemoved)
  }

  const onAssignExistingMember = async (
    memberId: string,
    position: string,
    op: HaveLinkOperationalPeriod
  ): Promise<boolean> => {
    if (op === 'next') {
      await input.scheduleAssignMemberToPosition(memberId, position)
    } else {
      await input.assignExistingMemberToPosition(memberId, position)
    }
    await afterMutation(() =>
      resolveMemberHaveRef(memberId, position, input.getRosterSnapshot())
    )
    return true
  }

  const onAssignOrgMember = async (
    userId: string,
    position: string,
    op: HaveLinkOperationalPeriod
  ): Promise<boolean> => {
    if (op === 'next') {
      toast.error('Schedule assign for organization members requires them to be on the roster first.')
      return false
    }
    await input.assignOrgMemberToPositionRow(userId, position)
    await input.reloadRosterForHaveLink()
    const member = input
      .getRosterSnapshot()
      .find((entry) => entry.userId === userId && entry.icsPositions.includes(position))
    notifyAssignmentAdded(
      member ? resolveMemberHaveRef(member.id, position, input.getRosterSnapshot()) : null,
      input.onAssignmentAdded
    )
    return true
  }

  const onAssignAsset = async (
    assetKey: string,
    position: string,
    op: HaveLinkOperationalPeriod,
    pointOfContactMemberId?: string
  ): Promise<boolean> => {
    if (op === 'next') {
      await input.scheduleAssignAssetToPosition(assetKey, position)
    } else {
      await input.assignAssetToPosition(assetKey, position, pointOfContactMemberId)
    }
    await afterMutation(() =>
      resolvePositionAssetHaveRef(
        assetKey,
        position,
        input.getRosterSnapshot(),
        input.assetsByKey
      )
    )
    return true
  }

  const onCreateResourceCategory = async (
    position: string,
    name: string,
    op: HaveLinkOperationalPeriod
  ): Promise<boolean> => {
    const lifecycle = mapHaveLinkOpToCategoryLifecycle(op)
    await input.createResourceCategoryForPosition(position, name, lifecycle)
    await afterMutation(() => {
      const categoryId = findResourceCategoryId(
        position,
        name,
        lifecycle,
        input.getResourceCategoriesSnapshot()
      )
      return categoryId
        ? resolveResourceCategoryHaveRef(position, categoryId, input.getRosterSnapshot())
        : null
    })
    return true
  }

  const onAlsoScheduleMemberForNextOp = async (
    memberId: string,
    position: string
  ): Promise<boolean> => {
    await input.scheduleAssignMemberToPosition(memberId, position)
    await afterMutation(() =>
      resolveMemberHaveRef(memberId, position, input.getRosterSnapshot())
    )
    return true
  }

  const onAlsoScheduleAssetForNextOp = async (
    assetKey: string,
    position: string
  ): Promise<boolean> => {
    await input.scheduleAssignAssetToPosition(assetKey, position)
    await afterMutation(() =>
      resolvePositionAssetHaveRef(
        assetKey,
        position,
        input.getRosterSnapshot(),
        input.assetsByKey
      )
    )
    return true
  }

  const onAlsoScheduleResourceCategoryForNextOp = async (
    categoryId: string,
    position: string
  ): Promise<boolean> => {
    await input.scheduleResourceCategoryForNextOp(categoryId, position)
    await afterMutation(() => {
      const source = input
        .getResourceCategoriesSnapshot()
        .find((entry) => entry.id === categoryId)
      if (!source) return null
      const scheduledId = findResourceCategoryId(
        position,
        source.name,
        'scheduled_assign',
        input.getResourceCategoriesSnapshot()
      )
      return scheduledId
        ? resolveResourceCategoryHaveRef(position, scheduledId, input.getRosterSnapshot())
        : null
    })
    return true
  }

  const onRemoveMemberFromCurrentOp = async (
    memberId: string,
    position: string
  ): Promise<boolean> => {
    const ref = resolveMemberHaveRef(memberId, position, input.getRosterSnapshot())
    await input.unassignMemberFromPosition(memberId, position)
    await afterRemove(ref)
    return true
  }

  const onRemoveMemberFromNextOp = async (
    memberId: string,
    position: string
  ): Promise<boolean> => {
    const ref = resolveMemberHaveRef(memberId, position, input.getRosterSnapshot())
    await input.removeScheduledAssignFromPosition(memberId, position)
    await afterRemove(ref)
    return true
  }

  const onRemoveMemberFromScheduledUnassign = async (
    memberId: string,
    position: string
  ): Promise<boolean> => {
    const ref = resolveMemberHaveRef(memberId, position, input.getRosterSnapshot())
    await input.removeScheduledUnassignFromPosition(memberId, position)
    await afterRemove(ref)
    return true
  }

  const onRemoveAssetFromCurrentOp = async (
    assetKey: string,
    position: string
  ): Promise<boolean> => {
    const ref = resolvePositionAssetHaveRef(
      assetKey,
      position,
      input.getRosterSnapshot(),
      input.assetsByKey
    )
    await input.unassignAssetFromPosition(assetKey, position)
    await afterRemove(ref)
    return true
  }

  const onRemoveAssetFromNextOp = async (
    assetKey: string,
    position: string
  ): Promise<boolean> => {
    const ref = resolvePositionAssetHaveRef(
      assetKey,
      position,
      input.getRosterSnapshot(),
      input.assetsByKey
    )
    await input.removeScheduledAssignAssetFromPosition(assetKey, position)
    await afterRemove(ref)
    return true
  }

  const onRemoveAssetFromScheduledUnassign = async (
    assetKey: string,
    position: string
  ): Promise<boolean> => {
    const ref = resolvePositionAssetHaveRef(
      assetKey,
      position,
      input.getRosterSnapshot(),
      input.assetsByKey
    )
    await input.removeScheduledUnassignAssetFromPosition(assetKey, position)
    await afterRemove(ref)
    return true
  }

  const onRemoveResourceCategory = async (
    categoryId: string,
    position: string
  ): Promise<boolean> => {
    const ref = resolveResourceCategoryHaveRef(
      categoryId,
      position,
      input.getRosterSnapshot()
    )
    await input.deleteResourceCategoryById(categoryId)
    await afterRemove(ref)
    return true
  }

  return {
    canManageRoster: input.canManageRoster,
    isSupabaseEnabled: input.isSupabaseEnabled,
    showPositionAssets: input.showPositionAssets,
    isPositionBusy: input.isPositionBusy,
    assignableByPosition: input.assignableByPosition,
    scheduleAssignableByPosition: input.scheduleAssignableByPosition,
    assignableAssetsByPosition: input.assignableAssetsByPosition,
    scheduleAssignableAssetsByPosition: input.scheduleAssignableAssetsByPosition,
    pocMembers: input.pocMembers,
    workspaceRosterMembers: input.workspaceRosterMembers,
    inlinePositionInvite: input.inlinePositionInvite,
    onSearchOrgMembers: input.onSearchOrgMembers,
    onAssignExistingMember,
    onAssignOrgMember,
    onAssignAsset,
    onCreateResourceCategory,
    onAlsoScheduleMemberForNextOp,
    onAlsoScheduleAssetForNextOp,
    onAlsoScheduleResourceCategoryForNextOp,
    onRemoveMemberFromCurrentOp,
    onRemoveMemberFromNextOp,
    onRemoveMemberFromScheduledUnassign,
    onRemoveAssetFromCurrentOp,
    onRemoveAssetFromNextOp,
    onRemoveAssetFromScheduledUnassign,
    onRemoveResourceCategory,
  }
}

export async function handleHaveLinkInlineInviteSuccess(
  params: {
    email: string
    position: string
    op: HaveLinkOperationalPeriod
    reloadRosterForHaveLink: () => Promise<void>
    getRosterSnapshot: () => WorkspaceRosterMember[]
    onAssignmentAdded?: (ref: string) => void
  },
  result: PositionRosterInviteSubmitResult
): Promise<PositionRosterInviteSubmitResult> {
  if (result !== 'success') {
    return result
  }
  await params.reloadRosterForHaveLink()
  const ref = resolveMemberHaveRefByEmail(
    params.email,
    params.position,
    params.getRosterSnapshot()
  )
  notifyAssignmentAdded(ref, params.onAssignmentAdded)
  return result
}

import type { PositionRosterInviteSubmitResult } from '@/features/roster/position-roster-messages'
import type { RosterInviteAssignmentMode } from '@/features/roster/position-roster-messages'
import type { ResourceListItemData } from '@/features/resources/types'
import type { ResourceCategoryLifecycle } from '@/lib/workspace-resource-category-types'
import type { WorkspaceResourceCategoryRow } from '@/lib/workspace-resource-category-types'
import { buildWorkAssignmentTarget } from '@/lib/work-assignment-target'
import type { OrgMemberSearchResult } from '@/lib/workspace-service'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export type HaveLinkOperationalPeriod = 'current' | 'next'

export type HaveLinkRosterActions = {
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
  inlinePositionInvite?: {
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
  onAssignExistingMember: (
    memberId: string,
    position: string,
    op: HaveLinkOperationalPeriod
  ) => Promise<boolean>
  onAssignOrgMember: (
    userId: string,
    position: string,
    op: HaveLinkOperationalPeriod
  ) => Promise<boolean>
  onAssignAsset: (
    assetKey: string,
    position: string,
    op: HaveLinkOperationalPeriod,
    pointOfContactMemberId?: string
  ) => Promise<boolean>
  onCreateResourceCategory: (
    position: string,
    name: string,
    op: HaveLinkOperationalPeriod
  ) => Promise<boolean>
  onAlsoScheduleMemberForNextOp: (memberId: string, position: string) => Promise<boolean>
  onAlsoScheduleAssetForNextOp: (assetKey: string, position: string) => Promise<boolean>
  onAlsoScheduleResourceCategoryForNextOp: (
    categoryId: string,
    position: string
  ) => Promise<boolean>
  onRemoveMemberFromCurrentOp: (memberId: string, position: string) => Promise<boolean>
  onRemoveMemberFromNextOp: (memberId: string, position: string) => Promise<boolean>
  onRemoveMemberFromScheduledUnassign: (memberId: string, position: string) => Promise<boolean>
  onRemoveAssetFromCurrentOp: (assetKey: string, position: string) => Promise<boolean>
  onRemoveAssetFromNextOp: (assetKey: string, position: string) => Promise<boolean>
  onRemoveAssetFromScheduledUnassign: (assetKey: string, position: string) => Promise<boolean>
  onRemoveResourceCategory: (categoryId: string, position: string) => Promise<boolean>
  onSearchOrgMembers?: (query: string, position?: string) => Promise<OrgMemberSearchResult[]>
}

export function mapHaveLinkOpToInviteMode(op: HaveLinkOperationalPeriod): RosterInviteAssignmentMode {
  return op === 'next' ? 'schedule_on_op_advance' : 'assign_now'
}

export function mapHaveLinkOpToCategoryLifecycle(
  op: HaveLinkOperationalPeriod
): ResourceCategoryLifecycle {
  return op === 'next' ? 'scheduled_assign' : 'active'
}

export function resolveMemberHaveRef(
  memberId: string,
  position: string,
  roster: WorkspaceRosterMember[]
): string {
  return buildWorkAssignmentTarget({
    type: 'member',
    memberId,
    position,
    roster,
  }).value
}

export function resolveMemberHaveRefByEmail(
  email: string,
  position: string,
  roster: WorkspaceRosterMember[]
): string | null {
  const normalized = email.trim().toLowerCase()
  const member = roster.find((entry) => entry.email.trim().toLowerCase() === normalized)
  if (!member) return null
  return resolveMemberHaveRef(member.id, position, roster)
}

export function resolvePositionAssetHaveRef(
  assetKey: string,
  position: string,
  roster: WorkspaceRosterMember[],
  assetsByKey: Record<string, ResourceListItemData>
): string {
  return buildWorkAssignmentTarget({
    type: 'position_asset',
    assetKey,
    position,
    roster,
    assetsByKey,
  }).value
}

export function resolveResourceCategoryHaveRef(
  position: string,
  categoryId: string,
  roster: WorkspaceRosterMember[]
): string {
  return buildWorkAssignmentTarget({
    type: 'resource_category',
    categoryId,
    position,
    roster,
  }).value
}

export function findResourceCategoryId(
  position: string,
  name: string,
  lifecycle: ResourceCategoryLifecycle,
  categories: WorkspaceResourceCategoryRow[]
): string | null {
  const normalizedName = name.trim()
  const match = categories.find(
    (category) =>
      category.positionName === position &&
      category.name.trim() === normalizedName &&
      category.lifecycle === lifecycle
  )
  return match?.id ?? null
}

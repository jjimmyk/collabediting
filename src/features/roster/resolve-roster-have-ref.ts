import type { Ics215HaveLinkLocation } from '@/features/ics215/ics215-have-asset-link'
import { buildWorkAssignmentTarget } from '@/lib/work-assignment-target'
import type { ResourceListItemData } from '@/features/resources/types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export function resolveMemberHaveRef(
  memberId: string,
  position: string,
  roster: WorkspaceRosterMember[],
  competencyFunction?: string | null
): string {
  return buildWorkAssignmentTarget({
    type: 'member',
    memberId,
    position,
    competencyFunction,
    roster,
  }).value
}

export function resolvePositionAssetHaveRef(
  assetKey: string,
  position: string,
  roster: WorkspaceRosterMember[] = [],
  assetsByKey: Record<string, ResourceListItemData> = {}
): string {
  return buildWorkAssignmentTarget({
    type: 'position_asset',
    assetKey,
    position,
    roster,
    assetsByKey,
  }).value
}

export function resolveResourceCategoryHaveRef(categoryId: string): string {
  return buildWorkAssignmentTarget({
    type: 'resource_category',
    categoryId,
  }).value
}

export function resolveOrgChartAssetHaveRef(
  assetKey: string,
  roster: WorkspaceRosterMember[] = [],
  assetsByKey: Record<string, ResourceListItemData> = {}
): string {
  return buildWorkAssignmentTarget({
    type: 'org_chart_asset',
    assetKey,
    roster,
    assetsByKey,
  }).value
}

export function resolveSingleResourceHaveRef(member: WorkspaceRosterMember): string {
  return buildWorkAssignmentTarget({
    type: 'single_resource',
    memberId: member.id,
    roster: [member],
  }).value
}

export function lookupHaveLinkLocation(
  index: Map<string, Ics215HaveLinkLocation> | undefined,
  ref: string
): Ics215HaveLinkLocation | undefined {
  if (!index || !ref.trim()) return undefined
  return index.get(ref)
}

export function isHaveLinkActiveCell(
  location: Ics215HaveLinkLocation | undefined,
  activeCell?: { rowId: number; columnId: string } | null
): boolean {
  if (!location || !activeCell) return false
  return location.rowId === activeCell.rowId && location.columnId === activeCell.columnId
}

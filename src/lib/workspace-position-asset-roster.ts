import type { ResourceListItemData } from '@/features/resources/types'
import type {
  PositionAssetRosterEntry,
  PositionAssetScheduleMap,
  PositionAssetWorkspaceMeta,
  WorkspacePositionAssetAssignmentRow,
} from '@/lib/workspace-position-asset-types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export function buildPositionAssetWorkspaceMetaByKey(
  workspaceAssets: ResourceListItemData[],
  roster: WorkspaceRosterMember[]
): Record<string, PositionAssetWorkspaceMeta> {
  const memberEmailById = new Map(roster.map((member) => [member.id, member.email]))
  const map: Record<string, PositionAssetWorkspaceMeta> = {}

  for (const asset of workspaceAssets) {
    const memberId = asset.pointOfContactMemberId ?? null
    map[asset.assetKey] = {
      pointOfContactMemberId: memberId,
      pointOfContactEmail: memberId ? (memberEmailById.get(memberId) ?? null) : null,
    }
  }

  return map
}

export function resolvePositionAssetEntry(
  assetKey: string,
  assetsByKey: Record<string, ResourceListItemData>,
  workspaceMetaByAssetKey: Record<string, PositionAssetWorkspaceMeta>
): PositionAssetRosterEntry | null {
  const asset = assetsByKey[assetKey]
  if (!asset) return null

  const meta = workspaceMetaByAssetKey[assetKey]
  return {
    assetKey,
    name: asset.name,
    type: asset.type,
    pointOfContactMemberId: meta?.pointOfContactMemberId ?? asset.pointOfContactMemberId ?? null,
    pointOfContactEmail: meta?.pointOfContactEmail ?? null,
  }
}

export function groupPositionAssetAssignmentsByPosition(
  assignments: WorkspacePositionAssetAssignmentRow[],
  assetsByKey: Record<string, ResourceListItemData>,
  workspaceMetaByAssetKey: Record<string, PositionAssetWorkspaceMeta>
): Record<string, PositionAssetRosterEntry[]> {
  const map: Record<string, PositionAssetRosterEntry[]> = {}

  for (const row of assignments) {
    const entry = resolvePositionAssetEntry(row.assetKey, assetsByKey, workspaceMetaByAssetKey)
    if (!entry) continue
    const current = map[row.positionName] ?? []
    current.push(entry)
    map[row.positionName] = current
  }

  for (const position of Object.keys(map)) {
    map[position].sort((a, b) => a.name.localeCompare(b.name))
  }

  return map
}

export function resolveScheduledPositionAssets(
  assetKeys: string[],
  assetsByKey: Record<string, ResourceListItemData>,
  workspaceMetaByAssetKey: Record<string, PositionAssetWorkspaceMeta>
): PositionAssetRosterEntry[] {
  return assetKeys
    .map((assetKey) => resolvePositionAssetEntry(assetKey, assetsByKey, workspaceMetaByAssetKey))
    .filter((entry): entry is PositionAssetRosterEntry => Boolean(entry))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function assetsAssignableToPosition(
  workspaceAssets: ResourceListItemData[],
  position: string,
  activeAssetKeys: string[],
  scheduledAssignAssetKeys: string[] = []
): ResourceListItemData[] {
  const active = new Set(activeAssetKeys)
  const scheduled = new Set(scheduledAssignAssetKeys)

  return workspaceAssets.filter(
    (asset) => !active.has(asset.assetKey) && !scheduled.has(asset.assetKey)
  )
}

export function assetsScheduleUnassignableFromPosition(
  activeAssetKeys: string[],
  scheduledUnassignAssetKeys: string[] = [],
  assetsByKey: Record<string, ResourceListItemData>
): ResourceListItemData[] {
  const scheduled = new Set(scheduledUnassignAssetKeys)

  return activeAssetKeys
    .filter((assetKey) => !scheduled.has(assetKey))
    .map((assetKey) => assetsByKey[assetKey])
    .filter((asset): asset is ResourceListItemData => Boolean(asset))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function formatPositionAssetAssignmentCount(assetCount: number): string {
  if (assetCount === 0) return 'No assets'
  if (assetCount === 1) return '1 asset'
  return `${assetCount} assets`
}

export function positionAssetKeysFromSchedules(
  schedulesByPosition: PositionAssetScheduleMap,
  position: string
): { assignAssetKeys: string[]; unassignAssetKeys: string[] } {
  return schedulesByPosition[position] ?? { assignAssetKeys: [], unassignAssetKeys: [] }
}

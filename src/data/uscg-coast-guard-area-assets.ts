import type { ResourceListItemData } from '@/features/resources/types'
import type { UscgCoastGuardAreaKey } from '@/data/uscg-coast-guard-area-geometries'
import { getResourceWorkspaceAssignmentLabel } from '@/features/resources/utils'

export function filterCoastGuardAreaAssets(
  areaKey: UscgCoastGuardAreaKey,
  assets: ResourceListItemData[],
  searchQuery: string
): ResourceListItemData[] {
  const areaAssets = assets.filter((asset) => asset.areaKey === areaKey)
  const normalizedQuery = searchQuery.trim().toLowerCase()
  if (!normalizedQuery) {
    return areaAssets
  }

  return areaAssets.filter((asset) =>
    [
      asset.name,
      asset.assetStatus,
      asset.assetStatusUpdatedAt,
      asset.owner,
      asset.status,
      asset.type,
      asset.location,
      asset.notes,
      asset.currentLocation,
      asset.opcon,
      asset.tacon,
      asset.pointOfContact,
      asset.owningOrganization,
      asset.unitType,
      asset.unitName,
      asset.hullTailNumber,
      asset.capabilities,
      getResourceWorkspaceAssignmentLabel(asset),
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery)
  )
}

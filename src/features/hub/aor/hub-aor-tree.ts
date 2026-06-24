import type { ResourceListItemData } from '@/features/resources/types'
import type {
  HubAorAreaView,
  HubAorDistrictView,
  HubAorNode,
  HubAorNodeView,
} from '@/features/hub/aor/hub-aor-types'
import {
  assignAssetsToHubAorNodes,
  buildAssetSearchText,
} from '@/features/hub/aor/hub-aor-asset-placement'
import {
  districtNodeId,
  HUB_AOR_DISTRICTS,
  USCG_COAST_GUARD_AREAS,
} from '@/features/hub/aor/hub-aor-districts'
import { HUB_AOR_HIERARCHY_NODES } from '@/features/hub/aor/hub-aor-hierarchy-nodes'

function buildDistrictSearchText(district: (typeof HUB_AOR_DISTRICTS)[number]): string {
  return [
    district.name,
    district.lead,
    district.priority,
    String(district.incidents),
    district.population,
    district.lastUpdate,
    district.evacuationStatus,
    district.notes,
    district.sitrep,
    district.sitrepUpdatedBy,
    ...district.sitrepSources,
  ]
    .join(' ')
    .toLowerCase()
}

function buildNodeSearchText(node: HubAorNode): string {
  return [node.name, node.kind, node.lead, node.notes, node.parentId]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function buildNodeTree(
  districtId: number,
  parentId: string,
  nodesByParent: Map<string, HubAorNode[]>,
  assetsByNodeId: Record<string, ResourceListItemData[]>
): HubAorNodeView[] {
  const children = nodesByParent.get(parentId) ?? []
  return children
    .filter((node) => node.districtId === districtId)
    .map((node) => ({
      node,
      assets: assetsByNodeId[node.id] ?? [],
      children: buildNodeTree(districtId, node.id, nodesByParent, assetsByNodeId),
    }))
}

export function buildHubAorAreaViews(assets: ResourceListItemData[]): HubAorAreaView[] {
  const { assetsByNodeId, unassignedAssetKeys } = assignAssetsToHubAorNodes(assets)
  const nodesByParent = new Map<string, HubAorNode[]>()

  for (const node of HUB_AOR_HIERARCHY_NODES) {
    const siblings = nodesByParent.get(node.parentId) ?? []
    siblings.push(node)
    nodesByParent.set(node.parentId, siblings)
  }

  return USCG_COAST_GUARD_AREAS.map((area) => {
    const areaAssets = assets.filter((asset) => asset.areaKey === area.key)
    const unassignedAssets = areaAssets.filter((asset) => unassignedAssetKeys.has(asset.assetKey))

    const districts: HubAorDistrictView[] = HUB_AOR_DISTRICTS.filter((district) =>
      area.districtIds.includes(district.id)
    ).map((district) => {
      const districtNodeKey = districtNodeId(district.id)
      return {
        district,
        childNodes: buildNodeTree(district.id, districtNodeKey, nodesByParent, assetsByNodeId),
        assets: assetsByNodeId[districtNodeKey] ?? [],
      }
    })

    return {
      area,
      districts,
      unassignedAssets,
    }
  })
}

export function buildDistrictSearchTextById(): Map<number, string> {
  return new Map(HUB_AOR_DISTRICTS.map((district) => [district.id, buildDistrictSearchText(district)]))
}

export function buildNodeSearchTextById(): Map<string, string> {
  return new Map(HUB_AOR_HIERARCHY_NODES.map((node) => [node.id, buildNodeSearchText(node)]))
}

export function buildAssetSearchTextByKey(assets: ResourceListItemData[]): Map<string, string> {
  return new Map(assets.map((asset) => [asset.assetKey, buildAssetSearchText(asset)]))
}

export { buildDistrictSearchText, buildNodeSearchText, buildAssetSearchText }

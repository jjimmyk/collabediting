import type { ResourceListItemData } from '@/features/resources/types'
import type { UscgCoastGuardAreaKey } from '@/data/uscg-coast-guard-area-geometries'
import type {
  HubAorAreaView,
  HubAorDistrictView,
  HubAorNodeView,
  HubAorSearchResult,
} from '@/features/hub/aor/hub-aor-types'
import {
  buildAssetSearchTextByKey,
  buildDistrictSearchTextById,
  buildNodeSearchTextById,
} from '@/features/hub/aor/hub-aor-tree'
import { districtNodeId, HUB_AOR_DISTRICTS } from '@/features/hub/aor/hub-aor-districts'
import { HUB_AOR_HIERARCHY_NODES } from '@/features/hub/aor/hub-aor-hierarchy-nodes'

const NODE_BY_ID = new Map(HUB_AOR_HIERARCHY_NODES.map((node) => [node.id, node]))

function emptySearchResult(): HubAorSearchResult {
  return {
    directMatchDistrictIds: new Set(),
    directMatchNodeIds: new Set(),
    directMatchAssetKeys: new Set(),
    expandDistrictIds: new Set(),
    expandNodeIds: new Set(),
    expandAreaKeys: new Set(),
    visibleDistrictIds: new Set(),
    visibleNodeIds: new Set(),
    visibleAssetKeys: new Set(),
    summary: { districts: 0, sectors: 0, airStations: 0, subUnits: 0, assets: 0 },
  }
}

function collectNodeAssets(nodeViews: HubAorNodeView[]): ResourceListItemData[] {
  return nodeViews.flatMap((view) => [...view.assets, ...collectNodeAssets(view.children)])
}

function collectAllNodeIds(nodeViews: HubAorNodeView[]): string[] {
  return nodeViews.flatMap((view) => [view.node.id, ...collectAllNodeIds(view.children)])
}

function findNodeView(nodeViews: HubAorNodeView[], nodeId: string): HubAorNodeView | null {
  for (const view of nodeViews) {
    if (view.node.id === nodeId) return view
    const nested = findNodeView(view.children, nodeId)
    if (nested) return nested
  }
  return null
}

function addNodeAncestorVisibility(nodeId: string, result: HubAorSearchResult): void {
  let current = NODE_BY_ID.get(nodeId)
  while (current) {
    result.visibleNodeIds.add(current.id)
    result.expandNodeIds.add(current.id)
    if (current.parentId.startsWith('district-')) {
      const districtId = Number(current.parentId.replace('district-', ''))
      if (!Number.isNaN(districtId)) {
        result.visibleDistrictIds.add(districtId)
        result.expandDistrictIds.add(districtId)
      }
      break
    }
    current = NODE_BY_ID.get(current.parentId)
  }
}

function findAssetPlacement(
  areaViews: HubAorAreaView[],
  assetKey: string
): { districtId: number; areaKey: UscgCoastGuardAreaKey; ancestorNodeIds: string[] } | null {
  for (const areaView of areaViews) {
    for (const districtView of areaView.districts) {
      if (districtView.assets.some((asset) => asset.assetKey === assetKey)) {
        return {
          districtId: districtView.district.id,
          areaKey: areaView.area.key,
          ancestorNodeIds: [districtNodeId(districtView.district.id)],
        }
      }
      const nested = findAssetInNodes(
        districtView.childNodes,
        assetKey,
        districtView.district.id,
        [districtNodeId(districtView.district.id)]
      )
      if (nested) {
        return { ...nested, areaKey: areaView.area.key }
      }
    }
    if (areaView.unassignedAssets.some((asset) => asset.assetKey === assetKey)) {
      return { districtId: 0, areaKey: areaView.area.key, ancestorNodeIds: [] }
    }
  }
  return null
}

function findAssetInNodes(
  nodeViews: HubAorNodeView[],
  assetKey: string,
  districtId: number,
  ancestors: string[]
): { districtId: number; ancestorNodeIds: string[] } | null {
  for (const view of nodeViews) {
    const nextAncestors = [...ancestors, view.node.id]
    if (view.assets.some((asset) => asset.assetKey === assetKey)) {
      return { districtId, ancestorNodeIds: nextAncestors }
    }
    const nested = findAssetInNodes(view.children, assetKey, districtId, nextAncestors)
    if (nested) return nested
  }
  return null
}

function filterNodeTree(
  nodeViews: HubAorNodeView[],
  visibleNodeIds: Set<string>,
  visibleAssetKeys: Set<string>
): HubAorNodeView[] {
  return nodeViews
    .map((view) => {
      const filteredChildren = filterNodeTree(view.children, visibleNodeIds, visibleAssetKeys)
      const filteredAssets = view.assets.filter((asset) => visibleAssetKeys.has(asset.assetKey))
      const nodeVisible = visibleNodeIds.has(view.node.id)
      if (!nodeVisible && filteredChildren.length === 0 && filteredAssets.length === 0) {
        return null
      }
      return { node: view.node, children: filteredChildren, assets: filteredAssets }
    })
    .filter((view): view is HubAorNodeView => view !== null)
}

function filterDistrictViews(
  districts: HubAorDistrictView[],
  visibleDistrictIds: Set<number>,
  visibleNodeIds: Set<string>,
  visibleAssetKeys: Set<string>
): HubAorDistrictView[] {
  return districts
    .map((view) => {
      const childNodes = filterNodeTree(view.childNodes, visibleNodeIds, visibleAssetKeys)
      const assets = view.assets.filter((asset) => visibleAssetKeys.has(asset.assetKey))
      const districtVisible = visibleDistrictIds.has(view.district.id)
      if (!districtVisible && childNodes.length === 0 && assets.length === 0) {
        return null
      }
      return { district: view.district, childNodes, assets }
    })
    .filter((view): view is HubAorDistrictView => view !== null)
}

export function searchHubAorHierarchy(
  areaViews: HubAorAreaView[],
  query: string
): HubAorSearchResult {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return emptySearchResult()
  }

  const districtSearch = buildDistrictSearchTextById()
  const nodeSearch = buildNodeSearchTextById()
  const allAssets = areaViews.flatMap((area) => [
    ...area.districts.flatMap((district) => [
      ...district.assets,
      ...collectNodeAssets(district.childNodes),
    ]),
    ...area.unassignedAssets,
  ])
  const assetSearch = buildAssetSearchTextByKey(allAssets)
  const result = emptySearchResult()

  for (const areaView of areaViews) {
    if (areaView.area.name.toLowerCase().includes(normalizedQuery)) {
      result.expandAreaKeys.add(areaView.area.key)
    }

    for (const districtView of areaView.districts) {
      const districtText = districtSearch.get(districtView.district.id) ?? ''
      if (districtText.includes(normalizedQuery)) {
        result.directMatchDistrictIds.add(districtView.district.id)
      }

      for (const nodeId of collectAllNodeIds(districtView.childNodes)) {
        const text = nodeSearch.get(nodeId) ?? ''
        if (text.includes(normalizedQuery)) {
          result.directMatchNodeIds.add(nodeId)
        }
      }

      for (const asset of [...districtView.assets, ...collectNodeAssets(districtView.childNodes)]) {
        if ((assetSearch.get(asset.assetKey) ?? '').includes(normalizedQuery)) {
          result.directMatchAssetKeys.add(asset.assetKey)
        }
      }
    }

    for (const asset of areaView.unassignedAssets) {
      if ((assetSearch.get(asset.assetKey) ?? '').includes(normalizedQuery)) {
        result.directMatchAssetKeys.add(asset.assetKey)
      }
    }
  }

  for (const districtId of result.directMatchDistrictIds) {
    result.expandDistrictIds.add(districtId)
    result.visibleDistrictIds.add(districtId)
    const district = areaViews
      .flatMap((area) => area.districts)
      .find((entry) => entry.district.id === districtId)
    if (district) {
      result.expandAreaKeys.add(district.district.areaKey)
      for (const nodeId of collectAllNodeIds(district.childNodes)) {
        result.visibleNodeIds.add(nodeId)
      }
      for (const asset of [...district.assets, ...collectNodeAssets(district.childNodes)]) {
        result.visibleAssetKeys.add(asset.assetKey)
      }
    }
  }

  for (const nodeId of result.directMatchNodeIds) {
    result.visibleNodeIds.add(nodeId)
    addNodeAncestorVisibility(nodeId, result)
    const node = NODE_BY_ID.get(nodeId)
    if (node) {
      result.expandAreaKeys.add(node.areaKey)
    }
    for (const areaView of areaViews) {
      for (const districtView of areaView.districts) {
        const nodeView = findNodeView(districtView.childNodes, nodeId)
        if (nodeView) {
          for (const asset of [...nodeView.assets, ...collectNodeAssets(nodeView.children)]) {
            result.visibleAssetKeys.add(asset.assetKey)
          }
          for (const childId of collectAllNodeIds(nodeView.children)) {
            result.visibleNodeIds.add(childId)
          }
        }
      }
    }
  }

  for (const assetKey of result.directMatchAssetKeys) {
    result.visibleAssetKeys.add(assetKey)
    const placement = findAssetPlacement(areaViews, assetKey)
    if (!placement) continue
    result.expandAreaKeys.add(placement.areaKey)
    if (placement.districtId > 0) {
      result.visibleDistrictIds.add(placement.districtId)
      result.expandDistrictIds.add(placement.districtId)
    }
    for (const ancestorId of placement.ancestorNodeIds) {
      if (ancestorId.startsWith('district-')) continue
      result.visibleNodeIds.add(ancestorId)
      result.expandNodeIds.add(ancestorId)
    }
  }

  result.summary = {
    districts: result.directMatchDistrictIds.size,
    sectors: [...result.directMatchNodeIds].filter((id) => id.startsWith('sector-')).length,
    airStations: [...result.directMatchNodeIds].filter((id) => id.startsWith('airsta-')).length,
    subUnits: [...result.directMatchNodeIds].filter((id) =>
      id.startsWith('station-') || id.startsWith('det-')
    ).length,
    assets: result.directMatchAssetKeys.size,
  }

  return result
}

export function filterHubAorAreaViews(
  areaViews: HubAorAreaView[],
  searchResult: HubAorSearchResult,
  hasQuery: boolean
): HubAorAreaView[] {
  if (!hasQuery) return areaViews

  return areaViews
    .map((areaView) => {
      const districts = filterDistrictViews(
        areaView.districts,
        searchResult.visibleDistrictIds,
        searchResult.visibleNodeIds,
        searchResult.visibleAssetKeys
      )
      const unassignedAssets = areaView.unassignedAssets.filter((asset) =>
        searchResult.visibleAssetKeys.has(asset.assetKey)
      )
      if (districts.length === 0 && unassignedAssets.length === 0) return null
      return { area: areaView.area, districts, unassignedAssets }
    })
    .filter((areaView): areaView is HubAorAreaView => areaView !== null)
}

export type HubAorFlatSearchHit = {
  id: string
  kind: 'hub-aor-district' | 'hub-aor-node' | 'hub-aor-asset'
  title: string
  subtitle: string
  location: [number, number]
  areaKey: UscgCoastGuardAreaKey
}

export function searchHubAorFlatHits(
  areaViews: HubAorAreaView[],
  query: string
): HubAorFlatSearchHit[] {
  const searchResult = searchHubAorHierarchy(areaViews, query)
  const hits: HubAorFlatSearchHit[] = []

  for (const districtId of searchResult.directMatchDistrictIds) {
    const district = HUB_AOR_DISTRICTS.find((entry) => entry.id === districtId)
    if (!district) continue
    hits.push({
      id: `hub-aor-district-${district.id}`,
      kind: 'hub-aor-district',
      title: district.name,
      subtitle: `${district.priority} • ${district.lead}`,
      location: district.location,
      areaKey: district.areaKey,
    })
  }

  for (const nodeId of searchResult.directMatchNodeIds) {
    const node = NODE_BY_ID.get(nodeId)
    if (!node) continue
    hits.push({
      id: `hub-aor-node-${node.id}`,
      kind: 'hub-aor-node',
      title: node.name,
      subtitle: node.kind.replace('_', ' '),
      location: node.location ?? [-98, 39],
      areaKey: node.areaKey,
    })
  }

  for (const assetKey of searchResult.directMatchAssetKeys) {
    const asset = areaViews
      .flatMap((area) => [
        ...area.districts.flatMap((district) => [
          ...district.assets,
          ...collectNodeAssets(district.childNodes),
        ]),
        ...area.unassignedAssets,
      ])
      .find((entry) => entry.assetKey === assetKey)
    if (!asset) continue
    hits.push({
      id: `hub-aor-asset-${asset.assetKey}`,
      kind: 'hub-aor-asset',
      title: asset.name,
      subtitle: `${asset.status} • ${asset.type}`,
      location: asset.mapLocation,
      areaKey: asset.areaKey as UscgCoastGuardAreaKey,
    })
  }

  return hits
}

export function hubAorScrollTargetFromResultId(resultId: string): string | null {
  if (resultId.startsWith('hub-aor-district-')) {
    return resultId.slice('hub-aor-district-'.length)
  }
  if (resultId.startsWith('hub-aor-node-')) {
    return resultId.slice('hub-aor-node-'.length)
  }
  if (resultId.startsWith('hub-aor-asset-')) {
    return resultId.slice('hub-aor-asset-'.length)
  }
  return null
}

export function hubAorPanelItemIdFromResultId(resultId: string): string {
  if (resultId.startsWith('hub-aor-district-')) {
    return `aor-${resultId.slice('hub-aor-district-'.length)}`
  }
  return resultId
}

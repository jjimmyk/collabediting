import type { UscgCoastGuardAreaKey } from '@/data/uscg-coast-guard-area-geometries'
import type { ResourceListItemData } from '@/features/resources/types'

export type HubAorNodeKind = 'district' | 'sector' | 'air_station' | 'sub_unit'

export type HubAorDistrict = {
  id: number
  name: string
  lead: string
  incidents: number
  priority: 'High' | 'Medium' | 'Low'
  population: string
  lastUpdate: string
  evacuationStatus: 'None' | 'Recommended' | 'Active'
  notes: string
  sitrep: string
  sitrepUpdatedBy: string
  sitrepSources: string[]
  location: [number, number]
  areaKey: UscgCoastGuardAreaKey
}

export type HubAorNode = {
  id: string
  kind: HubAorNodeKind
  name: string
  parentId: string
  districtId: number
  areaKey: UscgCoastGuardAreaKey
  lead?: string
  location?: [number, number]
  notes?: string
}

export type HubAorCoastGuardArea = {
  key: UscgCoastGuardAreaKey
  name: 'Atlantic Area' | 'Pacific Area'
  districtIds: number[]
  location: [number, number]
}

export type HubAorNodeView = {
  node: HubAorNode
  children: HubAorNodeView[]
  assets: ResourceListItemData[]
}

export type HubAorDistrictView = {
  district: HubAorDistrict
  childNodes: HubAorNodeView[]
  assets: ResourceListItemData[]
}

export type HubAorAreaView = {
  area: HubAorCoastGuardArea
  districts: HubAorDistrictView[]
  unassignedAssets: ResourceListItemData[]
}

export type HubAorSearchMatchKind = 'district' | HubAorNodeKind | 'asset'

export type HubAorSearchResult = {
  directMatchDistrictIds: Set<number>
  directMatchNodeIds: Set<string>
  directMatchAssetKeys: Set<string>
  expandDistrictIds: Set<number>
  expandNodeIds: Set<string>
  expandAreaKeys: Set<UscgCoastGuardAreaKey>
  visibleDistrictIds: Set<number>
  visibleNodeIds: Set<string>
  visibleAssetKeys: Set<string>
  summary: {
    districts: number
    sectors: number
    airStations: number
    subUnits: number
    assets: number
  }
}

export const HUB_AOR_NODE_KIND_LABELS: Record<HubAorNodeKind, string> = {
  district: 'District',
  sector: 'Sector',
  air_station: 'Air Station',
  sub_unit: 'Sub-unit',
}

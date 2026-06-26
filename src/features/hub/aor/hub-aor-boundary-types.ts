import type { UscgCoastGuardAreaKey } from '@/data/uscg-coast-guard-area-geometries'
import type { HubAorDistrict, HubAorNode } from '@/features/hub/aor/hub-aor-types'

export type HubAorBoundaryLevel = 'area' | 'district' | 'sector'

export type HubAorBoundaryDefinition = {
  id: string
  level: HubAorBoundaryLevel
  label: string
  parentId?: string
  location: [number, number]
  rings: number[][][]
  areaKey?: UscgCoastGuardAreaKey
  district?: HubAorDistrict
  sector?: HubAorNode
}

export const HUB_AOR_BOUNDARY_STORAGE_KEY = 'hub-aor-boundary-ids'

import { femaRegionGeometries } from '@/data/fema-regions'
import type { UscgCoastGuardAreaKey } from '@/data/uscg-coast-guard-area-geometries'
import {
  hubAorAreaBoundaryId,
  hubAorDistrictBoundaryId,
  hubAorSectorBoundaryId,
  isHubAorBoundaryId,
} from './aor-boundary-map-keys'
import { HUB_AOR_HIERARCHY_NODES } from './hub-aor-hierarchy-nodes'
import { HUB_AOR_DISTRICTS, USCG_COAST_GUARD_AREAS } from './hub-aor-districts'
import type { HubAorBoundaryDefinition } from './hub-aor-boundary-types'
import { HUB_AOR_BOUNDARY_STORAGE_KEY } from './hub-aor-boundary-types'

export function centroidBoundingPolygon(
  [longitude, latitude]: [number, number],
  lonHalfWidth: number,
  latHalfHeight: number
): number[][][] {
  return [
    [
      [longitude - lonHalfWidth, latitude - latHalfHeight],
      [longitude + lonHalfWidth, latitude - latHalfHeight],
      [longitude + lonHalfWidth, latitude + latHalfHeight],
      [longitude - lonHalfWidth, latitude + latHalfHeight],
      [longitude - lonHalfWidth, latitude - latHalfHeight],
    ],
  ]
}

function getRingsExtent(rings: number[][][]) {
  let minLon = Infinity
  let maxLon = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity

  for (const ring of rings) {
    for (const [lon, lat] of ring) {
      minLon = Math.min(minLon, lon)
      maxLon = Math.max(maxLon, lon)
      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
    }
  }

  return { minLon, maxLon, minLat, maxLat }
}

function extentBoundingPolygon(
  extent: { minLon: number; maxLon: number; minLat: number; maxLat: number },
  paddingLon = 0.5,
  paddingLat = 0.5
): number[][][] {
  return [
    [
      [extent.minLon - paddingLon, extent.minLat - paddingLat],
      [extent.maxLon + paddingLon, extent.minLat - paddingLat],
      [extent.maxLon + paddingLon, extent.maxLat + paddingLat],
      [extent.minLon - paddingLon, extent.maxLat + paddingLat],
      [extent.minLon - paddingLon, extent.minLat - paddingLat],
    ],
  ]
}

function getDistrictRings(districtId: number, location: [number, number]): number[][][] {
  const femaGeometry = femaRegionGeometries.find((entry) => entry.id === districtId)
  if (femaGeometry) {
    return femaGeometry.rings.map((ring) => ring.map((point) => [point[0], point[1]]))
  }

  return centroidBoundingPolygon(location, 6, 4.5)
}

function buildAreaRings(areaKey: UscgCoastGuardAreaKey): number[][][] {
  const districts = HUB_AOR_DISTRICTS.filter((district) => district.areaKey === areaKey)
  if (districts.length === 0) {
    const area = USCG_COAST_GUARD_AREAS.find((entry) => entry.key === areaKey)
    return centroidBoundingPolygon(area?.location ?? [-98, 39], 25, 18)
  }

  let combinedExtent: ReturnType<typeof getRingsExtent> | null = null

  for (const district of districts) {
    const districtRings = getDistrictRings(district.id, district.location)
    const extent = getRingsExtent(districtRings)
    if (!combinedExtent) {
      combinedExtent = extent
      continue
    }

    combinedExtent = {
      minLon: Math.min(combinedExtent.minLon, extent.minLon),
      maxLon: Math.max(combinedExtent.maxLon, extent.maxLon),
      minLat: Math.min(combinedExtent.minLat, extent.minLat),
      maxLat: Math.max(combinedExtent.maxLat, extent.maxLat),
    }
  }

  return extentBoundingPolygon(combinedExtent ?? { minLon: -130, maxLon: -65, minLat: 24, maxLat: 50 }, 1, 1)
}

function buildHubAorBoundaryCatalog(): HubAorBoundaryDefinition[] {
  const catalog: HubAorBoundaryDefinition[] = []

  for (const area of USCG_COAST_GUARD_AREAS) {
    catalog.push({
      id: hubAorAreaBoundaryId(area.key),
      level: 'area',
      label: area.name,
      location: area.location,
      rings: buildAreaRings(area.key),
      areaKey: area.key,
    })
  }

  for (const district of HUB_AOR_DISTRICTS) {
    catalog.push({
      id: hubAorDistrictBoundaryId(district.id),
      level: 'district',
      label: district.name,
      parentId: hubAorAreaBoundaryId(district.areaKey),
      location: district.location,
      rings: getDistrictRings(district.id, district.location),
      areaKey: district.areaKey,
      district,
    })
  }

  for (const sector of HUB_AOR_HIERARCHY_NODES.filter((node) => node.kind === 'sector')) {
    const location = sector.location ?? [-98, 39]
    catalog.push({
      id: hubAorSectorBoundaryId(sector.id),
      level: 'sector',
      label: sector.name,
      parentId: hubAorDistrictBoundaryId(sector.districtId),
      location,
      rings: centroidBoundingPolygon(location, 2, 1.5),
      areaKey: sector.areaKey,
      sector,
    })
  }

  return catalog
}

export const HUB_AOR_BOUNDARY_CATALOG: readonly HubAorBoundaryDefinition[] = buildHubAorBoundaryCatalog()

const catalogById = new Map(HUB_AOR_BOUNDARY_CATALOG.map((entry) => [entry.id, entry]))

const childrenByParentId = new Map<string, string[]>()
for (const entry of HUB_AOR_BOUNDARY_CATALOG) {
  if (!entry.parentId) {
    continue
  }

  const siblings = childrenByParentId.get(entry.parentId) ?? []
  siblings.push(entry.id)
  childrenByParentId.set(entry.parentId, siblings)
}

export function getHubAorBoundaryDefinition(id: string): HubAorBoundaryDefinition | undefined {
  return catalogById.get(id)
}

export function getDescendantHubAorBoundaryIds(id: string): string[] {
  const descendants: string[] = []
  const queue = [...(childrenByParentId.get(id) ?? [])]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) {
      continue
    }

    descendants.push(current)
    queue.push(...(childrenByParentId.get(current) ?? []))
  }

  return descendants
}

export function getHubAorBoundaryCheckState(
  id: string,
  enabledIds: Set<string>
): boolean | 'indeterminate' {
  if (enabledIds.has(id)) {
    return true
  }

  const descendants = getDescendantHubAorBoundaryIds(id)
  if (descendants.length === 0) {
    return false
  }

  const enabledDescendants = descendants.filter((entry) => enabledIds.has(entry))
  if (enabledDescendants.length === 0) {
    return false
  }

  return 'indeterminate'
}

export function applyHubAorBoundaryToggle(
  enabledIds: Set<string>,
  boundaryId: string,
  checked: boolean
): Set<string> {
  const next = new Set(enabledIds)
  const affectedIds = [boundaryId, ...getDescendantHubAorBoundaryIds(boundaryId)]

  if (checked) {
    affectedIds.forEach((id) => next.add(id))
  } else {
    affectedIds.forEach((id) => next.delete(id))
  }

  return next
}

export function removeSingleHubAorBoundaryId(
  enabledIds: Set<string>,
  boundaryId: string
): Set<string> {
  const next = new Set(enabledIds)
  next.delete(boundaryId)
  return next
}

export function loadEnabledHubAorBoundaryIds(): Set<string> {
  if (typeof window === 'undefined') {
    return new Set()
  }

  try {
    const raw = window.localStorage.getItem(HUB_AOR_BOUNDARY_STORAGE_KEY)
    if (!raw) {
      return new Set()
    }

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return new Set()
    }

    return new Set(parsed.filter((entry): entry is string => typeof entry === 'string' && isHubAorBoundaryId(entry)))
  } catch {
    return new Set()
  }
}

export function saveEnabledHubAorBoundaryIds(ids: Set<string>) {
  if (typeof window === 'undefined') {
    return
  }

  const validIds = [...ids].filter(isHubAorBoundaryId)
  window.localStorage.setItem(HUB_AOR_BOUNDARY_STORAGE_KEY, JSON.stringify(validIds))
}

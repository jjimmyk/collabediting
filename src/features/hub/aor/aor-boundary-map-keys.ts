import type { UscgCoastGuardAreaKey } from '@/data/uscg-coast-guard-area-geometries'

export function hubAorAreaBoundaryId(areaKey: UscgCoastGuardAreaKey): string {
  return `hub-aor-area-${areaKey}`
}

export function hubAorDistrictBoundaryId(districtId: number): string {
  return `hub-aor-district-${districtId}`
}

export function hubAorSectorBoundaryId(sectorNodeId: string): string {
  return `hub-aor-sector-${sectorNodeId}`
}

export function parseHubAorDistrictBoundaryId(boundaryId: string): number | null {
  const match = /^hub-aor-district-(\d+)$/.exec(boundaryId)
  if (!match) {
    return null
  }

  return Number.parseInt(match[1], 10)
}

export function isHubAorBoundaryId(boundaryId: string): boolean {
  return (
    boundaryId.startsWith('hub-aor-area-') ||
    boundaryId.startsWith('hub-aor-district-') ||
    boundaryId.startsWith('hub-aor-sector-')
  )
}

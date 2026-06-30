import { getHubAorNodeById } from '@/features/hub/aor/hub-aor-asset-placement'
import {
  districtNodeId,
  getHubAorDistrictById,
  HUB_AOR_DISTRICTS,
} from '@/features/hub/aor/hub-aor-districts'
import { HUB_AOR_HIERARCHY_NODES } from '@/features/hub/aor/hub-aor-hierarchy-nodes'
import { resolveHubAorProfileNodeLabel } from '@/features/hub/aor/hub-aor-profile-options'

export const ACTIVATION_FALLBACK_LOCATION: [number, number] = [-98.5795, 39.8283]

function haversineDistanceKm(
  lng1: number,
  lat1: number,
  lng2: number,
  lat2: number
): number {
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function resolveAorNodeDistrictId(nodeId: string): number | null {
  if (nodeId.startsWith('district-')) {
    const districtId = Number.parseInt(nodeId.slice('district-'.length), 10)
    return Number.isFinite(districtId) ? districtId : null
  }

  const node = getHubAorNodeById(nodeId)
  return node?.districtId ?? null
}

export function resolveAorNodeDistrictName(nodeId: string | null | undefined): string | null {
  if (!nodeId?.trim()) return null
  const districtId = resolveAorNodeDistrictId(nodeId)
  if (districtId == null) return null
  return getHubAorDistrictById(districtId)?.name ?? null
}

export function resolveAorNodeCoordinates(nodeId: string): [number, number] | null {
  if (nodeId.startsWith('district-')) {
    const districtId = Number.parseInt(nodeId.slice('district-'.length), 10)
    if (!Number.isFinite(districtId)) return null
    return getHubAorDistrictById(districtId)?.location ?? null
  }

  const node = getHubAorNodeById(nodeId)
  if (!node) return null
  if (node.location) {
    return node.location
  }

  const district = getHubAorDistrictById(node.districtId)
  return district?.location ?? null
}

export function formatAorLocationGeometrySummary(
  label: string,
  coords: [number, number]
): string {
  const [lng, lat] = coords
  return `AOR: ${label} (${lat.toFixed(5)}, ${lng.toFixed(5)})`
}

export function parseGeometrySummaryCoordinates(
  geometrySummary: string
): { lng: number; lat: number } | null {
  const match = geometrySummary.match(/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/)
  if (!match) return null

  const first = Number.parseFloat(match[1])
  const second = Number.parseFloat(match[2])
  if (Number.isNaN(first) || Number.isNaN(second)) return null

  // Legacy summaries use "lat, lng"; AOR summaries use the same order in formatAorLocationGeometrySummary.
  const asLatLng = Math.abs(first) <= 90 && Math.abs(second) <= 180
  if (asLatLng) {
    return { lat: first, lng: second }
  }

  const asLngLat = Math.abs(second) <= 90 && Math.abs(first) <= 180
  if (asLngLat) {
    return { lng: first, lat: second }
  }

  return { lat: first, lng: second }
}

export function findNearestDistrictNodeId(lng: number, lat: number): string | null {
  let nearest: { nodeId: string; distance: number } | null = null

  for (const district of HUB_AOR_DISTRICTS) {
    const [districtLng, districtLat] = district.location
    const distance = haversineDistanceKm(lng, lat, districtLng, districtLat)
    if (!nearest || distance < nearest.distance) {
      nearest = { nodeId: districtNodeId(district.id), distance }
    }
  }

  return nearest?.nodeId ?? null
}

export function findNearestDistrictName(lng: number, lat: number): string | null {
  const nodeId = findNearestDistrictNodeId(lng, lat)
  if (!nodeId) return null
  return resolveAorNodeDistrictName(nodeId)
}

export function matchAorsFromLocationText(text: string): string[] {
  const normalized = text.trim().toLowerCase()
  if (!normalized) return []

  const matches = new Set<string>()

  const districtNumberMatch = normalized.match(/district\s*(\d+)/i)
  if (districtNumberMatch) {
    const districtNumber = districtNumberMatch[1]
    for (const district of HUB_AOR_DISTRICTS) {
      if (district.name.includes(`District ${districtNumber}`)) {
        matches.add(districtNodeId(district.id))
      }
    }
  }

  for (const node of HUB_AOR_HIERARCHY_NODES) {
    const label = node.name.toLowerCase()
    if (normalized.includes(label) || label.includes(normalized)) {
      matches.add(node.id)
    }
  }

  for (const district of HUB_AOR_DISTRICTS) {
    const districtHaystack = [district.name, district.lead, district.notes]
      .join(' ')
      .toLowerCase()
    if (
      normalized.includes(district.name.toLowerCase()) ||
      districtHaystack.includes(normalized) ||
      district.name.toLowerCase().includes(normalized)
    ) {
      matches.add(districtNodeId(district.id))
    }
  }

  return [...matches]
}

export function formatActivationAorLabels(nodeIds: string[]): string[] {
  return nodeIds
    .map((nodeId) => resolveHubAorProfileNodeLabel(nodeId))
    .filter((label): label is string => Boolean(label))
}

export function resolveAutoFilledAors(input: {
  locationMethod: string
  geometrySummary: string
  address: string
  aorNodeId: string | null
}): string[] {
  if (input.locationMethod === 'select-aor' && input.aorNodeId) {
    return [input.aorNodeId]
  }

  if (input.locationMethod === 'enter-address') {
    return matchAorsFromLocationText(input.address)
  }

  if (
    input.locationMethod === 'draw-point' ||
    input.locationMethod === 'draw-polygon'
  ) {
    const parsed = parseGeometrySummaryCoordinates(input.geometrySummary)
    if (!parsed) return []
    const nodeId = findNearestDistrictNodeId(parsed.lng, parsed.lat)
    return nodeId ? [nodeId] : []
  }

  return []
}

export function resolveWorkspaceCoordinates(input: {
  locationMethod: string
  geometrySummary: string
  address: string
  aorNodeId: string | null
}): [number, number] {
  if (input.locationMethod === 'select-aor' && input.aorNodeId) {
    return resolveAorNodeCoordinates(input.aorNodeId) ?? ACTIVATION_FALLBACK_LOCATION
  }

  const parsed = parseGeometrySummaryCoordinates(input.geometrySummary)
  if (parsed) {
    return [parsed.lng, parsed.lat]
  }

  if (input.locationMethod === 'enter-address' && input.address.trim()) {
    const matched = matchAorsFromLocationText(input.address)
    if (matched.length > 0) {
      const coords = resolveAorNodeCoordinates(matched[0])
      if (coords) {
        return coords
      }
    }
  }

  return ACTIVATION_FALLBACK_LOCATION
}

export function resolveActivationLocationLabel(input: {
  locationMethod: string
  geometrySummary: string
  address: string
  aorNodeId: string | null
}): string | undefined {
  if (input.locationMethod === 'enter-address' && input.address.trim()) {
    return input.address.trim()
  }

  if (input.locationMethod === 'select-aor' && input.aorNodeId) {
    return resolveHubAorProfileNodeLabel(input.aorNodeId) ?? undefined
  }

  if (input.geometrySummary.trim()) {
    return input.geometrySummary.trim()
  }

  return undefined
}

export function districtNodeIdFromDistrictName(name: string): string | null {
  const district = HUB_AOR_DISTRICTS.find((entry) => entry.name === name)
  return district ? districtNodeId(district.id) : null
}

export function resolveActivationAorRegionLabel(nodeIds: string[]): string {
  const labels = formatActivationAorLabels(nodeIds)
  return labels.length > 0 ? labels.join(', ') : 'Unassigned AOR'
}

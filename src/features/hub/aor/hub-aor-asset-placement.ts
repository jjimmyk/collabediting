import type { ResourceListItemData } from '@/features/resources/types'
import { getResourceWorkspaceAssignmentLabel } from '@/features/resources/utils'
import type { HubAorNode } from '@/features/hub/aor/hub-aor-types'
import { districtNodeId, HUB_AOR_DISTRICTS } from '@/features/hub/aor/hub-aor-districts'
import { HUB_AOR_HIERARCHY_NODES } from '@/features/hub/aor/hub-aor-hierarchy-nodes'

const OWNER_TO_NODE_ID: Record<string, string> = {
  'USCG Sector Virginia': 'sector-virginia',
  'USCG Station Portsmouth': 'station-portsmouth',
  'USCG Aviation Forces Atlantic': 'airsta-elizabeth-city',
  'USCG District 11 — Pacific': districtNodeId(9),
  'USCG Air Station Kodiak': 'airsta-kodiak',
  'USCG Station Honolulu': 'station-honolulu',
}

const NODE_BY_ID = new Map(HUB_AOR_HIERARCHY_NODES.map((node) => [node.id, node]))

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase()
}

function nodeMatchesLabel(node: HubAorNode, label: string): boolean {
  const normalized = normalizeLabel(label)
  if (normalizeLabel(node.name) === normalized) return true
  if (normalized.includes('sector') && normalizeLabel(node.name).includes(normalized.replace(/^uscg\s+/i, ''))) {
    return true
  }
  if (normalized.includes('air station') && node.kind === 'air_station') {
    const short = normalized.replace(/^.*air station\s*/i, '')
    return normalizeLabel(node.name).includes(short)
  }
  if (normalized.includes('station') && node.kind === 'sub_unit') {
    const short = normalized.replace(/^.*station\s*/i, '')
    return normalizeLabel(node.name).includes(short)
  }
  return normalizeLabel(node.name).includes(normalized) || normalized.includes(normalizeLabel(node.name))
}

export function resolveAssetHubAorNodeId(asset: ResourceListItemData): string | null {
  const candidates = [asset.tacon, asset.owner, asset.location, asset.notes].filter(Boolean) as string[]

  for (const candidate of candidates) {
    const mapped = OWNER_TO_NODE_ID[candidate]
    if (mapped) return mapped
  }

  for (const candidate of candidates) {
    for (const node of HUB_AOR_HIERARCHY_NODES) {
      if (nodeMatchesLabel(node, candidate)) {
        return node.id
      }
    }
  }

  for (const candidate of candidates) {
    const district = HUB_AOR_DISTRICTS.find((entry) => candidate.includes(entry.name) || entry.name.includes(candidate))
    if (district) return districtNodeId(district.id)
  }

  return null
}

export function buildAssetSearchText(asset: ResourceListItemData): string {
  return [
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
}

export function assignAssetsToHubAorNodes(
  assets: ResourceListItemData[]
): {
  assetsByNodeId: Record<string, ResourceListItemData[]>
  unassignedAssetKeys: Set<string>
} {
  const assetsByNodeId: Record<string, ResourceListItemData[]> = {}
  const unassignedAssetKeys = new Set<string>()

  for (const asset of assets) {
    const nodeId = resolveAssetHubAorNodeId(asset)
    if (!nodeId) {
      unassignedAssetKeys.add(asset.assetKey)
      continue
    }
    assetsByNodeId[nodeId] = [...(assetsByNodeId[nodeId] ?? []), asset]
  }

  return { assetsByNodeId, unassignedAssetKeys }
}

export function getHubAorNodeById(nodeId: string): HubAorNode | undefined {
  return NODE_BY_ID.get(nodeId)
}

export function getAncestorNodeIds(nodeId: string): string[] {
  const ancestors: string[] = []
  let current = NODE_BY_ID.get(nodeId)
  while (current) {
    ancestors.push(current.parentId)
    if (current.parentId.startsWith('district-')) break
    current = NODE_BY_ID.get(current.parentId)
  }
  return ancestors
}

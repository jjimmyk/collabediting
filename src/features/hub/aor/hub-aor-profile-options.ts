import {
  districtNodeId,
  getHubAorDistrictById,
  HUB_AOR_DISTRICTS,
} from '@/features/hub/aor/hub-aor-districts'
import { getHubAorNodeById } from '@/features/hub/aor/hub-aor-asset-placement'
import { HUB_AOR_HIERARCHY_NODES } from '@/features/hub/aor/hub-aor-hierarchy-nodes'
import type { HubAorNodeKind } from '@/features/hub/aor/hub-aor-types'

export type HubAorProfileOption = {
  value: string
  label: string
  group: string
}

const NODE_KIND_GROUPS: Record<HubAorNodeKind, string> = {
  district: 'Districts',
  sector: 'Sectors',
  air_station: 'Air stations',
  sub_unit: 'Sub-units',
}

function districtProfileOptions(): HubAorProfileOption[] {
  return HUB_AOR_DISTRICTS.map((district) => ({
    value: districtNodeId(district.id),
    label: district.name,
    group: 'Districts',
  }))
}

function hierarchyProfileOptions(): HubAorProfileOption[] {
  return HUB_AOR_HIERARCHY_NODES.map((node) => ({
    value: node.id,
    label: node.name,
    group: NODE_KIND_GROUPS[node.kind],
  }))
}

export function buildHubAorProfileOptions(): HubAorProfileOption[] {
  return [...districtProfileOptions(), ...hierarchyProfileOptions()].sort((a, b) => {
    const groupCompare = a.group.localeCompare(b.group)
    if (groupCompare !== 0) return groupCompare
    return a.label.localeCompare(b.label)
  })
}

export function resolveHubAorProfileNodeLabel(nodeId: string | null | undefined): string | null {
  const trimmed = nodeId?.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('district-')) {
    const districtId = Number.parseInt(trimmed.slice('district-'.length), 10)
    if (Number.isFinite(districtId)) {
      return getHubAorDistrictById(districtId)?.name ?? null
    }
  }

  const node = getHubAorNodeById(trimmed)
  return node?.name ?? null
}

export function filterHubAorProfileOptions(
  options: HubAorProfileOption[],
  query: string
): HubAorProfileOption[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return options
  return options.filter(
    (option) =>
      option.label.toLowerCase().includes(normalized) ||
      option.group.toLowerCase().includes(normalized)
  )
}

import type { UscgCoastGuardAreaKey } from '@/data/uscg-coast-guard-area-geometries'
import type { AssetStatus, HubAssetCatalogRecord } from '@/features/resources/types'

const ORG_ASSET_ID_BASE = 10_000

export type OrganizationAssetPayload = {
  id: string
  organizationId: string
  assetKey: string
  name: string
  type: string
  owner: string
  assetStatus: string
  location: string
  notes: string
  areaKey: string
  mapLocation: [number, number]
  createdAt: string
}

export type CreateOrganizationAssetInput = {
  name: string
  type: string
  owner?: string
  assetStatus?: AssetStatus
  location?: string
  notes?: string
  areaKey?: UscgCoastGuardAreaKey
}

export function slugifyAssetName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

export function buildUniqueAssetKey(name: string, suffix: string): string {
  const base = slugifyAssetName(name) || 'asset'
  return `org-${base}-${suffix}`.slice(0, 80)
}

export function organizationAssetToCatalogRecord(
  asset: OrganizationAssetPayload,
  index: number
): HubAssetCatalogRecord {
  const areaKey = (asset.areaKey === 'pacific' ? 'pacific' : 'atlantic') as UscgCoastGuardAreaKey
  const assetStatus = (['FMC', 'PMC', 'NMC'].includes(asset.assetStatus)
    ? asset.assetStatus
    : 'FMC') as AssetStatus
  const [lng, lat] = asset.mapLocation

  return {
    assetKey: asset.assetKey,
    id: ORG_ASSET_ID_BASE + index + 1,
    areaKey,
    name: asset.name,
    assetStatus,
    assetStatusUpdatedAt: new Date(asset.createdAt).toLocaleString('en-US', {
      timeZone: 'UTC',
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    owner: asset.owner,
    status: 'Available',
    type: asset.type,
    teamLead: '',
    eta: '',
    location: asset.location,
    notes: asset.notes,
    mapLocation: [lng, lat],
    currentLocation: asset.location,
    datetimeOrdered: '',
    opcon: '',
    tacon: '',
    pointOfContact: '',
    owningOrganization: '',
    quantity: 1,
    unitType: asset.type,
    unitName: asset.name,
    hullTailNumber: '',
    symbology: '',
    latitude: String(lat),
    longitude: String(lng),
    capabilities: '',
    currentOpPeriod: '',
    nextOpPeriod: '',
    currentOpPeriodAssignment: '',
    nextOpPeriodAssignment: '',
    checkInStatus: '',
    costUnitType: 'per day',
    costPerUnit: 0,
  }
}

export function mergeHubAssetCatalog(
  seedCatalog: HubAssetCatalogRecord[],
  organizationAssets: OrganizationAssetPayload[]
): HubAssetCatalogRecord[] {
  const orgRecords = organizationAssets.map((asset, index) =>
    organizationAssetToCatalogRecord(asset, index)
  )
  const seen = new Set(seedCatalog.map((asset) => asset.assetKey))
  const uniqueOrgRecords = orgRecords.filter((asset) => {
    if (seen.has(asset.assetKey)) return false
    seen.add(asset.assetKey)
    return true
  })
  return [...seedCatalog, ...uniqueOrgRecords]
}

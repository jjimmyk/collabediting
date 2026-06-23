import type { UscgCoastGuardAreaKey } from '@/data/uscg-coast-guard-area-geometries'
import type {
  AssetStatus,
  HubAssetCatalogRecord,
  ResourceCostUnitType,
  ResourceListItemData,
} from '@/features/resources/types'

const ORG_ASSET_ID_BASE = 10_000
const ORG_ASSET_KEY_PREFIX = 'org-'

export type OrganizationAssetExtendedFields = {
  status?: HubAssetCatalogRecord['status']
  teamLead?: string
  eta?: string
  assetStatusUpdatedAt?: string
  currentLocation?: string
  datetimeOrdered?: string
  opcon?: string
  tacon?: string
  pointOfContact?: string
  owningOrganization?: string
  quantity?: number
  unitType?: string
  unitName?: string
  hullTailNumber?: string
  symbology?: string
  latitude?: string
  longitude?: string
  capabilities?: string
  currentOpPeriod?: string
  nextOpPeriod?: string
  currentOpPeriodAssignment?: string
  nextOpPeriodAssignment?: string
  checkInStatus?: string
  costUnitType?: ResourceCostUnitType
  costPerUnit?: number
}

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
  catalogFields: OrganizationAssetExtendedFields
}

export type CreateOrganizationAssetInput = {
  name: string
  type: string
  owner?: string
  assetStatus?: AssetStatus
  location?: string
  notes?: string
  areaKey?: UscgCoastGuardAreaKey
  mapLocation?: [number, number]
} & OrganizationAssetExtendedFields

export type UpdateOrganizationAssetInput = {
  assetKey: string
} & Partial<CreateOrganizationAssetInput>

export function isOrganizationManagedAssetKey(assetKey: string): boolean {
  return assetKey.startsWith(ORG_ASSET_KEY_PREFIX)
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
  return `${ORG_ASSET_KEY_PREFIX}${base}-${suffix}`.slice(0, 80)
}

export function defaultOrganizationAssetExtendedFields(): OrganizationAssetExtendedFields {
  return {
    status: 'Available',
    teamLead: '',
    eta: '',
    currentLocation: '',
    datetimeOrdered: '',
    opcon: '',
    tacon: '',
    pointOfContact: '',
    owningOrganization: '',
    quantity: 1,
    unitType: '',
    unitName: '',
    hullTailNumber: '',
    symbology: '',
    latitude: '',
    longitude: '',
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

export function organizationAssetToCatalogRecord(
  asset: OrganizationAssetPayload,
  index: number
): HubAssetCatalogRecord {
  const areaKey = (asset.areaKey === 'pacific' ? 'pacific' : 'atlantic') as UscgCoastGuardAreaKey
  const assetStatus = (['FMC', 'PMC', 'NMC'].includes(asset.assetStatus)
    ? asset.assetStatus
    : 'FMC') as AssetStatus
  const [lng, lat] = asset.mapLocation
  const extended = { ...defaultOrganizationAssetExtendedFields(), ...asset.catalogFields }
  const latitude = extended.latitude?.trim() || String(lat)
  const longitude = extended.longitude?.trim() || String(lng)

  return {
    assetKey: asset.assetKey,
    id: ORG_ASSET_ID_BASE + index + 1,
    areaKey,
    name: asset.name,
    assetStatus,
    assetStatusUpdatedAt:
      extended.assetStatusUpdatedAt?.trim() ||
      new Date(asset.createdAt).toLocaleString('en-US', {
        timeZone: 'UTC',
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    owner: asset.owner,
    status: extended.status ?? 'Available',
    type: asset.type,
    teamLead: extended.teamLead ?? '',
    eta: extended.eta ?? '',
    location: asset.location,
    notes: asset.notes,
    mapLocation: [lng, lat],
    currentLocation: extended.currentLocation?.trim() || asset.location,
    datetimeOrdered: extended.datetimeOrdered ?? '',
    opcon: extended.opcon ?? '',
    tacon: extended.tacon ?? '',
    pointOfContact: extended.pointOfContact ?? '',
    owningOrganization: extended.owningOrganization ?? '',
    quantity: typeof extended.quantity === 'number' ? extended.quantity : 1,
    unitType: extended.unitType?.trim() || asset.type,
    unitName: extended.unitName?.trim() || asset.name,
    hullTailNumber: extended.hullTailNumber ?? '',
    symbology: extended.symbology ?? '',
    latitude,
    longitude,
    capabilities: extended.capabilities ?? '',
    currentOpPeriod: extended.currentOpPeriod ?? '',
    nextOpPeriod: extended.nextOpPeriod ?? '',
    currentOpPeriodAssignment: extended.currentOpPeriodAssignment ?? '',
    nextOpPeriodAssignment: extended.nextOpPeriodAssignment ?? '',
    checkInStatus: extended.checkInStatus ?? '',
    costUnitType: extended.costUnitType ?? 'per day',
    costPerUnit: typeof extended.costPerUnit === 'number' ? extended.costPerUnit : 0,
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

export function resourceToUpdateOrganizationAssetInput(
  resource: ResourceListItemData
): UpdateOrganizationAssetInput {
  const [lng, lat] = resource.mapLocation
  return {
    assetKey: resource.assetKey,
    name: resource.name,
    type: resource.type,
    owner: resource.owner,
    assetStatus: resource.assetStatus,
    location: resource.location,
    notes: resource.notes,
    areaKey: resource.areaKey,
    mapLocation: [lng, lat],
    status: resource.status,
    teamLead: resource.teamLead,
    eta: resource.eta,
    assetStatusUpdatedAt: resource.assetStatusUpdatedAt,
    currentLocation: resource.currentLocation,
    datetimeOrdered: resource.datetimeOrdered,
    opcon: resource.opcon,
    tacon: resource.tacon,
    pointOfContact: resource.pointOfContact,
    owningOrganization: resource.owningOrganization,
    quantity: resource.quantity,
    unitType: resource.unitType,
    unitName: resource.unitName,
    hullTailNumber: resource.hullTailNumber,
    symbology: resource.symbology,
    latitude: resource.latitude,
    longitude: resource.longitude,
    capabilities: resource.capabilities,
    currentOpPeriod: resource.currentOpPeriod,
    nextOpPeriod: resource.nextOpPeriod,
    currentOpPeriodAssignment: resource.currentOpPeriodAssignment,
    nextOpPeriodAssignment: resource.nextOpPeriodAssignment,
    checkInStatus: resource.checkInStatus,
    costUnitType: resource.costUnitType,
    costPerUnit: resource.costPerUnit,
  }
}

export function createInputToCatalogFields(
  input: CreateOrganizationAssetInput
): OrganizationAssetExtendedFields {
  const defaults = defaultOrganizationAssetExtendedFields()
  return {
    status: input.status ?? defaults.status,
    teamLead: input.teamLead?.trim() ?? defaults.teamLead,
    eta: input.eta?.trim() ?? defaults.eta,
    assetStatusUpdatedAt: input.assetStatusUpdatedAt?.trim(),
    currentLocation: input.currentLocation?.trim() ?? input.location?.trim() ?? defaults.currentLocation,
    datetimeOrdered: input.datetimeOrdered?.trim() ?? defaults.datetimeOrdered,
    opcon: input.opcon?.trim() ?? defaults.opcon,
    tacon: input.tacon?.trim() ?? defaults.tacon,
    pointOfContact: input.pointOfContact?.trim() ?? defaults.pointOfContact,
    owningOrganization: input.owningOrganization?.trim() ?? defaults.owningOrganization,
    quantity: typeof input.quantity === 'number' ? input.quantity : defaults.quantity,
    unitType: input.unitType?.trim() ?? input.type?.trim() ?? defaults.unitType,
    unitName: input.unitName?.trim() ?? input.name?.trim() ?? defaults.unitName,
    hullTailNumber: input.hullTailNumber?.trim() ?? defaults.hullTailNumber,
    symbology: input.symbology?.trim() ?? defaults.symbology,
    latitude: input.latitude?.trim() ?? defaults.latitude,
    longitude: input.longitude?.trim() ?? defaults.longitude,
    capabilities: input.capabilities?.trim() ?? defaults.capabilities,
    currentOpPeriod: input.currentOpPeriod?.trim() ?? defaults.currentOpPeriod,
    nextOpPeriod: input.nextOpPeriod?.trim() ?? defaults.nextOpPeriod,
    currentOpPeriodAssignment:
      input.currentOpPeriodAssignment?.trim() ?? defaults.currentOpPeriodAssignment,
    nextOpPeriodAssignment: input.nextOpPeriodAssignment?.trim() ?? defaults.nextOpPeriodAssignment,
    checkInStatus: input.checkInStatus?.trim() ?? defaults.checkInStatus,
    costUnitType: input.costUnitType ?? defaults.costUnitType,
    costPerUnit: typeof input.costPerUnit === 'number' ? input.costPerUnit : defaults.costPerUnit,
  }
}

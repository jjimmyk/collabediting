import type { SupabaseClient } from '@supabase/supabase-js'

export type DbOrganizationAssetRow = {
  id: string
  organization_id: string
  asset_key: string
  name: string
  type: string
  owner: string | null
  asset_status: string | null
  location: string | null
  notes: string | null
  area_key: string | null
  map_lng: number | null
  map_lat: number | null
  catalog_fields: Record<string, unknown> | null
  created_by: string | null
  created_at: string
}

export type OrganizationAssetCatalogFields = {
  status?: string
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
  costUnitType?: string
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
  catalogFields: OrganizationAssetCatalogFields
}

const ASSET_STATUSES = new Set(['FMC', 'PMC', 'NMC'])
const AREA_KEYS = new Set(['atlantic', 'pacific'])
const DEPLOYMENT_STATUSES = new Set(['Assigned', 'Staged', 'Available'])
const COST_UNIT_TYPES = new Set(['per day', 'per hour', 'to purchase'])

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

export function normalizeAssetStatus(value: string | undefined): string {
  const trimmed = value?.trim().toUpperCase()
  return trimmed && ASSET_STATUSES.has(trimmed) ? trimmed : 'FMC'
}

export function normalizeAreaKey(value: string | undefined): string {
  const trimmed = value?.trim().toLowerCase()
  return trimmed && AREA_KEYS.has(trimmed) ? trimmed : 'atlantic'
}

export function normalizeCatalogFields(raw: unknown): OrganizationAssetCatalogFields {
  if (!raw || typeof raw !== 'object') {
    return {}
  }

  const source = raw as Record<string, unknown>
  const status = typeof source.status === 'string' ? source.status.trim() : undefined
  const costUnitType =
    typeof source.costUnitType === 'string' ? source.costUnitType.trim() : undefined

  return {
    status: status && DEPLOYMENT_STATUSES.has(status) ? status : undefined,
    teamLead: typeof source.teamLead === 'string' ? source.teamLead.trim() : undefined,
    eta: typeof source.eta === 'string' ? source.eta.trim() : undefined,
    assetStatusUpdatedAt:
      typeof source.assetStatusUpdatedAt === 'string'
        ? source.assetStatusUpdatedAt.trim()
        : undefined,
    currentLocation:
      typeof source.currentLocation === 'string' ? source.currentLocation.trim() : undefined,
    datetimeOrdered:
      typeof source.datetimeOrdered === 'string' ? source.datetimeOrdered.trim() : undefined,
    opcon: typeof source.opcon === 'string' ? source.opcon.trim() : undefined,
    tacon: typeof source.tacon === 'string' ? source.tacon.trim() : undefined,
    pointOfContact:
      typeof source.pointOfContact === 'string' ? source.pointOfContact.trim() : undefined,
    owningOrganization:
      typeof source.owningOrganization === 'string' ? source.owningOrganization.trim() : undefined,
    quantity: typeof source.quantity === 'number' ? source.quantity : undefined,
    unitType: typeof source.unitType === 'string' ? source.unitType.trim() : undefined,
    unitName: typeof source.unitName === 'string' ? source.unitName.trim() : undefined,
    hullTailNumber:
      typeof source.hullTailNumber === 'string' ? source.hullTailNumber.trim() : undefined,
    symbology: typeof source.symbology === 'string' ? source.symbology.trim() : undefined,
    latitude: typeof source.latitude === 'string' ? source.latitude.trim() : undefined,
    longitude: typeof source.longitude === 'string' ? source.longitude.trim() : undefined,
    capabilities: typeof source.capabilities === 'string' ? source.capabilities.trim() : undefined,
    currentOpPeriod:
      typeof source.currentOpPeriod === 'string' ? source.currentOpPeriod.trim() : undefined,
    nextOpPeriod: typeof source.nextOpPeriod === 'string' ? source.nextOpPeriod.trim() : undefined,
    currentOpPeriodAssignment:
      typeof source.currentOpPeriodAssignment === 'string'
        ? source.currentOpPeriodAssignment.trim()
        : undefined,
    nextOpPeriodAssignment:
      typeof source.nextOpPeriodAssignment === 'string'
        ? source.nextOpPeriodAssignment.trim()
        : undefined,
    checkInStatus:
      typeof source.checkInStatus === 'string' ? source.checkInStatus.trim() : undefined,
    costUnitType:
      costUnitType && COST_UNIT_TYPES.has(costUnitType) ? costUnitType : undefined,
    costPerUnit: typeof source.costPerUnit === 'number' ? source.costPerUnit : undefined,
  }
}

export function catalogFieldsFromBody(body: Record<string, unknown>): OrganizationAssetCatalogFields {
  return normalizeCatalogFields({
    status: body.status,
    teamLead: body.teamLead,
    eta: body.eta,
    assetStatusUpdatedAt: body.assetStatusUpdatedAt,
    currentLocation: body.currentLocation,
    datetimeOrdered: body.datetimeOrdered,
    opcon: body.opcon,
    tacon: body.tacon,
    pointOfContact: body.pointOfContact,
    owningOrganization: body.owningOrganization,
    quantity: body.quantity,
    unitType: body.unitType,
    unitName: body.unitName,
    hullTailNumber: body.hullTailNumber,
    symbology: body.symbology,
    latitude: body.latitude,
    longitude: body.longitude,
    capabilities: body.capabilities,
    currentOpPeriod: body.currentOpPeriod,
    nextOpPeriod: body.nextOpPeriod,
    currentOpPeriodAssignment: body.currentOpPeriodAssignment,
    nextOpPeriodAssignment: body.nextOpPeriodAssignment,
    checkInStatus: body.checkInStatus,
    costUnitType: body.costUnitType,
    costPerUnit: body.costPerUnit,
  })
}

export function mapOrganizationAssetRow(row: DbOrganizationAssetRow): OrganizationAssetPayload {
  return {
    id: row.id,
    organizationId: row.organization_id,
    assetKey: row.asset_key,
    name: row.name,
    type: row.type,
    owner: row.owner?.trim() ?? '',
    assetStatus: normalizeAssetStatus(row.asset_status ?? undefined),
    location: row.location?.trim() ?? '',
    notes: row.notes?.trim() ?? '',
    areaKey: normalizeAreaKey(row.area_key ?? undefined),
    mapLocation: [row.map_lng ?? 0, row.map_lat ?? 0],
    createdAt: row.created_at,
    catalogFields: normalizeCatalogFields(row.catalog_fields),
  }
}

export const ORGANIZATION_ASSET_SELECT =
  'id, organization_id, asset_key, name, type, owner, asset_status, location, notes, area_key, map_lng, map_lat, catalog_fields, created_by, created_at'

export async function listOrganizationAssets(
  admin: SupabaseClient,
  organizationId: string
): Promise<OrganizationAssetPayload[]> {
  const { data, error } = await admin
    .from('organization_assets')
    .select(ORGANIZATION_ASSET_SELECT)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => mapOrganizationAssetRow(row as DbOrganizationAssetRow))
}

export function parseMapLocation(body: Record<string, unknown>): [number, number] | null {
  const mapLocation = body.mapLocation
  if (!Array.isArray(mapLocation) || mapLocation.length < 2) {
    return null
  }

  const lng = Number(mapLocation[0])
  const lat = Number(mapLocation[1])
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return null
  }

  return [lng, lat]
}

export function buildOrganizationAssetUpdateRow(
  body: Record<string, unknown>,
  existing: DbOrganizationAssetRow
): Record<string, unknown> {
  const update: Record<string, unknown> = {}
  const catalogFields = {
    ...normalizeCatalogFields(existing.catalog_fields),
    ...catalogFieldsFromBody(body),
  }

  if (typeof body.name === 'string' && body.name.trim()) {
    update.name = body.name.trim()
  }
  if (typeof body.type === 'string' && body.type.trim()) {
    update.type = body.type.trim()
  }
  if (typeof body.owner === 'string') {
    update.owner = body.owner.trim()
  }
  if (typeof body.assetStatus === 'string') {
    update.asset_status = normalizeAssetStatus(body.assetStatus)
  }
  if (typeof body.location === 'string') {
    update.location = body.location.trim()
  }
  if (typeof body.notes === 'string') {
    update.notes = body.notes.trim()
  }
  if (typeof body.areaKey === 'string') {
    update.area_key = normalizeAreaKey(body.areaKey)
  }

  const mapLocation = parseMapLocation(body)
  if (mapLocation) {
    update.map_lng = mapLocation[0]
    update.map_lat = mapLocation[1]
  }

  update.catalog_fields = catalogFields
  return update
}

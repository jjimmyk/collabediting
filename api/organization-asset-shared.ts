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
  created_by: string | null
  created_at: string
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
}

const ASSET_STATUSES = new Set(['FMC', 'PMC', 'NMC'])
const AREA_KEYS = new Set(['atlantic', 'pacific'])

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
  }
}

export async function listOrganizationAssets(
  admin: SupabaseClient,
  organizationId: string
): Promise<OrganizationAssetPayload[]> {
  const { data, error } = await admin
    .from('organization_assets')
    .select(
      'id, organization_id, asset_key, name, type, owner, asset_status, location, notes, area_key, map_lng, map_lat, created_by, created_at'
    )
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => mapOrganizationAssetRow(row as DbOrganizationAssetRow))
}

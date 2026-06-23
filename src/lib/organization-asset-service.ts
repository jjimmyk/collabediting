import {
  buildUniqueAssetKey,
  type CreateOrganizationAssetInput,
  type OrganizationAssetPayload,
} from '@/lib/organization-asset-catalog'
import { isSupabaseConfigured } from '@/lib/supabase'

export type { CreateOrganizationAssetInput, OrganizationAssetPayload } from '@/lib/organization-asset-catalog'

function createLocalId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const LOCAL_ORG_ASSETS_PREFIX = 'pratus-organization-assets:'

function readLocalOrganizationAssets(organizationId: string | null): OrganizationAssetPayload[] {
  if (!organizationId || typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(`${LOCAL_ORG_ASSETS_PREFIX}${organizationId}`)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as OrganizationAssetPayload[]) : []
  } catch {
    return []
  }
}

function writeLocalOrganizationAssets(
  organizationId: string | null,
  assets: OrganizationAssetPayload[]
): void {
  if (!organizationId || typeof window === 'undefined') return
  window.localStorage.setItem(`${LOCAL_ORG_ASSETS_PREFIX}${organizationId}`, JSON.stringify(assets))
}

function mapApiAsset(raw: Record<string, unknown>): OrganizationAssetPayload {
  const mapLocation = Array.isArray(raw.mapLocation) ? raw.mapLocation : [0, 0]
  return {
    id: String(raw.id ?? ''),
    organizationId: String(raw.organizationId ?? ''),
    assetKey: String(raw.assetKey ?? ''),
    name: String(raw.name ?? ''),
    type: String(raw.type ?? ''),
    owner: String(raw.owner ?? ''),
    assetStatus: String(raw.assetStatus ?? 'FMC'),
    location: String(raw.location ?? ''),
    notes: String(raw.notes ?? ''),
    areaKey: String(raw.areaKey ?? 'atlantic'),
    mapLocation: [
      typeof mapLocation[0] === 'number' ? mapLocation[0] : 0,
      typeof mapLocation[1] === 'number' ? mapLocation[1] : 0,
    ],
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  }
}

export async function fetchOrganizationAssets(params: {
  accessToken?: string | null
  organizationId: string | null
}): Promise<{ ok: true; assets: OrganizationAssetPayload[] } | { ok: false; message: string }> {
  if (!params.organizationId) {
    return { ok: true, assets: [] }
  }

  if (!isSupabaseConfigured) {
    return { ok: true, assets: readLocalOrganizationAssets(params.organizationId) }
  }

  if (!params.accessToken) {
    return { ok: false, message: 'Sign in again to load organization assets.' }
  }

  const query = new URLSearchParams({ organizationId: params.organizationId })
  const response = await fetch(`/api/list-organization-assets?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
    },
  })

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    assets?: Record<string, unknown>[]
  }

  if (!response.ok) {
    return { ok: false, message: payload.error ?? 'Could not load organization assets.' }
  }

  return {
    ok: true,
    assets: Array.isArray(payload.assets) ? payload.assets.map(mapApiAsset) : [],
  }
}

export async function createOrganizationAsset(params: {
  accessToken?: string | null
  organizationId: string | null
  input: CreateOrganizationAssetInput
}): Promise<
  { ok: true; asset: OrganizationAssetPayload } | { ok: false; message: string }
> {
  const name = params.input.name.trim()
  const type = params.input.type.trim()

  if (!params.organizationId) {
    return { ok: false, message: 'Select an organization before creating assets.' }
  }
  if (!name) {
    return { ok: false, message: 'Asset name is required.' }
  }
  if (!type) {
    return { ok: false, message: 'Asset type is required.' }
  }

  if (!isSupabaseConfigured) {
    const suffix = createLocalId().slice(0, 8)
    const asset: OrganizationAssetPayload = {
      id: createLocalId(),
      organizationId: params.organizationId,
      assetKey: buildUniqueAssetKey(name, suffix),
      name,
      type,
      owner: params.input.owner?.trim() ?? '',
      assetStatus: params.input.assetStatus ?? 'FMC',
      location: params.input.location?.trim() ?? '',
      notes: params.input.notes?.trim() ?? '',
      areaKey: params.input.areaKey ?? 'atlantic',
      mapLocation: [0, 0],
      createdAt: new Date().toISOString(),
    }
    const current = readLocalOrganizationAssets(params.organizationId)
    writeLocalOrganizationAssets(params.organizationId, [...current, asset])
    return { ok: true, asset }
  }

  if (!params.accessToken) {
    return { ok: false, message: 'Sign in again to create assets.' }
  }

  const response = await fetch('/api/create-organization-asset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      organizationId: params.organizationId,
      name,
      type,
      owner: params.input.owner?.trim() ?? '',
      assetStatus: params.input.assetStatus ?? 'FMC',
      location: params.input.location?.trim() ?? '',
      notes: params.input.notes?.trim() ?? '',
      areaKey: params.input.areaKey ?? 'atlantic',
    }),
  })

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    asset?: Record<string, unknown>
  }

  if (!response.ok || !payload.asset) {
    return { ok: false, message: payload.error ?? 'Could not create asset.' }
  }

  return { ok: true, asset: mapApiAsset(payload.asset) }
}

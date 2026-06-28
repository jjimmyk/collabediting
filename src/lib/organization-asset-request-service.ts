import {
  buildResourceRequestFromInput,
  generateResourceRequestNumber,
  nextResourceRequestId,
  normalizeResourceRequestItem,
  type CreateResourceRequestInput,
  type ResourceRequestItem,
  validateCreateResourceRequestInput,
} from '@/lib/ics-213rr-resource-request'
import { isSupabaseConfigured } from '@/lib/supabase'

export type { CreateResourceRequestInput } from '@/lib/ics-213rr-resource-request'

const LOCAL_ORG_ASSET_REQUESTS_PREFIX = 'pratus-organization-asset-requests:'

function readLocalOrganizationAssetRequests(
  organizationId: string | null
): ResourceRequestItem[] {
  if (!organizationId || typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(`${LOCAL_ORG_ASSET_REQUESTS_PREFIX}${organizationId}`)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed)
      ? (parsed as ResourceRequestItem[]).map((item) => normalizeResourceRequestItem(item))
      : []
  } catch {
    return []
  }
}

function writeLocalOrganizationAssetRequests(
  organizationId: string | null,
  requests: ResourceRequestItem[]
): void {
  if (!organizationId || typeof window === 'undefined') return
  window.localStorage.setItem(
    `${LOCAL_ORG_ASSET_REQUESTS_PREFIX}${organizationId}`,
    JSON.stringify(requests)
  )
}

function mapApiRequest(raw: Record<string, unknown>): ResourceRequestItem | null {
  const payload = raw.payload
  if (!payload || typeof payload !== 'object') return null
  const item = payload as ResourceRequestItem
  if (typeof item.id !== 'number' || !Array.isArray(item.mapLocation)) return null
  const recordId = typeof raw.id === 'string' ? raw.id : undefined
  return normalizeResourceRequestItem({
    ...item,
    storageRecordId: recordId,
  })
}

export async function fetchOrganizationAssetRequests(params: {
  accessToken?: string | null
  organizationId: string | null
}): Promise<{ ok: true; requests: ResourceRequestItem[] } | { ok: false; message: string }> {
  if (!params.organizationId) {
    return { ok: true, requests: [] }
  }

  if (!isSupabaseConfigured) {
    return { ok: true, requests: readLocalOrganizationAssetRequests(params.organizationId) }
  }

  if (!params.accessToken) {
    return { ok: false, message: 'Sign in again to load asset requests.' }
  }

  const response = await fetch(
    `/api/list-organization-asset-requests?organizationId=${encodeURIComponent(params.organizationId)}`,
    {
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
      },
    }
  )

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    requests?: Record<string, unknown>[]
  }

  if (!response.ok) {
    return { ok: false, message: payload.error ?? 'Could not load asset requests.' }
  }

  const requests = Array.isArray(payload.requests)
    ? payload.requests
        .map((row) => mapApiRequest(row))
        .filter((item): item is ResourceRequestItem => item !== null)
    : []

  return { ok: true, requests }
}

export async function createOrganizationAssetRequest(params: {
  accessToken?: string | null
  organizationId: string | null
  input: CreateResourceRequestInput
  existingRequests?: ResourceRequestItem[]
}): Promise<
  { ok: true; request: ResourceRequestItem } | { ok: false; message: string }
> {
  const validationError = validateCreateResourceRequestInput(params.input)
  if (validationError) {
    return { ok: false, message: validationError }
  }

  if (!params.organizationId) {
    return { ok: false, message: 'Select an organization before creating asset requests.' }
  }

  const existing = params.existingRequests ?? []
  const requestNumber =
    params.input.requestNumber.trim() || generateResourceRequestNumber(existing)
  const request = buildResourceRequestFromInput(params.input, {
    id: nextResourceRequestId(existing),
    requestNumber,
  })

  if (!isSupabaseConfigured) {
    writeLocalOrganizationAssetRequests(params.organizationId, [...existing, request])
    return { ok: true, request }
  }

  if (!params.accessToken) {
    return { ok: false, message: 'Sign in again to create asset requests.' }
  }

  const response = await fetch('/api/create-organization-asset-request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      organizationId: params.organizationId,
      payload: request,
    }),
  })

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    request?: Record<string, unknown>
  }

  if (!response.ok || !payload.request) {
    return { ok: false, message: payload.error ?? 'Could not create asset request.' }
  }

  const created = mapApiRequest(payload.request)
  if (!created) {
    return { ok: false, message: 'Created asset request returned invalid data.' }
  }

  return { ok: true, request: created }
}

export async function updateOrganizationAssetRequest(params: {
  accessToken?: string | null
  organizationId: string | null
  request: ResourceRequestItem
}): Promise<
  { ok: true; request: ResourceRequestItem } | { ok: false; message: string }
> {
  if (!params.organizationId) {
    return { ok: false, message: 'Select an organization before updating asset requests.' }
  }

  const normalized = normalizeResourceRequestItem(params.request)

  if (!isSupabaseConfigured) {
    const existing = readLocalOrganizationAssetRequests(params.organizationId)
    const next = existing.map((entry) =>
      entry.id === normalized.id ? normalized : entry
    )
    writeLocalOrganizationAssetRequests(params.organizationId, next)
    return { ok: true, request: normalized }
  }

  if (!params.accessToken) {
    return { ok: false, message: 'Sign in again to update asset requests.' }
  }

  if (!normalized.storageRecordId) {
    return { ok: false, message: 'Asset request record id is missing.' }
  }

  const response = await fetch('/api/update-organization-asset-request', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      organizationId: params.organizationId,
      recordId: normalized.storageRecordId,
      payload: normalized,
    }),
  })

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    request?: Record<string, unknown>
  }

  if (!response.ok || !payload.request) {
    return { ok: false, message: payload.error ?? 'Could not update asset request.' }
  }

  const updated = mapApiRequest(payload.request)
  if (!updated) {
    return { ok: false, message: 'Updated asset request returned invalid data.' }
  }

  return { ok: true, request: updated }
}

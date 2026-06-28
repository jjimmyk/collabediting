import type { SupabaseClient } from '@supabase/supabase-js'

export type ResourceRequestPayload = Record<string, unknown> & {
  id: number
  mapLocation: [number, number]
  incidentName: string
  requestNumber: string
  orderKind: string
  orderType: string
  orderDetailedDescription: string
  orderRequestedReportingLocation: string
  requestedByName: string
}

export type DbOrganizationAssetRequestRow = {
  id: string
  organization_id: string
  payload: ResourceRequestPayload
  created_by: string | null
  created_at: string
}

export type OrganizationAssetRequestPayload = {
  id: string
  organizationId: string
  payload: ResourceRequestPayload
  createdAt: string
  createdBy: string | null
}

export const ORGANIZATION_ASSET_REQUEST_SELECT =
  'id, organization_id, payload, created_by, created_at'

export function mapOrganizationAssetRequestRow(
  row: DbOrganizationAssetRequestRow
): OrganizationAssetRequestPayload {
  return {
    id: row.id,
    organizationId: row.organization_id,
    payload: row.payload,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }
}

export function parseResourceRequestPayload(body: Record<string, unknown>): ResourceRequestPayload | null {
  const payload = body.payload
  if (!payload || typeof payload !== 'object') return null

  const item = payload as ResourceRequestPayload
  if (typeof item.id !== 'number') return null
  if (!Array.isArray(item.mapLocation) || item.mapLocation.length < 2) return null
  if (!item.incidentName?.trim()) return null
  if (!item.requestedByName?.trim()) return null

  const items = Array.isArray((item as { items?: unknown }).items)
    ? ((item as { items: unknown[] }).items as Array<Record<string, unknown>>)
    : null

  if (items && items.length > 0) {
    for (const lineItem of items) {
      if (!String(lineItem.kind ?? '').trim()) return null
      if (!String(lineItem.type ?? '').trim()) return null
      if (!String(lineItem.detailedItemDescription ?? '').trim()) return null
      if (!String(lineItem.requestedReportingLocation ?? '').trim()) return null
      const quantity = Number(lineItem.quantity)
      if (!Number.isFinite(quantity) || quantity < 0) return null
    }
    return item
  }

  if (!item.orderKind?.trim()) return null
  if (!item.orderType?.trim()) return null
  if (!item.orderDetailedDescription?.trim()) return null
  if (!item.orderRequestedReportingLocation?.trim()) return null

  return item
}

export async function listOrganizationAssetRequests(
  admin: SupabaseClient,
  organizationId: string
): Promise<OrganizationAssetRequestPayload[]> {
  const { data, error } = await admin
    .from('organization_asset_requests')
    .select(ORGANIZATION_ASSET_REQUEST_SELECT)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) =>
    mapOrganizationAssetRequestRow(row as DbOrganizationAssetRequestRow)
  )
}

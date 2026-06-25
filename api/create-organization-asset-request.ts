import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import {
  ORGANIZATION_ASSET_REQUEST_SELECT,
  mapOrganizationAssetRequestRow,
  parseResourceRequestPayload,
  type DbOrganizationAssetRequestRow,
} from './organization-asset-request-shared.js'
import { userBelongsToOrganization, userIsPlatformOrgAdmin } from './org-shared.js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

type CreateOrganizationAssetRequestBody = Record<string, unknown> & {
  organizationId?: string
  payload?: Record<string, unknown>
}

function parseBody(req: VercelRequest): CreateOrganizationAssetRequestBody {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as CreateOrganizationAssetRequestBody
    } catch {
      return {}
    }
  }
  return (req.body ?? {}) as CreateOrganizationAssetRequestBody
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return res.status(503).json({ error: 'Supabase server environment is not configured.' })
    }

    const authHeader = req.headers.authorization
    const accessToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null

    if (!accessToken) {
      return res.status(401).json({ error: 'Missing authorization token.' })
    }

    const body = parseBody(req)
    const organizationId = body.organizationId?.trim()
    const payload = parseResourceRequestPayload(body)

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required.' })
    }
    if (!payload) {
      return res.status(400).json({ error: 'Valid asset request payload is required.' })
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey)
    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(accessToken)

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session.' })
    }

    const canCreate =
      (await userIsPlatformOrgAdmin(admin, user.id)) ||
      (await userBelongsToOrganization(admin, user.id, organizationId))

    if (!canCreate) {
      return res.status(403).json({ error: 'You do not have permission to create asset requests.' })
    }

    const { data, error } = await admin
      .from('organization_asset_requests')
      .insert({
        organization_id: organizationId,
        payload,
        created_by: user.id,
      })
      .select(ORGANIZATION_ASSET_REQUEST_SELECT)
      .single()

    if (error || !data) {
      return res.status(500).json({ error: error?.message ?? 'Could not create asset request.' })
    }

    return res.status(200).json({
      ok: true,
      request: mapOrganizationAssetRequestRow(data as DbOrganizationAssetRequestRow),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Create organization asset request failed.'
    return res.status(500).json({ error: message })
  }
}

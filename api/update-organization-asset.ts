import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import {
  buildOrganizationAssetUpdateRow,
  mapOrganizationAssetRow,
  ORGANIZATION_ASSET_SELECT,
  type DbOrganizationAssetRow,
} from './organization-asset-shared.js'
import { userBelongsToOrganization, userIsPlatformOrgAdmin } from './org-shared.js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

type UpdateOrganizationAssetBody = Record<string, unknown> & {
  organizationId?: string
  assetKey?: string
}

function parseBody(req: VercelRequest): UpdateOrganizationAssetBody {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as UpdateOrganizationAssetBody
    } catch {
      return {}
    }
  }
  return (req.body ?? {}) as UpdateOrganizationAssetBody
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST' && req.method !== 'PATCH') {
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
    const organizationId = typeof body.organizationId === 'string' ? body.organizationId.trim() : ''
    const assetKey = typeof body.assetKey === 'string' ? body.assetKey.trim() : ''

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required.' })
    }
    if (!assetKey) {
      return res.status(400).json({ error: 'assetKey is required.' })
    }
    if (!assetKey.startsWith('org-')) {
      return res.status(400).json({ error: 'Only organization-managed assets can be updated.' })
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey)
    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(accessToken)

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session.' })
    }

    const canUpdate =
      (await userIsPlatformOrgAdmin(admin, user.id)) ||
      (await userBelongsToOrganization(admin, user.id, organizationId))

    if (!canUpdate) {
      return res.status(403).json({ error: 'You do not have permission to update organization assets.' })
    }

    const { data: existing, error: existingError } = await admin
      .from('organization_assets')
      .select(ORGANIZATION_ASSET_SELECT)
      .eq('organization_id', organizationId)
      .eq('asset_key', assetKey)
      .maybeSingle()

    if (existingError) {
      return res.status(500).json({ error: existingError.message })
    }
    if (!existing) {
      return res.status(404).json({ error: 'Organization asset not found.' })
    }

    const updateRow = buildOrganizationAssetUpdateRow(body, existing as DbOrganizationAssetRow)
    if (Object.keys(updateRow).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' })
    }

    const { data, error } = await admin
      .from('organization_assets')
      .update(updateRow)
      .eq('organization_id', organizationId)
      .eq('asset_key', assetKey)
      .select(ORGANIZATION_ASSET_SELECT)
      .single()

    if (error || !data) {
      return res.status(500).json({ error: error?.message ?? 'Could not update organization asset.' })
    }

    return res.status(200).json({
      ok: true,
      asset: mapOrganizationAssetRow(data as DbOrganizationAssetRow),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update organization asset failed.'
    return res.status(500).json({ error: message })
  }
}

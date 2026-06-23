import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'
import {
  buildUniqueAssetKey,
  catalogFieldsFromBody,
  mapOrganizationAssetRow,
  normalizeAreaKey,
  normalizeAssetStatus,
  ORGANIZATION_ASSET_SELECT,
  parseMapLocation,
  type DbOrganizationAssetRow,
} from './organization-asset-shared.js'
import { userBelongsToOrganization, userIsPlatformOrgAdmin } from './org-shared.js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

type CreateOrganizationAssetBody = Record<string, unknown> & {
  organizationId?: string
  name?: string
  type?: string
  owner?: string
  assetStatus?: string
  location?: string
  notes?: string
  areaKey?: string
}

function parseBody(req: VercelRequest): CreateOrganizationAssetBody {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as CreateOrganizationAssetBody
    } catch {
      return {}
    }
  }
  return (req.body ?? {}) as CreateOrganizationAssetBody
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
    const name = body.name?.trim()
    const type = body.type?.trim()

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required.' })
    }
    if (!name) {
      return res.status(400).json({ error: 'name is required.' })
    }
    if (!type) {
      return res.status(400).json({ error: 'type is required.' })
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
      return res.status(403).json({ error: 'You do not have permission to create organization assets.' })
    }

    const suffix = randomBytes(4).toString('hex')
    let assetKey = buildUniqueAssetKey(name, suffix)
    let attempts = 0

    while (attempts < 5) {
      const { data: existing } = await admin
        .from('organization_assets')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('asset_key', assetKey)
        .maybeSingle()

      if (!existing) break
      assetKey = buildUniqueAssetKey(name, randomBytes(4).toString('hex'))
      attempts += 1
    }

    const mapLocation = parseMapLocation(body) ?? [0, 0]
    const catalogFields = catalogFieldsFromBody(body)

    const { data, error } = await admin
      .from('organization_assets')
      .insert({
        organization_id: organizationId,
        asset_key: assetKey,
        name,
        type,
        owner: typeof body.owner === 'string' ? body.owner.trim() : '',
        asset_status: normalizeAssetStatus(
          typeof body.assetStatus === 'string' ? body.assetStatus : undefined
        ),
        location: typeof body.location === 'string' ? body.location.trim() : '',
        notes: typeof body.notes === 'string' ? body.notes.trim() : '',
        area_key: normalizeAreaKey(typeof body.areaKey === 'string' ? body.areaKey : undefined),
        map_lng: mapLocation[0],
        map_lat: mapLocation[1],
        catalog_fields: catalogFields,
        created_by: user.id,
      })
      .select(ORGANIZATION_ASSET_SELECT)
      .single()

    if (error || !data) {
      return res.status(500).json({ error: error?.message ?? 'Could not create organization asset.' })
    }

    return res.status(200).json({
      ok: true,
      asset: mapOrganizationAssetRow(data as DbOrganizationAssetRow),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Create organization asset failed.'
    return res.status(500).json({ error: message })
  }
}

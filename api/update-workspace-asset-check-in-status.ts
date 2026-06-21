import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

const CHECK_IN_STATUSES = new Set([
  'not_arrived',
  'checked_in',
  'checked_out',
  'demobilizing',
  'demobilized',
])

type UpdateAssetCheckInBody = {
  workspaceId?: string
  assetKey?: string
  checkInStatus?: string
}

function parseBody(req: VercelRequest): UpdateAssetCheckInBody {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as UpdateAssetCheckInBody
    } catch {
      return {}
    }
  }
  return (req.body ?? {}) as UpdateAssetCheckInBody
}

async function userHasActiveWorkspaceMembership(
  admin: SupabaseClient,
  userId: string,
  workspaceId: string,
  isOrgAdmin: boolean
): Promise<boolean> {
  if (isOrgAdmin) {
    return true
  }

  const { data: membership, error: membershipError } = await admin
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  return !membershipError && membership !== null
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
    const workspaceId = body.workspaceId?.trim()
    const assetKey = body.assetKey?.trim()
    const checkInStatus = body.checkInStatus?.trim()

    if (!workspaceId || !assetKey || !checkInStatus) {
      return res.status(400).json({ error: 'workspaceId, assetKey, and checkInStatus are required.' })
    }

    if (!CHECK_IN_STATUSES.has(checkInStatus)) {
      return res.status(400).json({ error: 'Invalid check-in status.' })
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey)
    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(accessToken)

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session.' })
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('is_org_admin')
      .eq('id', user.id)
      .maybeSingle()

    const canEdit = await userHasActiveWorkspaceMembership(
      admin,
      user.id,
      workspaceId,
      profile?.is_org_admin === true
    )

    if (!canEdit) {
      return res.status(403).json({ error: 'You do not have permission to update check-in status.' })
    }

    const { data: assignment, error: assignmentError } = await admin
      .from('workspace_asset_assignments')
      .select('asset_key, workspace_id')
      .eq('asset_key', assetKey)
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (assignmentError || !assignment) {
      return res.status(404).json({ error: 'Asset assignment not found in this workspace.' })
    }

    const { error: updateError } = await admin
      .from('workspace_asset_assignments')
      .update({
        check_in_status: checkInStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('asset_key', assetKey)
      .eq('workspace_id', workspaceId)

    if (updateError) {
      return res.status(500).json({ error: updateError.message })
    }

    return res.status(200).json({ ok: true, checkInStatus })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update asset check-in status failed.'
    return res.status(500).json({ error: message })
  }
}

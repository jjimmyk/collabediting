import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { deletePendingAssetOrgChartAssignment } from './roster-asset-pending-assignments-shared.js'
import { authenticateRosterManager } from './roster-auth-shared.js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

type CancelPendingBody = {
  workspaceId?: string
  assetKey?: string
}

function parseBody(req: VercelRequest): CancelPendingBody {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as CancelPendingBody
    } catch {
      return {}
    }
  }
  return (req.body ?? {}) as CancelPendingBody
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

    if (!workspaceId || !assetKey) {
      return res.status(400).json({ error: 'workspaceId and assetKey are required.' })
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey)
    await authenticateRosterManager(admin, accessToken, workspaceId)
    await deletePendingAssetOrgChartAssignment(admin, workspaceId, assetKey)

    return res.status(200).json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not cancel pending assignment.'
    return res.status(500).json({ error: message })
  }
}

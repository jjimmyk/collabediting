import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import {
  assignAssetToPosition,
  unassignAssetFromPosition,
} from './roster-asset-assignments-shared.js'
import { assertIncidentOrExerciseWorkspace, authenticateRosterManager } from './roster-auth-shared.js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

type Body = {
  workspaceId?: string
  positionName?: string
  assetKey?: string
  action?: 'assign' | 'unassign'
  pointOfContactMemberId?: string | null
}

function formatHandlerError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return 'Update position asset assignment failed.'
}

function parseBody(req: VercelRequest): Body {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as Body
    } catch {
      return {}
    }
  }
  return (req.body ?? {}) as Body
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
    const positionName = body.positionName?.trim()
    const assetKey = body.assetKey?.trim()
    const action = body.action

    if (!workspaceId || !positionName || !assetKey || (action !== 'assign' && action !== 'unassign')) {
      return res.status(400).json({
        error: 'workspaceId, positionName, assetKey, and action (assign|unassign) are required.',
      })
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey)
    await assertIncidentOrExerciseWorkspace(admin, workspaceId)
    const { userId } = await authenticateRosterManager(admin, accessToken, workspaceId)

    if (action === 'assign') {
      await assignAssetToPosition(admin, {
        workspaceId,
        positionName,
        assetKey,
        pointOfContactMemberId: body.pointOfContactMemberId ?? null,
        createdBy: userId,
      })
    } else {
      await unassignAssetFromPosition(admin, {
        workspaceId,
        positionName,
        assetKey,
      })
    }

    return res.status(200).json({ ok: true })
  } catch (error) {
    const message = formatHandlerError(error)
    const status = message.includes('permission') || message.includes('session') ? 403 : 500
    return res.status(status).json({ error: message })
  }
}

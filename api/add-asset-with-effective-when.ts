import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { addAssetWithEffectiveWhen } from './roster-asset-add-shared.js'
import { authenticateRosterManager } from './roster-auth-shared.js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

type AddAssetBody = {
  workspaceId?: string
  assetKey?: string
  assignmentKind?: 'ics_position' | 'single_resource'
  scheduleOnOpAdvance?: boolean
  icsPosition?: string
  orgChartReportsTo?: string
  pointOfContactMemberId?: string | null
}

function parseBody(req: VercelRequest): AddAssetBody {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as AddAssetBody
    } catch {
      return {}
    }
  }
  return (req.body ?? {}) as AddAssetBody
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
    const assignmentKind =
      body.assignmentKind === 'single_resource' ? 'single_resource' : 'ics_position'
    const scheduleOnOpAdvance = body.scheduleOnOpAdvance === true

    if (!workspaceId || !assetKey) {
      return res.status(400).json({ error: 'workspaceId and assetKey are required.' })
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { userId } = await authenticateRosterManager(admin, accessToken, workspaceId)

    const result = await addAssetWithEffectiveWhen(admin, {
      workspaceId,
      assetKey,
      assignmentKind,
      scheduleOnOpAdvance,
      icsPosition: body.icsPosition,
      orgChartReportsTo: body.orgChartReportsTo,
      pointOfContactMemberId: body.pointOfContactMemberId ?? null,
      createdBy: userId,
    })

    return res.status(200).json({
      ok: true,
      scheduleOnOpAdvance: result.scheduleOnOpAdvance,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not add asset.'
    return res.status(500).json({ error: message })
  }
}

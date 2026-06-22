import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import {
  listOrganizationCompetencyFunctions,
  resolveWorkspaceOrganizationId,
} from './roster-competency-shared.js'
import { userBelongsToOrganization, userIsPlatformOrgAdmin } from './org-shared.js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
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

    const workspaceId =
      typeof req.query.workspaceId === 'string' ? req.query.workspaceId.trim() : ''
    const organizationIdQuery =
      typeof req.query.organizationId === 'string' ? req.query.organizationId.trim() : ''

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey)
    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(accessToken)

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session.' })
    }

    const organizationId = organizationIdQuery
      ? organizationIdQuery
      : workspaceId
        ? await resolveWorkspaceOrganizationId(admin, workspaceId)
        : ''

    if (!organizationId) {
      return res.status(400).json({ error: 'workspaceId or organizationId is required.' })
    }

    const canRead =
      (await userIsPlatformOrgAdmin(admin, user.id)) ||
      (await userBelongsToOrganization(admin, user.id, organizationId))

    if (!canRead) {
      return res.status(403).json({ error: 'You do not have permission to read competency options.' })
    }

    const labels = await listOrganizationCompetencyFunctions(admin, organizationId)
    return res.status(200).json({ labels })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'List competency functions failed.'
    return res.status(500).json({ error: message })
  }
}

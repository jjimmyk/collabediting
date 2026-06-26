import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  createWorkspaceResourceCategory,
  deleteWorkspaceResourceCategory,
  updateWorkspaceResourceCategory,
} from './roster-resource-category-shared.js'
import type { ResourceCategoryLifecycle } from '../src/lib/workspace-resource-category-types.js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

const ROSTER_MANAGER_POSITIONS = new Set([
  'Incident Commander',
  'Planning Section Chief',
  'Operations Section Chief',
])

type ManageResourceCategoryBody = {
  action?: 'create' | 'update' | 'delete'
  workspaceId?: string
  categoryId?: string
  positionName?: string
  name?: string
  lifecycle?: ResourceCategoryLifecycle
  filledMemberId?: string | null
  filledAssetKey?: string | null
}

function formatHandlerError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return 'Resource category update failed.'
}

async function userCanManageWorkspaceRoster(
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
    .select('id, workspace_member_positions (ics_position)')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (membershipError || !membership) {
    return false
  }

  const positions = (membership.workspace_member_positions ?? [])
    .map((row) => row.ics_position)
    .filter((position): position is string => typeof position === 'string')

  return positions.some((position) => ROSTER_MANAGER_POSITIONS.has(position))
}

function parseBody(req: VercelRequest): ManageResourceCategoryBody {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as ManageResourceCategoryBody
    } catch {
      return {}
    }
  }
  return (req.body ?? {}) as ManageResourceCategoryBody
}

function isLifecycle(value: unknown): value is ResourceCategoryLifecycle {
  return value === 'active' || value === 'scheduled_assign' || value === 'scheduled_unassign'
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
    const action = body.action
    const workspaceId = body.workspaceId?.trim()

    if (!action || !workspaceId) {
      return res.status(400).json({ error: 'action and workspaceId are required.' })
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

    const canManage = await userCanManageWorkspaceRoster(
      admin,
      user.id,
      workspaceId,
      profile?.is_org_admin === true
    )

    if (!canManage) {
      return res.status(403).json({ error: 'You do not have permission to manage resource categories.' })
    }

    if (action === 'create') {
      const positionName = body.positionName?.trim()
      const name = body.name?.trim()
      const lifecycle = body.lifecycle

      if (!positionName || !name || !isLifecycle(lifecycle)) {
        return res.status(400).json({
          error: 'positionName, name, and lifecycle are required for create.',
        })
      }

      const row = await createWorkspaceResourceCategory(admin, {
        workspaceId,
        positionName,
        name,
        lifecycle,
        createdBy: user.id,
      })

      return res.status(200).json({ ok: true, category: row })
    }

    const categoryId = body.categoryId?.trim()
    if (!categoryId) {
      return res.status(400).json({ error: 'categoryId is required.' })
    }

    if (action === 'delete') {
      await deleteWorkspaceResourceCategory(admin, { workspaceId, categoryId })
      return res.status(200).json({ ok: true })
    }

    if (action === 'update') {
      const row = await updateWorkspaceResourceCategory(admin, {
        workspaceId,
        categoryId,
        name: body.name,
        filledMemberId: body.filledMemberId,
        filledAssetKey: body.filledAssetKey,
      })
      return res.status(200).json({ ok: true, category: row })
    }

    return res.status(400).json({ error: 'Unsupported action.' })
  } catch (error) {
    return res.status(500).json({ error: formatHandlerError(error) })
  }
}

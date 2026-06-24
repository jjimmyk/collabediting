import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { cascadeCustomPositionRename } from './custom-position-update-shared.js'
import { assertIncidentOrExerciseWorkspace, authenticateRosterManager } from './roster-auth-shared.js'
import { fetchWorkspacePositionAllowlist } from './roster-shared.js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

type Body = {
  workspaceId?: string
  positionId?: string
  name?: string
  reportsTo?: string
}

function formatHandlerError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return 'Update custom position failed.'
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

function normalizePositionName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
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
    const positionId = body.positionId?.trim()
    const nextName = typeof body.name === 'string' ? normalizePositionName(body.name) : undefined
    const nextReportsTo =
      typeof body.reportsTo === 'string' ? normalizePositionName(body.reportsTo) : undefined

    if (!workspaceId || !positionId) {
      return res.status(400).json({ error: 'workspaceId and positionId are required.' })
    }

    if (nextName === undefined && nextReportsTo === undefined) {
      return res.status(400).json({ error: 'Provide name and/or reportsTo to update.' })
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey)
    await assertIncidentOrExerciseWorkspace(admin, workspaceId)
    await authenticateRosterManager(admin, accessToken, workspaceId)

    const { data: existing, error: fetchError } = await admin
      .from('workspace_custom_positions')
      .select('id, workspace_id, name, reports_to, sort_order, lifecycle_status, archived_at, activated_at')
      .eq('id', positionId)
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Custom position not found.' })
    }

    const allowed = await fetchWorkspacePositionAllowlist(admin, workspaceId)
    const currentName = existing.name as string
    const resolvedName = nextName ?? currentName
    const resolvedReportsTo = nextReportsTo ?? (existing.reports_to as string)

    if (resolvedName.toLowerCase() === resolvedReportsTo.toLowerCase()) {
      return res.status(400).json({ error: 'A position cannot report to itself.' })
    }

    if (!allowed.has(resolvedReportsTo)) {
      return res.status(400).json({
        error: 'Reports-to position must be an existing position in this workspace.',
      })
    }

    if (resolvedName !== currentName) {
      const duplicate = [...allowed].some(
        (position) => position.toLowerCase() === resolvedName.toLowerCase()
      )
      if (duplicate) {
        return res.status(400).json({
          error: 'A custom position with that name already exists in this workspace.',
        })
      }
    }

    const { data: allCustom, error: allCustomError } = await admin
      .from('workspace_custom_positions')
      .select('id, name, reports_to')
      .eq('workspace_id', workspaceId)
      .neq('lifecycle_status', 'archived')

    if (allCustomError) {
      throw new Error(allCustomError.message)
    }

    const parentByName = new Map<string, string>()
    for (const row of allCustom ?? []) {
      if (row.id === positionId) continue
      parentByName.set(row.name as string, row.reports_to as string)
    }
    parentByName.set(resolvedName, resolvedReportsTo)

    let current: string | undefined = resolvedReportsTo
    const visiting = new Set<string>()
    while (current) {
      if (current.toLowerCase() === resolvedName.toLowerCase()) {
        return res.status(400).json({ error: 'That reports-to choice would create a circular hierarchy.' })
      }
      if (visiting.has(current.toLowerCase())) {
        return res.status(400).json({ error: 'That reports-to choice would create a circular hierarchy.' })
      }
      visiting.add(current.toLowerCase())
      current = parentByName.get(current)
    }

    if (resolvedName !== currentName) {
      await cascadeCustomPositionRename(admin, workspaceId, currentName, resolvedName)
    }

    const { data: updated, error: updateError } = await admin
      .from('workspace_custom_positions')
      .update({
        name: resolvedName,
        reports_to: resolvedReportsTo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', positionId)
      .eq('workspace_id', workspaceId)
      .select('id, workspace_id, name, reports_to, sort_order, lifecycle_status, archived_at, activated_at')
      .single()

    if (updateError || !updated) {
      throw updateError ?? new Error('Could not update custom position.')
    }

    return res.status(200).json({
      ok: true,
      position: {
        id: updated.id,
        name: updated.name,
        reportsTo: updated.reports_to,
        sortOrder: updated.sort_order,
        lifecycleStatus: updated.lifecycle_status,
        archivedAt: updated.archived_at,
        activatedAt: updated.activated_at,
      },
      renamedFrom: resolvedName !== currentName ? currentName : null,
    })
  } catch (error) {
    return res.status(500).json({ error: formatHandlerError(error) })
  }
}

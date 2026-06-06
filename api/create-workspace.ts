import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

type CreateWorkspaceBody = {
  kind?: 'incident' | 'exercise'
  name?: string
  region?: string
  summary?: string
}

function parseBody(req: VercelRequest): CreateWorkspaceBody {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as CreateWorkspaceBody
    } catch {
      return {}
    }
  }
  return (req.body ?? {}) as CreateWorkspaceBody
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
    const kind = body.kind
    const name = body.name?.trim()
    const region = body.region?.trim() || null
    const summary = body.summary?.trim() || null

    if (kind !== 'incident' && kind !== 'exercise') {
      return res.status(400).json({ error: 'kind must be incident or exercise.' })
    }

    if (!name) {
      return res.status(400).json({ error: 'name is required.' })
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey)

    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(accessToken)

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session.' })
    }

    const creatorEmail = user.email?.trim().toLowerCase()
    if (!creatorEmail) {
      return res.status(400).json({ error: 'Signed-in user must have an email address.' })
    }

    const { data: maxLegacyRow, error: maxLegacyError } = await admin
      .from('workspaces')
      .select('legacy_id')
      .eq('kind', kind)
      .order('legacy_id', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (maxLegacyError) {
      return res.status(500).json({ error: maxLegacyError.message })
    }

    const legacyId = (maxLegacyRow?.legacy_id ?? 0) + 1

    const { data: workspace, error: workspaceError } = await admin
      .from('workspaces')
      .insert({
        kind,
        legacy_id: legacyId,
        name,
        region,
        summary,
      })
      .select('id, kind, legacy_id, name, region, summary')
      .single()

    if (workspaceError || !workspace) {
      return res.status(500).json({ error: workspaceError?.message ?? 'Could not create workspace.' })
    }

    const { error: memberError } = await admin.from('workspace_members').upsert(
      {
        workspace_id: workspace.id,
        user_id: user.id,
        email: creatorEmail,
        ics_position: 'Incident Commander',
        status: 'active',
        invited_by: user.id,
        joined_at: new Date().toISOString(),
      },
      { onConflict: 'workspace_id,email' }
    )

    if (memberError) {
      return res.status(500).json({ error: memberError.message })
    }

    return res.status(200).json({
      ok: true,
      workspace: {
        workspaceId: workspace.id,
        kind: workspace.kind,
        legacyId: workspace.legacy_id,
        name: workspace.name,
        region: workspace.region,
        summary: workspace.summary,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Create workspace failed.'
    return res.status(500).json({ error: message })
  }
}

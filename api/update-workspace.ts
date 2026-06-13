import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

type UpdateWorkspaceBody = {
  workspaceId?: string
  name?: string
  region?: string | null
  summary?: string | null
  workspaceFormat?: string | null
  incidentComplexity?: string | null
  metadata?: Record<string, unknown> | null
}

function deriveSequentialWorkflow(
  kind: 'incident' | 'exercise',
  workspaceFormat: string | null,
  incidentComplexity: string | null
) {
  if (
    kind === 'incident' &&
    workspaceFormat === 'uscg-ics' &&
    incidentComplexity === 'planning-p'
  ) {
    return {
      has_sequential_workflow: true,
      sequential_workflow_type: 'planning-p',
    }
  }

  return {
    has_sequential_workflow: false,
    sequential_workflow_type: null,
  }
}

function parseBody(req: VercelRequest): UpdateWorkspaceBody {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as UpdateWorkspaceBody
    } catch {
      return {}
    }
  }
  return (req.body ?? {}) as UpdateWorkspaceBody
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'PATCH' && req.method !== 'POST') {
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
    const name = body.name?.trim()

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required.' })
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

    const { data: profile } = await admin
      .from('profiles')
      .select('is_org_admin')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.is_org_admin) {
      const { data: permissionsPayload, error: permissionsError } = await admin.rpc(
        'get_my_workspace_permissions',
        { p_workspace_id: workspaceId }
      )

      if (permissionsError) {
        return res.status(403).json({ error: 'You do not have permission to update this workspace.' })
      }

      const canEdit =
        permissionsPayload &&
        typeof permissionsPayload === 'object' &&
        (permissionsPayload as { can_edit_ics201_form?: boolean }).can_edit_ics201_form === true

      if (!canEdit) {
        return res.status(403).json({ error: 'You do not have permission to update workspace settings.' })
      }
    }

    const { data: existing, error: existingError } = await admin
      .from('workspaces')
      .select('kind')
      .eq('id', workspaceId)
      .maybeSingle()

    if (existingError || !existing) {
      return res.status(404).json({ error: 'Workspace not found.' })
    }

    const region = body.region?.trim() || null
    const summary = body.summary?.trim() || null
    const workspaceFormat = body.workspaceFormat?.trim() || null
    const incidentComplexity = body.incidentComplexity?.trim() || null
    const sequentialWorkflow = deriveSequentialWorkflow(
      existing.kind as 'incident' | 'exercise',
      workspaceFormat,
      incidentComplexity
    )

    const updatePayload: Record<string, unknown> = {
      name,
      region,
      summary,
      workspace_format: workspaceFormat,
      incident_complexity: incidentComplexity,
      has_sequential_workflow: sequentialWorkflow.has_sequential_workflow,
      sequential_workflow_type: sequentialWorkflow.sequential_workflow_type,
    }

    if (body.metadata !== undefined) {
      updatePayload.metadata = body.metadata ?? {}
    }

    const { data: workspace, error: updateError } = await admin
      .from('workspaces')
      .update(updatePayload)
      .eq('id', workspaceId)
      .select(
        'id, kind, legacy_id, name, region, summary, metadata, workspace_format, incident_complexity, has_sequential_workflow, sequential_workflow_type'
      )
      .single()

    if (updateError || !workspace) {
      return res.status(500).json({ error: updateError?.message ?? 'Could not update workspace.' })
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
        metadata: workspace.metadata ?? {},
        workspaceFormat: workspace.workspace_format,
        incidentComplexity: workspace.incident_complexity,
        hasSequentialWorkflow: workspace.has_sequential_workflow,
        sequentialWorkflowType: workspace.sequential_workflow_type,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update workspace failed.'
    return res.status(500).json({ error: message })
  }
}

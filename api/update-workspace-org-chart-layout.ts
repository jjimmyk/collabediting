import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import {
  assertIncidentOrExerciseWorkspace,
  authenticateRosterManager,
} from './roster-auth-shared.js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

type OrgChartNodePosition = { x: number; y: number }
type OrgChartViewport = { x: number; y: number; zoom: number }
type OrgChartPersistedLayout = {
  version: 1
  nodes: Record<string, OrgChartNodePosition>
  viewport?: OrgChartViewport
}

type UpdateOrgChartLayoutBody = {
  workspaceId?: string
  layout?: OrgChartPersistedLayout
  viewport?: OrgChartViewport
}

function parseBody(req: VercelRequest): UpdateOrgChartLayoutBody {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as UpdateOrgChartLayoutBody
    } catch {
      return {}
    }
  }
  return (req.body ?? {}) as UpdateOrgChartLayoutBody
}

function sanitizeLayout(raw: unknown): OrgChartPersistedLayout | null {
  if (!raw || typeof raw !== 'object') return null
  const layout = raw as OrgChartPersistedLayout
  if (layout.version !== 1) return null
  if (!layout.nodes || typeof layout.nodes !== 'object') return null

  const nodes: Record<string, OrgChartNodePosition> = {}
  for (const [id, position] of Object.entries(layout.nodes)) {
    if (typeof id !== 'string' || !id.trim()) continue
    if (
      !position ||
      typeof position.x !== 'number' ||
      !Number.isFinite(position.x) ||
      typeof position.y !== 'number' ||
      !Number.isFinite(position.y)
    ) {
      continue
    }
    nodes[id] = { x: position.x, y: position.y }
  }

  let viewport: OrgChartViewport | undefined
  if (layout.viewport) {
    const { x, y, zoom } = layout.viewport
    if (
      typeof x === 'number' &&
      Number.isFinite(x) &&
      typeof y === 'number' &&
      Number.isFinite(y) &&
      typeof zoom === 'number' &&
      Number.isFinite(zoom) &&
      zoom > 0
    ) {
      viewport = { x, y, zoom }
    }
  }

  return { version: 1, nodes, viewport }
}

function sanitizeViewport(raw: unknown): OrgChartViewport | null {
  if (!raw || typeof raw !== 'object') return null
  const viewport = raw as OrgChartViewport
  if (
    typeof viewport.x !== 'number' ||
    !Number.isFinite(viewport.x) ||
    typeof viewport.y !== 'number' ||
    !Number.isFinite(viewport.y) ||
    typeof viewport.zoom !== 'number' ||
    !Number.isFinite(viewport.zoom) ||
    viewport.zoom <= 0
  ) {
    return null
  }
  return { x: viewport.x, y: viewport.y, zoom: viewport.zoom }
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
    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required.' })
    }

    const layout = sanitizeLayout(body.layout)
    if (!layout) {
      return res.status(400).json({ error: 'Invalid org chart layout payload.' })
    }

    const viewport = sanitizeViewport(body.viewport) ?? layout.viewport ?? { x: 0, y: 0, zoom: 1 }
    layout.viewport = viewport

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { userId } = await authenticateRosterManager(admin, accessToken, workspaceId)
    await assertIncidentOrExerciseWorkspace(admin, workspaceId)

    const { error } = await admin.from('workspace_org_chart_layouts').upsert(
      {
        workspace_id: workspaceId,
        layout,
        viewport,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      },
      { onConflict: 'workspace_id' }
    )

    if (error) {
      throw new Error(error.message)
    }

    return res.status(200).json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update org chart layout.'
    return res.status(500).json({ error: message })
  }
}

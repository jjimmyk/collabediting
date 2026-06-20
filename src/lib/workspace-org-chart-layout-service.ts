import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type {
  OrgChartPersistedLayout,
  OrgChartViewport,
} from '@/features/roster/org-chart-layout/types'
import {
  DEFAULT_ORG_CHART_VIEWPORT,
  EMPTY_ORG_CHART_PERSISTED_LAYOUT,
} from '@/features/roster/org-chart-layout/types'

const LOCAL_ORG_CHART_LAYOUT_STORAGE_KEY = 'pratus-workspace-org-chart-layout-v1'

type DbOrgChartLayoutRow = {
  workspace_id: string
  layout: OrgChartPersistedLayout | null
  viewport: OrgChartViewport | null
}

function readLocalOrgChartLayouts(): Record<string, OrgChartPersistedLayout> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(LOCAL_ORG_CHART_LAYOUT_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, OrgChartPersistedLayout>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeLocalOrgChartLayouts(rows: Record<string, OrgChartPersistedLayout>): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LOCAL_ORG_CHART_LAYOUT_STORAGE_KEY, JSON.stringify(rows))
}

function normalizePersistedLayout(
  layout: OrgChartPersistedLayout | null | undefined,
  viewport: OrgChartViewport | null | undefined
): OrgChartPersistedLayout {
  const nodes =
    layout?.version === 1 && layout.nodes && typeof layout.nodes === 'object'
      ? layout.nodes
      : {}

  const resolvedViewport =
    viewport &&
    typeof viewport.x === 'number' &&
    typeof viewport.y === 'number' &&
    typeof viewport.zoom === 'number'
      ? viewport
      : layout?.viewport ?? DEFAULT_ORG_CHART_VIEWPORT

  return {
    version: 1,
    nodes,
    viewport: resolvedViewport,
  }
}

export async function fetchWorkspaceOrgChartLayout(
  workspaceId: string
): Promise<OrgChartPersistedLayout> {
  if (!isSupabaseConfigured) {
    return readLocalOrgChartLayouts()[workspaceId] ?? EMPTY_ORG_CHART_PERSISTED_LAYOUT
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return readLocalOrgChartLayouts()[workspaceId] ?? EMPTY_ORG_CHART_PERSISTED_LAYOUT
  }

  const { data, error } = await supabase
    .from('workspace_org_chart_layouts')
    .select('workspace_id, layout, viewport')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return EMPTY_ORG_CHART_PERSISTED_LAYOUT
  }

  const row = data as DbOrgChartLayoutRow
  return normalizePersistedLayout(row.layout, row.viewport)
}

export async function saveWorkspaceOrgChartLayout(params: {
  accessToken: string
  workspaceId: string
  layout: OrgChartPersistedLayout
}): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isSupabaseConfigured) {
    const all = readLocalOrgChartLayouts()
    all[params.workspaceId] = params.layout
    writeLocalOrgChartLayouts(all)
    return { ok: true }
  }

  const response = await fetch('/api/update-workspace-org-chart-layout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      workspaceId: params.workspaceId,
      layout: params.layout,
      viewport: params.layout.viewport ?? DEFAULT_ORG_CHART_VIEWPORT,
    }),
  })

  const payload = (await response.json().catch(() => ({}))) as { error?: string }

  if (!response.ok) {
    return { ok: false, message: payload.error ?? 'Could not save org chart layout.' }
  }

  return { ok: true }
}

export async function clearWorkspaceOrgChartLayout(params: {
  accessToken: string
  workspaceId: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  return saveWorkspaceOrgChartLayout({
    accessToken: params.accessToken,
    workspaceId: params.workspaceId,
    layout: EMPTY_ORG_CHART_PERSISTED_LAYOUT,
  })
}

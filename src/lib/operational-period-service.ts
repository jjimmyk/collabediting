import type { OperationalPeriodFormKey } from '@/lib/operational-period-form-registry'
import type {
  OperationalPeriodFormSnapshot,
  OperationalPeriodSnapshotBundle,
  StartOperationalPeriodResult,
  WorkspaceOperationalPeriod,
} from '@/lib/operational-period-types'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'

type DbOperationalPeriodRow = {
  id: string
  workspace_id: string
  period_number: number
  started_at: string
  started_by: string | null
}

type DbProfileRow = {
  id: string
  email: string
  full_name: string | null
}

function mapOperationalPeriod(
  row: DbOperationalPeriodRow,
  starter?: DbProfileRow | null
): WorkspaceOperationalPeriod {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    periodNumber: row.period_number,
    startedAt: row.started_at,
    startedBy: row.started_by,
    startedByEmail: starter?.email ?? null,
    startedByName: starter?.full_name ?? null,
  }
}

type DbSnapshotRow = {
  id: string
  operational_period_id: string
  form_key: string
  document_id: string | null
  snapshot: unknown
  source_version_id: string | null
  created_at: string
}

function mapSnapshot(row: DbSnapshotRow): OperationalPeriodFormSnapshot {
  return {
    id: row.id,
    operationalPeriodId: row.operational_period_id,
    formKey: row.form_key as OperationalPeriodFormKey,
    documentId: row.document_id,
    snapshot: row.snapshot,
    sourceVersionId: row.source_version_id,
    createdAt: row.created_at,
  }
}

export async function fetchWorkspaceOperationalPeriods(
  workspaceId: string
): Promise<WorkspaceOperationalPeriod[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('workspace_operational_periods')
    .select('id, workspace_id, period_number, started_at, started_by')
    .eq('workspace_id', workspaceId)
    .order('period_number', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  const rows = (data ?? []) as DbOperationalPeriodRow[]
  const starterIds = [
    ...new Set(rows.map((row) => row.started_by).filter((id): id is string => !!id)),
  ]

  let startersById = new Map<string, DbProfileRow>()
  if (starterIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', starterIds)

    if (profilesError) {
      throw new Error(profilesError.message)
    }

    startersById = new Map(
      ((profiles ?? []) as DbProfileRow[]).map((profile) => [profile.id, profile])
    )
  }

  return rows.map((row) =>
    mapOperationalPeriod(row, row.started_by ? startersById.get(row.started_by) : null)
  )
}

export async function fetchOperationalPeriodSnapshots(
  operationalPeriodId: string
): Promise<OperationalPeriodFormSnapshot[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('workspace_operational_period_form_snapshots')
    .select(
      'id, operational_period_id, form_key, document_id, snapshot, source_version_id, created_at'
    )
    .eq('operational_period_id', operationalPeriodId)
    .order('form_key', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as DbSnapshotRow[]).map(mapSnapshot)
}

export function bundleOperationalPeriodSnapshots(
  periodNumber: number,
  snapshots: OperationalPeriodFormSnapshot[]
): OperationalPeriodSnapshotBundle {
  const byFormKey: OperationalPeriodSnapshotBundle['byFormKey'] = {}

  for (const snapshot of snapshots) {
    if (snapshot.formKey === 'ics204') {
      const existing = byFormKey.ics204
      if (existing?.kind === 'multiple') {
        if (snapshot.documentId) {
          existing.items.push({
            documentId: snapshot.documentId,
            snapshot: snapshot.snapshot,
          })
        }
      } else {
        byFormKey.ics204 = {
          kind: 'multiple',
          items: snapshot.documentId
            ? [{ documentId: snapshot.documentId, snapshot: snapshot.snapshot }]
            : [],
        }
      }
      continue
    }

    byFormKey[snapshot.formKey] = {
      kind: 'single',
      snapshot: snapshot.snapshot,
      documentId: snapshot.documentId,
    }
  }

  return { periodNumber, byFormKey }
}

export async function fetchOperationalPeriodSnapshotBundle(
  workspaceId: string,
  periodNumber: number
): Promise<OperationalPeriodSnapshotBundle | null> {
  const periods = await fetchWorkspaceOperationalPeriods(workspaceId)
  const period = periods.find((entry) => entry.periodNumber === periodNumber)
  if (!period) return null

  const snapshots = await fetchOperationalPeriodSnapshots(period.id)
  return bundleOperationalPeriodSnapshots(periodNumber, snapshots)
}

export async function startOperationalPeriod(params: {
  accessToken: string
  workspaceId: string
}): Promise<
  { ok: true; result: StartOperationalPeriodResult } | { ok: false; message: string }
> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const response = await fetch('/api/start-operational-period', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({ workspaceId: params.workspaceId }),
  })

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    periodNumber?: number
    startedOperationalPeriodCount?: number
    workingOperationalPeriodNumber?: number
    startedAt?: string
  }

  if (!response.ok) {
    return {
      ok: false,
      message: payload.error ?? `Could not start operational period (HTTP ${response.status}).`,
    }
  }

  if (
    payload.periodNumber === undefined ||
    payload.startedOperationalPeriodCount === undefined ||
    payload.workingOperationalPeriodNumber === undefined ||
    !payload.startedAt
  ) {
    return {
      ok: false,
      message: payload.error ?? 'Could not start operational period.',
    }
  }

  return {
    ok: true,
    result: {
      periodNumber: payload.periodNumber,
      startedOperationalPeriodCount: payload.startedOperationalPeriodCount,
      workingOperationalPeriodNumber: payload.workingOperationalPeriodNumber,
      startedAt: payload.startedAt,
    },
  }
}

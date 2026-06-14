import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type OperationalPeriodFormKey =
  | 'ics201'
  | 'iap'
  | 'ics202'
  | 'ics203'
  | 'ics234'
  | 'ics215'
  | 'ics215a'
  | 'ics205'
  | 'ics205a'
  | 'ics206'
  | 'ics204'
  | 'ics233'
  | 'ics208'
  | 'ics208hm'
  | 'ics209'

type OperationalPeriodFormRegistryEntry = {
  key: OperationalPeriodFormKey
  documentsTable: string
  versionsTable?: string
  multipleDocuments: boolean
  rowsBased?: boolean
}

const OPERATIONAL_PERIOD_FORM_REGISTRY: OperationalPeriodFormRegistryEntry[] = [
  {
    key: 'ics201',
    documentsTable: 'ics201_documents',
    versionsTable: 'ics201_versions',
    multipleDocuments: false,
  },
  {
    key: 'iap',
    documentsTable: 'iap_documents',
    versionsTable: 'iap_versions',
    multipleDocuments: false,
  },
  {
    key: 'ics202',
    documentsTable: 'ics202_documents',
    versionsTable: 'ics202_versions',
    multipleDocuments: false,
  },
  {
    key: 'ics203',
    documentsTable: 'ics203_documents',
    versionsTable: 'ics203_versions',
    multipleDocuments: false,
  },
  {
    key: 'ics234',
    documentsTable: 'ics234_documents',
    versionsTable: 'ics234_versions',
    multipleDocuments: false,
  },
  {
    key: 'ics215',
    documentsTable: 'ics215_documents',
    versionsTable: 'ics215_versions',
    multipleDocuments: false,
  },
  {
    key: 'ics215a',
    documentsTable: 'ics215a_documents',
    versionsTable: 'ics215a_versions',
    multipleDocuments: false,
  },
  {
    key: 'ics205',
    documentsTable: 'ics205_documents',
    versionsTable: 'ics205_versions',
    multipleDocuments: false,
  },
  {
    key: 'ics205a',
    documentsTable: 'ics205a_documents',
    versionsTable: 'ics205a_versions',
    multipleDocuments: false,
  },
  {
    key: 'ics206',
    documentsTable: 'ics206_documents',
    versionsTable: 'ics206_versions',
    multipleDocuments: false,
  },
  {
    key: 'ics204',
    documentsTable: 'ics204_documents',
    versionsTable: 'ics204_versions',
    multipleDocuments: true,
  },
  {
    key: 'ics233',
    documentsTable: 'ics233_documents',
    multipleDocuments: false,
    rowsBased: true,
  },
  {
    key: 'ics208',
    documentsTable: 'ics208_documents',
    versionsTable: 'ics208_versions',
    multipleDocuments: false,
  },
  {
    key: 'ics208hm',
    documentsTable: 'ics208hm_documents',
    versionsTable: 'ics208hm_versions',
    multipleDocuments: false,
  },
  {
    key: 'ics209',
    documentsTable: 'ics209_documents',
    versionsTable: 'ics209_versions',
    multipleDocuments: false,
  },
]

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

type StartOperationalPeriodBody = {
  workspaceId?: string
}

type StandardDocumentRow = {
  id: string
  form_data: unknown
  latest_version_id: string | null
  structure_mode?: string | null
}

type RowsDocumentRow = {
  id: string
  rows_data: unknown
}

const DEFAULT_OPERATIONAL_PERIOD_DURATION_MS = 12 * 60 * 60 * 1000

type OperationalPeriodWindow = {
  from: Date
  to: Date
}

function computeOperationalPeriodWindows(startedAt: Date): {
  frozen: OperationalPeriodWindow
  working: OperationalPeriodWindow
} {
  const frozenFrom = startedAt
  const frozenTo = new Date(startedAt.getTime() + DEFAULT_OPERATIONAL_PERIOD_DURATION_MS)
  const workingFrom = frozenTo
  const workingTo = new Date(startedAt.getTime() + DEFAULT_OPERATIONAL_PERIOD_DURATION_MS * 2)

  return {
    frozen: { from: frozenFrom, to: frozenTo },
    working: { from: workingFrom, to: workingTo },
  }
}

function formatOperationalPeriodDatetimeLocal(value: Date): string {
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`
}

function formatOperationalPeriodDate(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function formatOperationalPeriodTime(value: Date): string {
  return value.toTimeString().slice(0, 5)
}

function applyOperationalPeriodTimestampsToSnapshot(
  snapshot: unknown,
  formKey: OperationalPeriodFormKey,
  window: OperationalPeriodWindow
): unknown {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return snapshot
  }

  const data = JSON.parse(JSON.stringify(snapshot)) as Record<string, unknown>

  switch (formKey) {
    case 'ics201':
      data.operationalPeriodStart = formatOperationalPeriodDatetimeLocal(window.from)
      data.operationalPeriodEnd = formatOperationalPeriodDatetimeLocal(window.to)
      break
    case 'iap':
    case 'ics202':
    case 'ics203':
    case 'ics234':
      data.operationalPeriodFrom = formatOperationalPeriodDatetimeLocal(window.from)
      data.operationalPeriodTo = formatOperationalPeriodDatetimeLocal(window.to)
      break
    case 'ics215':
    case 'ics215a':
    case 'ics205':
    case 'ics205a':
    case 'ics206':
    case 'ics208':
    case 'ics208hm':
    case 'ics209':
      data.operationalPeriodDateFrom = formatOperationalPeriodDate(window.from)
      data.operationalPeriodDateTo = formatOperationalPeriodDate(window.to)
      data.operationalPeriodTimeFrom = formatOperationalPeriodTime(window.from)
      data.operationalPeriodTimeTo = formatOperationalPeriodTime(window.to)
      break
    default:
      break
  }

  return data
}

function parseBody(req: VercelRequest): StartOperationalPeriodBody {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as StartOperationalPeriodBody
    } catch {
      return {}
    }
  }
  return (req.body ?? {}) as StartOperationalPeriodBody
}

type LiveVersionRow = {
  id: string
  created_at: string
  author_id: string | null
  author_name: string
  author_color: string
  snapshot: unknown
  signatures: unknown
  section_id: string | null
}

async function fetchDocumentVersionBundle(
  admin: SupabaseClient,
  entry: OperationalPeriodFormRegistryEntry,
  document: StandardDocumentRow
): Promise<{
  versionSnapshots: LiveVersionRow[]
  latestSnapshot: unknown
  sourceVersionId: string | null
}> {
  if (!entry.versionsTable) {
    return {
      versionSnapshots: [],
      latestSnapshot: document.form_data,
      sourceVersionId: null,
    }
  }

  const { data: versions, error } = await admin
    .from(entry.versionsTable)
    .select(
      'id, created_at, author_id, author_name, author_color, snapshot, signatures, section_id'
    )
    .eq('document_id', document.id)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  const versionSnapshots = (versions ?? []) as LiveVersionRow[]

  if (versionSnapshots.length > 0) {
    const latestById = document.latest_version_id
      ? versionSnapshots.find((row) => row.id === document.latest_version_id)
      : null
    const latest = latestById ?? versionSnapshots[versionSnapshots.length - 1]
    return {
      versionSnapshots,
      latestSnapshot: latest.snapshot,
      sourceVersionId: latest.id,
    }
  }

  return {
    versionSnapshots: [],
    latestSnapshot: document.form_data,
    sourceVersionId: null,
  }
}

async function cloneSnapshotToDocument(
  admin: SupabaseClient,
  entry: OperationalPeriodFormRegistryEntry,
  document: StandardDocumentRow,
  snapshot: unknown,
  userId: string,
  authorName: string
): Promise<void> {
  if (!entry.versionsTable) {
    throw new Error(`Form ${entry.key} does not support versioned clone.`)
  }

  const clonedSnapshot = JSON.parse(JSON.stringify(snapshot))
  const authorColor = '#64748b'

  const { data: versionRow, error: versionError } = await admin
    .from(entry.versionsTable)
    .insert({
      document_id: document.id,
      author_id: userId,
      author_name: authorName,
      author_color: authorColor,
      snapshot: clonedSnapshot,
      signatures: [],
      section_id: null,
    })
    .select('id')
    .single()

  if (versionError || !versionRow) {
    throw new Error(versionError?.message ?? `Could not clone ${entry.key} into working forms.`)
  }

  const updatePayload: Record<string, unknown> = {
    form_data: clonedSnapshot,
    latest_version_id: versionRow.id,
    updated_at: new Date().toISOString(),
    updated_by: userId,
  }

  const { error: documentError } = await admin
    .from(entry.documentsTable)
    .update(updatePayload)
    .eq('id', document.id)

  if (documentError) {
    throw new Error(documentError.message)
  }
}

async function cloneRowsToDocument(
  admin: SupabaseClient,
  entry: OperationalPeriodFormRegistryEntry,
  document: RowsDocumentRow,
  rows: unknown,
  userId: string
): Promise<void> {
  const { error: documentError } = await admin
    .from(entry.documentsTable)
    .update({
      rows_data: JSON.parse(JSON.stringify(rows)),
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq('id', document.id)

  if (documentError) {
    throw new Error(documentError.message)
  }
}

async function fetchWorkspaceDocuments(
  admin: SupabaseClient,
  entry: OperationalPeriodFormRegistryEntry,
  workspaceId: string
) {
  if (entry.rowsBased) {
    return admin
      .from(entry.documentsTable)
      .select('id, rows_data')
      .eq('workspace_id', workspaceId)
  }

  const selectColumns =
    entry.key === 'ics201'
      ? 'id, form_data, latest_version_id, structure_mode'
      : 'id, form_data, latest_version_id'

  const baseQuery = admin
    .from(entry.documentsTable)
    .select(selectColumns)
    .eq('workspace_id', workspaceId)

  if (entry.key === 'ics201') {
    return baseQuery.order('updated_at', { ascending: true })
  }

  if (entry.multipleDocuments) {
    return baseQuery.order('created_at', { ascending: true })
  }

  return baseQuery
}

async function snapshotAndCloneFormEntry(
  admin: SupabaseClient,
  workspaceId: string,
  operationalPeriodId: string,
  entry: OperationalPeriodFormRegistryEntry,
  userId: string,
  authorName: string,
  periodWindows: { frozen: OperationalPeriodWindow; working: OperationalPeriodWindow }
): Promise<void> {
  const { data: documents, error: documentsError } = await fetchWorkspaceDocuments(
    admin,
    entry,
    workspaceId
  )

  if (documentsError) {
    throw new Error(documentsError.message)
  }

  const rows = (documents ?? []) as Array<StandardDocumentRow | RowsDocumentRow>
  if (rows.length === 0) {
    return
  }

  for (const document of rows) {
    if (entry.rowsBased) {
      const rowsDocument = document as RowsDocumentRow
      const snapshot = rowsDocument.rows_data ?? []

      const { error: snapshotError } = await admin
        .from('workspace_operational_period_form_snapshots')
        .insert({
          operational_period_id: operationalPeriodId,
          form_key: entry.key,
          document_id: rowsDocument.id,
          snapshot,
          source_version_id: null,
          version_snapshots: [],
        })

      if (snapshotError) {
        throw new Error(snapshotError.message)
      }

      await cloneRowsToDocument(admin, entry, rowsDocument, snapshot, userId)
      continue
    }

    const standardDocument = document as StandardDocumentRow
    const { versionSnapshots, latestSnapshot, sourceVersionId } =
      await fetchDocumentVersionBundle(admin, entry, standardDocument)

    const frozenSnapshot = applyOperationalPeriodTimestampsToSnapshot(
      latestSnapshot,
      entry.key,
      periodWindows.frozen
    )
    const workingSnapshot = applyOperationalPeriodTimestampsToSnapshot(
      latestSnapshot,
      entry.key,
      periodWindows.working
    )

    const { error: snapshotError } = await admin
      .from('workspace_operational_period_form_snapshots')
      .insert({
        operational_period_id: operationalPeriodId,
        form_key: entry.key,
        document_id: standardDocument.id,
        snapshot: frozenSnapshot,
        source_version_id: sourceVersionId,
        version_snapshots: versionSnapshots,
      })

    if (snapshotError) {
      throw new Error(snapshotError.message)
    }

    await cloneSnapshotToDocument(
      admin,
      entry,
      standardDocument,
      workingSnapshot,
      userId,
      authorName
    )
  }
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
      .select('is_org_admin, email')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.is_org_admin) {
      const { data: permissionsPayload, error: permissionsError } = await admin.rpc(
        'get_my_workspace_permissions',
        { p_workspace_id: workspaceId }
      )

      if (permissionsError) {
        return res.status(403).json({ error: 'You do not have permission to start operational periods.' })
      }

      const canEdit =
        permissionsPayload &&
        typeof permissionsPayload === 'object' &&
        (permissionsPayload as { can_edit_ics201_form?: boolean }).can_edit_ics201_form === true

      if (!canEdit) {
        return res.status(403).json({ error: 'You do not have permission to start operational periods.' })
      }
    }

    const { data: workspace, error: workspaceError } = await admin
      .from('workspaces')
      .select(
        'id, kind, workspace_format, incident_complexity, started_operational_period_count, working_operational_period_number'
      )
      .eq('id', workspaceId)
      .maybeSingle()

    if (workspaceError || !workspace) {
      return res.status(404).json({ error: 'Workspace not found.' })
    }

    if (workspace.kind !== 'incident') {
      return res.status(400).json({ error: 'Operational periods are only available for incidents.' })
    }

    if (
      workspace.workspace_format !== 'uscg-ics' ||
      workspace.incident_complexity !== 'planning-p'
    ) {
      return res.status(400).json({
        error: 'Operational periods are only available for USCG ICS Planning-P incidents.',
      })
    }

    const startedCount = workspace.started_operational_period_count ?? 0
    const periodNumber = startedCount + 1
    const nextWorkingPeriodNumber = periodNumber + 1
    const authorName = profile?.email ?? user.email ?? 'System'

    await admin
      .from('workspace_operational_periods')
      .delete()
      .eq('workspace_id', workspaceId)
      .gt('period_number', startedCount)

    const { data: periodRow, error: periodError } = await admin
      .from('workspace_operational_periods')
      .insert({
        workspace_id: workspaceId,
        period_number: periodNumber,
        started_by: user.id,
      })
      .select('id, started_at')
      .single()

    if (periodError || !periodRow) {
      return res.status(500).json({
        error: periodError?.message ?? 'Could not create operational period record.',
      })
    }

    try {
      const periodWindows = computeOperationalPeriodWindows(new Date(periodRow.started_at))
      for (const entry of OPERATIONAL_PERIOD_FORM_REGISTRY) {
        await snapshotAndCloneFormEntry(
          admin,
          workspaceId,
          periodRow.id,
          entry,
          user.id,
          authorName,
          periodWindows
        )
      }
    } catch (formError) {
      await admin.from('workspace_operational_periods').delete().eq('id', periodRow.id)
      throw formError
    }

    const { error: updateWorkspaceError } = await admin
      .from('workspaces')
      .update({
        started_operational_period_count: periodNumber,
        working_operational_period_number: nextWorkingPeriodNumber,
      })
      .eq('id', workspaceId)

    if (updateWorkspaceError) {
      return res.status(500).json({
        error: updateWorkspaceError.message ?? 'Could not update workspace operational period counters.',
      })
    }

    return res.status(200).json({
      ok: true,
      periodNumber,
      startedOperationalPeriodCount: periodNumber,
      workingOperationalPeriodNumber: nextWorkingPeriodNumber,
      startedAt: periodRow.started_at,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Start operational period failed.'
    return res.status(500).json({ error: message })
  }
}

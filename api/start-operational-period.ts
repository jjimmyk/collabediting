import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type OperationalPeriodFormKey = 'ics201' | 'iap' | 'ics202' | 'ics203' | 'ics204'

type OperationalPeriodFormRegistryEntry = {
  key: OperationalPeriodFormKey
  documentsTable: string
  versionsTable: string
  multipleDocuments: boolean
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
    key: 'ics204',
    documentsTable: 'ics204_documents',
    versionsTable: 'ics204_versions',
    multipleDocuments: true,
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

type DocumentRow = {
  id: string
  form_data: unknown
  latest_version_id: string | null
  structure_mode?: string | null
}

type VersionRow = {
  id: string
  snapshot: unknown
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

async function getLatestDocumentSnapshot(
  admin: SupabaseClient,
  entry: OperationalPeriodFormRegistryEntry,
  document: DocumentRow
): Promise<{ snapshot: unknown; sourceVersionId: string | null }> {
  if (document.latest_version_id) {
    const { data: version, error } = await admin
      .from(entry.versionsTable)
      .select('id, snapshot')
      .eq('id', document.latest_version_id)
      .maybeSingle()

    if (!error && version) {
      const versionRow = version as VersionRow
      return {
        snapshot: versionRow.snapshot,
        sourceVersionId: versionRow.id,
      }
    }
  }

  return {
    snapshot: document.form_data,
    sourceVersionId: null,
  }
}

async function cloneSnapshotToDocument(
  admin: SupabaseClient,
  entry: OperationalPeriodFormRegistryEntry,
  document: DocumentRow,
  snapshot: unknown,
  userId: string,
  authorName: string
): Promise<void> {
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

async function fetchWorkspaceDocuments(
  admin: SupabaseClient,
  entry: OperationalPeriodFormRegistryEntry,
  workspaceId: string
) {
  const selectColumns =
    entry.key === 'ics201'
      ? 'id, form_data, latest_version_id, structure_mode'
      : 'id, form_data, latest_version_id'

  const baseQuery = admin
    .from(entry.documentsTable)
    .select(selectColumns)
    .eq('workspace_id', workspaceId)

  // ics201_documents has updated_at but no created_at; other form tables use created_at.
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
  authorName: string
): Promise<void> {
  const { data: documents, error: documentsError } = await fetchWorkspaceDocuments(
    admin,
    entry,
    workspaceId
  )

  if (documentsError) {
    throw new Error(documentsError.message)
  }

  const rows = (documents ?? []) as DocumentRow[]
  if (rows.length === 0) {
    return
  }

  for (const document of rows) {
    const { snapshot, sourceVersionId } = await getLatestDocumentSnapshot(
      admin,
      entry,
      document
    )

    const { error: snapshotError } = await admin
      .from('workspace_operational_period_form_snapshots')
      .insert({
        operational_period_id: operationalPeriodId,
        form_key: entry.key,
        document_id: document.id,
        snapshot,
        source_version_id: sourceVersionId,
      })

    if (snapshotError) {
      throw new Error(snapshotError.message)
    }

    await cloneSnapshotToDocument(admin, entry, document, snapshot, userId, authorName)
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
      for (const entry of OPERATIONAL_PERIOD_FORM_REGISTRY) {
        await snapshotAndCloneFormEntry(
          admin,
          workspaceId,
          periodRow.id,
          entry,
          user.id,
          authorName
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

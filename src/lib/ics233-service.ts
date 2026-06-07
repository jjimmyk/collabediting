import { getSupabaseClient } from '@/lib/supabase'
import { normalizeIcs233Row, type Ics233TaskRow } from '@/lib/ics233-workflow'

export type Ics233DocumentRow = {
  id: string
  workspace_id: string
  rows_data: Ics233TaskRow[]
  updated_at: string
  updated_by: string | null
}

function cloneIcs233Rows(rows: Ics233TaskRow[]): Ics233TaskRow[] {
  return rows.map((row) => ({ ...row }))
}

export function normalizeIcs233RowsFromDb(data: unknown): Ics233TaskRow[] {
  if (!Array.isArray(data)) {
    return []
  }

  return data.map((row) =>
    normalizeIcs233Row(row as Parameters<typeof normalizeIcs233Row>[0])
  )
}

function mapIcs233DocumentRow(row: {
  id: string
  workspace_id: string
  rows_data: unknown
  updated_at: string
  updated_by: string | null
}): Ics233DocumentRow {
  return {
    id: row.id,
    workspace_id: row.workspace_id,
    rows_data: normalizeIcs233RowsFromDb(row.rows_data),
    updated_at: row.updated_at,
    updated_by: row.updated_by,
  }
}

export async function fetchOrCreateIcs233Document(
  workspaceId: string
): Promise<Ics233DocumentRow | null> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return null
  }

  const { data: existing, error: fetchError } = await supabase
    .from('ics233_documents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  if (existing) {
    return mapIcs233DocumentRow(existing)
  }

  const { data: created, error: createError } = await supabase
    .from('ics233_documents')
    .insert({
      workspace_id: workspaceId,
      rows_data: [],
    })
    .select('*')
    .single()

  if (createError) {
    throw new Error(createError.message)
  }

  return mapIcs233DocumentRow(created)
}

export async function persistIcs233Rows(
  documentId: string,
  rows: Ics233TaskRow[],
  userId: string | null
): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return
  }

  const { error } = await supabase
    .from('ics233_documents')
    .update({
      rows_data: cloneIcs233Rows(rows),
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq('id', documentId)

  if (error) {
    throw new Error(error.message)
  }
}

export function subscribeToIcs233Changes(
  documentId: string,
  handlers: {
    onDocumentUpdated?: (document: Ics233DocumentRow) => void
  }
): () => void {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return () => undefined
  }

  const channel = supabase
    .channel(`ics233-doc:${documentId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'ics233_documents',
        filter: `id=eq.${documentId}`,
      },
      (payload) => {
        handlers.onDocumentUpdated?.(mapIcs233DocumentRow(payload.new as Ics233DocumentRow))
      }
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

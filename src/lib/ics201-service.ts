import { getSupabaseClient } from '@/lib/supabase'
import { createInitialIcs201Form } from '@/features/ics201/constants'
import type {
  Ics201DocumentRow,
  Ics201FormState,
  Ics201SectionId,
  Ics201StructureMode,
  Ics201Version,
  Ics201VersionRow,
  Ics201VersionSignature,
} from '@/features/ics201/types'
import { cloneIcs201FormState, mapIcs201VersionRow } from '@/features/ics201/utils'

export type Ics201DocumentBundle = {
  document: Ics201DocumentRow
  versions: Ics201Version[]
}

export type PersistIcs201VersionInput = {
  documentId: string
  snapshot: Ics201FormState
  authorId: string | null
  authorName: string
  authorColor: string
  signatures?: Ics201VersionSignature[]
  sectionId?: Ics201SectionId
  structureMode?: Ics201StructureMode
}

export async function fetchOrCreateIcs201Document(
  workspaceId: string
): Promise<Ics201DocumentBundle | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data: existing, error: fetchError } = await supabase
    .from('ics201_documents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  let document = existing as Ics201DocumentRow | null

  if (!document) {
    const initialForm = createInitialIcs201Form()
    const { data: created, error: createError } = await supabase
      .from('ics201_documents')
      .insert({
        workspace_id: workspaceId,
        form_data: initialForm,
        structure_mode: 'flexible',
      })
      .select('*')
      .single()

    if (createError) {
      throw new Error(createError.message)
    }

    document = created as Ics201DocumentRow
  }

  const versions = await fetchIcs201Versions(document.id)

  return {
    document: {
      ...document,
      form_data: cloneIcs201FormState(document.form_data),
    },
    versions,
  }
}

export async function fetchIcs201Versions(documentId: string): Promise<Ics201Version[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('ics201_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as Ics201VersionRow[]).map(mapIcs201VersionRow)
}

export async function persistIcs201Version(
  input: PersistIcs201VersionInput
): Promise<Ics201Version | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = cloneIcs201FormState(input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('ics201_versions')
    .insert({
      document_id: input.documentId,
      author_id: input.authorId,
      author_name: input.authorName,
      author_color: input.authorColor,
      snapshot,
      signatures,
      section_id: input.sectionId ?? null,
    })
    .select('*')
    .single()

  if (versionError) {
    throw new Error(versionError.message)
  }

  const { error: documentError } = await supabase
    .from('ics201_documents')
    .update({
      form_data: snapshot,
      latest_version_id: versionRow.id,
      updated_at: new Date().toISOString(),
      updated_by: input.authorId,
      ...(input.structureMode ? { structure_mode: input.structureMode } : {}),
    })
    .eq('id', input.documentId)

  if (documentError) {
    throw new Error(documentError.message)
  }

  return mapIcs201VersionRow(versionRow as Ics201VersionRow)
}

export function subscribeToIcs201Changes(
  documentId: string,
  handlers: {
    onDocumentUpdated?: (document: Ics201DocumentRow) => void
    onVersionInserted?: (version: Ics201Version) => void
  }
): () => void {
  const supabase = getSupabaseClient()
  if (!supabase) return () => undefined

  const channel = supabase
    .channel(`ics201-doc:${documentId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'ics201_documents',
        filter: `id=eq.${documentId}`,
      },
      (payload) => {
        const row = payload.new as Ics201DocumentRow
        handlers.onDocumentUpdated?.({
          ...row,
          form_data: cloneIcs201FormState(row.form_data),
        })
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ics201_versions',
        filter: `document_id=eq.${documentId}`,
      },
      (payload) => {
        handlers.onVersionInserted?.(mapIcs201VersionRow(payload.new as Ics201VersionRow))
      }
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

import type { Ics201VersionSignature } from '@/features/ics201/types'
import type {
  Ics234DocumentBundle,
  Ics234DocumentRow,
  Ics234FormState,
  Ics234Version,
  Ics234VersionRow,
} from '@/features/ics234/types'
import {
  cloneIcs234FormState,
  createEmptyIcs234Form,
  formStateForDocument,
  mapIcs234VersionRow,
} from '@/features/ics234/utils'
import { getSupabaseClient } from '@/lib/supabase'

export type PersistIcs234VersionInput = {
  documentId: string
  snapshot: Ics234FormState
  authorId: string | null
  authorName: string
  authorColor: string
  signatures?: Ics201VersionSignature[]
}

export async function fetchOrCreateIcs234Document(
  workspaceId: string,
  input: {
    form?: Partial<Ics234FormState>
    authorId: string | null
    authorName: string
    authorColor: string
  }
): Promise<Ics234DocumentBundle | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data: existing, error: fetchError } = await supabase
    .from('ics234_documents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  let document = existing as Ics234DocumentRow | null

  if (!document) {
    const { data: created, error: createError } = await supabase
      .from('ics234_documents')
      .insert({
        workspace_id: workspaceId,
        form_data: createEmptyIcs234Form('pending', input.form),
      })
      .select('*')
      .single()

    if (createError || !created) {
      throw new Error(createError?.message ?? 'Could not create ICS-234 document.')
    }

    document = created as Ics234DocumentRow
    const documentId = document.id
    const form = formStateForDocument(documentId, {
      ...createEmptyIcs234Form(documentId, input.form),
    })

    const version = await insertIcs234Version({
      documentId,
      snapshot: form,
      authorId: input.authorId,
      authorName: input.authorName,
      authorColor: input.authorColor,
      signatures: [],
    })

    if (!version) {
      throw new Error('Could not create initial ICS-234 version.')
    }

    return {
      document: {
        ...document,
        form_data: form,
        latest_version_id: version.id,
      },
      versions: [version],
    }
  }

  const versions = await fetchIcs234Versions(document.id)

  return {
    document: {
      ...document,
      form_data: formStateForDocument(document.id, document.form_data),
    },
    versions,
  }
}

export async function fetchIcs234Versions(documentId: string): Promise<Ics234Version[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('ics234_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as Ics234VersionRow[]).map(mapIcs234VersionRow)
}

async function insertIcs234Version(
  input: PersistIcs234VersionInput
): Promise<Ics234Version | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = formStateForDocument(input.documentId, input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('ics234_versions')
    .insert({
      document_id: input.documentId,
      author_id: input.authorId,
      author_name: input.authorName,
      author_color: input.authorColor,
      snapshot,
      signatures,
      section_id: null,
    })
    .select('*')
    .single()

  if (versionError) {
    throw new Error(versionError.message)
  }

  const { error: documentError } = await supabase
    .from('ics234_documents')
    .update({
      form_data: snapshot,
      latest_version_id: versionRow.id,
      updated_at: new Date().toISOString(),
      updated_by: input.authorId,
    })
    .eq('id', input.documentId)

  if (documentError) {
    throw new Error(documentError.message)
  }

  return mapIcs234VersionRow(versionRow as Ics234VersionRow)
}

export async function updateLatestIcs234Version(
  input: PersistIcs234VersionInput & { versionId: string }
): Promise<Ics234Version | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = formStateForDocument(input.documentId, input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('ics234_versions')
    .update({
      snapshot,
      signatures,
      author_id: input.authorId,
      author_name: input.authorName,
      author_color: input.authorColor,
    })
    .eq('id', input.versionId)
    .select('*')
    .single()

  if (versionError) {
    throw new Error(versionError.message)
  }

  const { error: documentError } = await supabase
    .from('ics234_documents')
    .update({
      form_data: snapshot,
      latest_version_id: versionRow.id,
      updated_at: new Date().toISOString(),
      updated_by: input.authorId,
    })
    .eq('id', input.documentId)

  if (documentError) {
    throw new Error(documentError.message)
  }

  return mapIcs234VersionRow(versionRow as Ics234VersionRow)
}

export async function appendIcs234Version(
  input: PersistIcs234VersionInput
): Promise<Ics234Version | null> {
  return insertIcs234Version(input)
}

export async function saveIcs234Draft(
  input: PersistIcs234VersionInput & { latestVersion: Ics234Version | null }
): Promise<Ics234Version | null> {
  const latest = input.latestVersion
  if (latest && latest.signatures.length === 0) {
    return updateLatestIcs234Version({
      ...input,
      versionId: latest.id,
    })
  }
  return appendIcs234Version(input)
}

export async function saveIcs234SignedReview(
  input: PersistIcs234VersionInput & { versionId: string }
): Promise<Ics234Version | null> {
  return updateLatestIcs234Version(input)
}

export function bundleToClientState(bundle: Ics234DocumentBundle): {
  form: Ics234FormState
  versions: Ics234Version[]
} {
  return {
    form: cloneIcs234FormState(bundle.document.form_data),
    versions: bundle.versions.map((version) => ({
      ...version,
      snapshot: cloneIcs234FormState(version.snapshot),
    })),
  }
}

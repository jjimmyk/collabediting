import type { Ics201VersionSignature } from '@/features/ics201/types'
import type {
  Ics215aDocumentBundle,
  Ics215aDocumentRow,
  Ics215aFormState,
  Ics215aVersion,
  Ics215aVersionRow,
} from '@/features/ics215a/types'
import {
  cloneIcs215aFormState,
  createEmptyIcs215aForm,
  formStateForDocument,
  mapIcs215aVersionRow,
} from '@/features/ics215a/utils'
import { getSupabaseClient } from '@/lib/supabase'

export type PersistIcs215aVersionInput = {
  documentId: string
  snapshot: Ics215aFormState
  authorId: string | null
  authorName: string
  authorColor: string
  signatures?: Ics201VersionSignature[]
}

export async function fetchOrCreateIcs215aDocument(
  workspaceId: string,
  input: {
    form?: Partial<Ics215aFormState>
    authorId: string | null
    authorName: string
    authorColor: string
  }
): Promise<Ics215aDocumentBundle | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data: existing, error: fetchError } = await supabase
    .from('ics215a_documents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  let document = existing as Ics215aDocumentRow | null

  if (!document) {
    const { data: created, error: createError } = await supabase
      .from('ics215a_documents')
      .insert({
        workspace_id: workspaceId,
        form_data: createEmptyIcs215aForm('pending', input.form),
      })
      .select('*')
      .single()

    if (createError || !created) {
      throw new Error(createError?.message ?? 'Could not create ICS-215A document.')
    }

    document = created as Ics215aDocumentRow
    const documentId = document.id
    const form = formStateForDocument(documentId, {
      ...createEmptyIcs215aForm(documentId, input.form),
    })

    const version = await insertIcs215aVersion({
      documentId,
      snapshot: form,
      authorId: input.authorId,
      authorName: input.authorName,
      authorColor: input.authorColor,
      signatures: [],
    })

    if (!version) {
      throw new Error('Could not create initial ICS-215A version.')
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

  const versions = await fetchIcs215aVersions(document.id)

  return {
    document: {
      ...document,
      form_data: formStateForDocument(document.id, document.form_data),
    },
    versions,
  }
}

export async function fetchIcs215aVersions(documentId: string): Promise<Ics215aVersion[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('ics215a_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as Ics215aVersionRow[]).map(mapIcs215aVersionRow)
}

async function insertIcs215aVersion(
  input: PersistIcs215aVersionInput
): Promise<Ics215aVersion | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = formStateForDocument(input.documentId, input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('ics215a_versions')
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
    .from('ics215a_documents')
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

  return mapIcs215aVersionRow(versionRow as Ics215aVersionRow)
}

export async function updateLatestIcs215aVersion(
  input: PersistIcs215aVersionInput & { versionId: string }
): Promise<Ics215aVersion | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = formStateForDocument(input.documentId, input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('ics215a_versions')
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
    .from('ics215a_documents')
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

  return mapIcs215aVersionRow(versionRow as Ics215aVersionRow)
}

export async function appendIcs215aVersion(
  input: PersistIcs215aVersionInput
): Promise<Ics215aVersion | null> {
  return insertIcs215aVersion(input)
}

export async function saveIcs215aDraft(
  input: PersistIcs215aVersionInput & { latestVersion: Ics215aVersion | null }
): Promise<Ics215aVersion | null> {
  const latest = input.latestVersion
  if (latest && latest.signatures.length === 0) {
    return updateLatestIcs215aVersion({
      ...input,
      versionId: latest.id,
    })
  }
  return appendIcs215aVersion(input)
}

export async function saveIcs215aSignedReview(
  input: PersistIcs215aVersionInput & { versionId: string }
): Promise<Ics215aVersion | null> {
  return updateLatestIcs215aVersion(input)
}

export function bundleToClientState(bundle: Ics215aDocumentBundle): {
  form: Ics215aFormState
  versions: Ics215aVersion[]
} {
  return {
    form: cloneIcs215aFormState(bundle.document.form_data),
    versions: bundle.versions.map((version) => ({
      ...version,
      snapshot: cloneIcs215aFormState(version.snapshot),
    })),
  }
}

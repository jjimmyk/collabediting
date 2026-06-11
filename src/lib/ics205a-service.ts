import type { Ics201VersionSignature } from '@/features/ics201/types'
import type {
  Ics205aDocumentBundle,
  Ics205aDocumentRow,
  Ics205aFormState,
  Ics205aVersion,
  Ics205aVersionRow,
} from '@/features/ics205a/types'
import {
  cloneIcs205aFormState,
  createEmptyIcs205aForm,
  formStateForDocument,
  mapIcs205aVersionRow,
} from '@/features/ics205a/utils'
import { getSupabaseClient } from '@/lib/supabase'

export type PersistIcs205aVersionInput = {
  documentId: string
  snapshot: Ics205aFormState
  authorId: string | null
  authorName: string
  authorColor: string
  signatures?: Ics201VersionSignature[]
}

export async function fetchOrCreateIcs205aDocument(
  workspaceId: string,
  input: {
    form?: Partial<Ics205aFormState>
    authorId: string | null
    authorName: string
    authorColor: string
  }
): Promise<Ics205aDocumentBundle | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data: existing, error: fetchError } = await supabase
    .from('ics205a_documents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  let document = existing as Ics205aDocumentRow | null

  if (!document) {
    const { data: created, error: createError } = await supabase
      .from('ics205a_documents')
      .insert({
        workspace_id: workspaceId,
        form_data: createEmptyIcs205aForm('pending', input.form),
      })
      .select('*')
      .single()

    if (createError || !created) {
      throw new Error(createError?.message ?? 'Could not create ICS-205A document.')
    }

    document = created as Ics205aDocumentRow
    const documentId = document.id
    const form = formStateForDocument(documentId, {
      ...createEmptyIcs205aForm(documentId, input.form),
    })

    const version = await insertIcs205aVersion({
      documentId,
      snapshot: form,
      authorId: input.authorId,
      authorName: input.authorName,
      authorColor: input.authorColor,
      signatures: [],
    })

    if (!version) {
      throw new Error('Could not create initial ICS-205A version.')
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

  const versions = await fetchIcs205aVersions(document.id)

  return {
    document: {
      ...document,
      form_data: formStateForDocument(document.id, document.form_data),
    },
    versions,
  }
}

export async function fetchIcs205aVersions(documentId: string): Promise<Ics205aVersion[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('ics205a_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as Ics205aVersionRow[]).map(mapIcs205aVersionRow)
}

async function insertIcs205aVersion(
  input: PersistIcs205aVersionInput
): Promise<Ics205aVersion | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = formStateForDocument(input.documentId, input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('ics205a_versions')
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
    .from('ics205a_documents')
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

  return mapIcs205aVersionRow(versionRow as Ics205aVersionRow)
}

export async function updateLatestIcs205aVersion(
  input: PersistIcs205aVersionInput & { versionId: string }
): Promise<Ics205aVersion | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = formStateForDocument(input.documentId, input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('ics205a_versions')
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
    .from('ics205a_documents')
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

  return mapIcs205aVersionRow(versionRow as Ics205aVersionRow)
}

export async function appendIcs205aVersion(
  input: PersistIcs205aVersionInput
): Promise<Ics205aVersion | null> {
  return insertIcs205aVersion(input)
}

export async function saveIcs205aDraft(
  input: PersistIcs205aVersionInput & { latestVersion: Ics205aVersion | null }
): Promise<Ics205aVersion | null> {
  const latest = input.latestVersion
  if (latest && latest.signatures.length === 0) {
    return updateLatestIcs205aVersion({
      ...input,
      versionId: latest.id,
    })
  }
  return appendIcs205aVersion(input)
}

export async function saveIcs205aSignedReview(
  input: PersistIcs205aVersionInput & { versionId: string }
): Promise<Ics205aVersion | null> {
  return updateLatestIcs205aVersion(input)
}

export function bundleToClientState(bundle: Ics205aDocumentBundle): {
  form: Ics205aFormState
  versions: Ics205aVersion[]
} {
  return {
    form: cloneIcs205aFormState(bundle.document.form_data),
    versions: bundle.versions.map((version) => ({
      ...version,
      snapshot: cloneIcs205aFormState(version.snapshot),
    })),
  }
}

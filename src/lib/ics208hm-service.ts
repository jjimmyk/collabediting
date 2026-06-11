import type { Ics201VersionSignature } from '@/features/ics201/types'
import type {
  Ics208hmDocumentBundle,
  Ics208hmDocumentRow,
  Ics208hmFormState,
  Ics208hmVersion,
  Ics208hmVersionRow,
} from '@/features/ics208hm/types'
import {
  cloneIcs208hmFormState,
  createEmptyIcs208hmForm,
  formStateForDocument,
  mapIcs208hmVersionRow,
} from '@/features/ics208hm/utils'
import { getSupabaseClient } from '@/lib/supabase'

export type PersistIcs208hmVersionInput = {
  documentId: string
  snapshot: Ics208hmFormState
  authorId: string | null
  authorName: string
  authorColor: string
  signatures?: Ics201VersionSignature[]
}

export async function fetchOrCreateIcs208hmDocument(
  workspaceId: string,
  input: {
    form?: Partial<Ics208hmFormState>
    authorId: string | null
    authorName: string
    authorColor: string
  }
): Promise<Ics208hmDocumentBundle | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data: existing, error: fetchError } = await supabase
    .from('ics208hm_documents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  let document = existing as Ics208hmDocumentRow | null

  if (!document) {
    const { data: created, error: createError } = await supabase
      .from('ics208hm_documents')
      .insert({
        workspace_id: workspaceId,
        form_data: createEmptyIcs208hmForm('pending', input.form),
      })
      .select('*')
      .single()

    if (createError || !created) {
      throw new Error(createError?.message ?? 'Could not create ICS-208HM document.')
    }

    document = created as Ics208hmDocumentRow
    const documentId = document.id
    const form = formStateForDocument(documentId, {
      ...createEmptyIcs208hmForm(documentId, input.form),
    })

    const version = await insertIcs208hmVersion({
      documentId,
      snapshot: form,
      authorId: input.authorId,
      authorName: input.authorName,
      authorColor: input.authorColor,
      signatures: [],
    })

    if (!version) {
      throw new Error('Could not create initial ICS-208HM version.')
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

  const versions = await fetchIcs208hmVersions(document.id)

  return {
    document: {
      ...document,
      form_data: formStateForDocument(document.id, document.form_data),
    },
    versions,
  }
}

export async function fetchIcs208hmVersions(documentId: string): Promise<Ics208hmVersion[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('ics208hm_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as Ics208hmVersionRow[]).map(mapIcs208hmVersionRow)
}

async function insertIcs208hmVersion(
  input: PersistIcs208hmVersionInput
): Promise<Ics208hmVersion | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = formStateForDocument(input.documentId, input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('ics208hm_versions')
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
    .from('ics208hm_documents')
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

  return mapIcs208hmVersionRow(versionRow as Ics208hmVersionRow)
}

export async function updateLatestIcs208hmVersion(
  input: PersistIcs208hmVersionInput & { versionId: string }
): Promise<Ics208hmVersion | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = formStateForDocument(input.documentId, input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('ics208hm_versions')
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
    .from('ics208hm_documents')
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

  return mapIcs208hmVersionRow(versionRow as Ics208hmVersionRow)
}

export async function appendIcs208hmVersion(
  input: PersistIcs208hmVersionInput
): Promise<Ics208hmVersion | null> {
  return insertIcs208hmVersion(input)
}

export async function saveIcs208hmDraft(
  input: PersistIcs208hmVersionInput & { latestVersion: Ics208hmVersion | null }
): Promise<Ics208hmVersion | null> {
  const latest = input.latestVersion
  if (latest && latest.signatures.length === 0) {
    return updateLatestIcs208hmVersion({
      ...input,
      versionId: latest.id,
    })
  }
  return appendIcs208hmVersion(input)
}

export async function saveIcs208hmSignedReview(
  input: PersistIcs208hmVersionInput & { versionId: string }
): Promise<Ics208hmVersion | null> {
  return updateLatestIcs208hmVersion(input)
}

export function bundleToClientState(bundle: Ics208hmDocumentBundle): {
  form: Ics208hmFormState
  versions: Ics208hmVersion[]
} {
  return {
    form: cloneIcs208hmFormState(bundle.document.form_data),
    versions: bundle.versions.map((version) => ({
      ...version,
      snapshot: cloneIcs208hmFormState(version.snapshot),
    })),
  }
}

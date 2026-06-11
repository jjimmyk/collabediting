import type { Ics201VersionSignature } from '@/features/ics201/types'
import type {
  Ics208DocumentBundle,
  Ics208DocumentRow,
  Ics208FormState,
  Ics208Version,
  Ics208VersionRow,
} from '@/features/ics208/types'
import {
  cloneIcs208FormState,
  createEmptyIcs208Form,
  formStateForDocument,
  mapIcs208VersionRow,
} from '@/features/ics208/utils'
import { getSupabaseClient } from '@/lib/supabase'

export type PersistIcs208VersionInput = {
  documentId: string
  snapshot: Ics208FormState
  authorId: string | null
  authorName: string
  authorColor: string
  signatures?: Ics201VersionSignature[]
}

export async function fetchOrCreateIcs208Document(
  workspaceId: string,
  input: {
    form?: Partial<Ics208FormState>
    authorId: string | null
    authorName: string
    authorColor: string
  }
): Promise<Ics208DocumentBundle | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data: existing, error: fetchError } = await supabase
    .from('ics208_documents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  let document = existing as Ics208DocumentRow | null

  if (!document) {
    const { data: created, error: createError } = await supabase
      .from('ics208_documents')
      .insert({
        workspace_id: workspaceId,
        form_data: createEmptyIcs208Form('pending', input.form),
      })
      .select('*')
      .single()

    if (createError || !created) {
      throw new Error(createError?.message ?? 'Could not create ICS-208 document.')
    }

    document = created as Ics208DocumentRow
    const documentId = document.id
    const form = formStateForDocument(documentId, {
      ...createEmptyIcs208Form(documentId, input.form),
    })

    const version = await insertIcs208Version({
      documentId,
      snapshot: form,
      authorId: input.authorId,
      authorName: input.authorName,
      authorColor: input.authorColor,
      signatures: [],
    })

    if (!version) {
      throw new Error('Could not create initial ICS-208 version.')
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

  const versions = await fetchIcs208Versions(document.id)

  return {
    document: {
      ...document,
      form_data: formStateForDocument(document.id, document.form_data),
    },
    versions,
  }
}

export async function fetchIcs208Versions(documentId: string): Promise<Ics208Version[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('ics208_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as Ics208VersionRow[]).map(mapIcs208VersionRow)
}

async function insertIcs208Version(
  input: PersistIcs208VersionInput
): Promise<Ics208Version | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = formStateForDocument(input.documentId, input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('ics208_versions')
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
    .from('ics208_documents')
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

  return mapIcs208VersionRow(versionRow as Ics208VersionRow)
}

export async function updateLatestIcs208Version(
  input: PersistIcs208VersionInput & { versionId: string }
): Promise<Ics208Version | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = formStateForDocument(input.documentId, input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('ics208_versions')
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
    .from('ics208_documents')
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

  return mapIcs208VersionRow(versionRow as Ics208VersionRow)
}

export async function appendIcs208Version(
  input: PersistIcs208VersionInput
): Promise<Ics208Version | null> {
  return insertIcs208Version(input)
}

export async function saveIcs208Draft(
  input: PersistIcs208VersionInput & { latestVersion: Ics208Version | null }
): Promise<Ics208Version | null> {
  const latest = input.latestVersion
  if (latest && latest.signatures.length === 0) {
    return updateLatestIcs208Version({
      ...input,
      versionId: latest.id,
    })
  }
  return appendIcs208Version(input)
}

export async function saveIcs208SignedReview(
  input: PersistIcs208VersionInput & { versionId: string }
): Promise<Ics208Version | null> {
  return updateLatestIcs208Version(input)
}

export function bundleToClientState(bundle: Ics208DocumentBundle): {
  form: Ics208FormState
  versions: Ics208Version[]
} {
  return {
    form: cloneIcs208FormState(bundle.document.form_data),
    versions: bundle.versions.map((version) => ({
      ...version,
      snapshot: cloneIcs208FormState(version.snapshot),
    })),
  }
}

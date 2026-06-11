import type { Ics201VersionSignature } from '@/features/ics201/types'
import type {
  Ics215DocumentBundle,
  Ics215DocumentRow,
  Ics215FormState,
  Ics215Version,
  Ics215VersionRow,
} from '@/features/ics215/types'
import {
  cloneIcs215FormState,
  createEmptyIcs215Form,
  formStateForDocument,
  mapIcs215VersionRow,
} from '@/features/ics215/utils'
import { getSupabaseClient } from '@/lib/supabase'

export type PersistIcs215VersionInput = {
  documentId: string
  snapshot: Ics215FormState
  authorId: string | null
  authorName: string
  authorColor: string
  signatures?: Ics201VersionSignature[]
}

export async function fetchOrCreateIcs215Document(
  workspaceId: string,
  input: {
    form?: Partial<Ics215FormState>
    authorId: string | null
    authorName: string
    authorColor: string
  }
): Promise<Ics215DocumentBundle | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data: existing, error: fetchError } = await supabase
    .from('ics215_documents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  let document = existing as Ics215DocumentRow | null

  if (!document) {
    const { data: created, error: createError } = await supabase
      .from('ics215_documents')
      .insert({
        workspace_id: workspaceId,
        form_data: createEmptyIcs215Form('pending', input.form),
      })
      .select('*')
      .single()

    if (createError || !created) {
      throw new Error(createError?.message ?? 'Could not create ICS-215 document.')
    }

    document = created as Ics215DocumentRow
    const documentId = document.id
    const form = formStateForDocument(documentId, {
      ...createEmptyIcs215Form(documentId, input.form),
    })

    const version = await insertIcs215Version({
      documentId,
      snapshot: form,
      authorId: input.authorId,
      authorName: input.authorName,
      authorColor: input.authorColor,
      signatures: [],
    })

    if (!version) {
      throw new Error('Could not create initial ICS-215 version.')
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

  const versions = await fetchIcs215Versions(document.id)

  return {
    document: {
      ...document,
      form_data: formStateForDocument(document.id, document.form_data),
    },
    versions,
  }
}

export async function fetchIcs215Versions(documentId: string): Promise<Ics215Version[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('ics215_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as Ics215VersionRow[]).map(mapIcs215VersionRow)
}

async function insertIcs215Version(
  input: PersistIcs215VersionInput
): Promise<Ics215Version | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = formStateForDocument(input.documentId, input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('ics215_versions')
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
    .from('ics215_documents')
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

  return mapIcs215VersionRow(versionRow as Ics215VersionRow)
}

export async function updateLatestIcs215Version(
  input: PersistIcs215VersionInput & { versionId: string }
): Promise<Ics215Version | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = formStateForDocument(input.documentId, input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('ics215_versions')
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
    .from('ics215_documents')
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

  return mapIcs215VersionRow(versionRow as Ics215VersionRow)
}

export async function appendIcs215Version(
  input: PersistIcs215VersionInput
): Promise<Ics215Version | null> {
  return insertIcs215Version(input)
}

export async function saveIcs215Draft(
  input: PersistIcs215VersionInput & { latestVersion: Ics215Version | null }
): Promise<Ics215Version | null> {
  const latest = input.latestVersion
  if (latest && latest.signatures.length === 0) {
    return updateLatestIcs215Version({
      ...input,
      versionId: latest.id,
    })
  }
  return appendIcs215Version(input)
}

export async function saveIcs215SignedReview(
  input: PersistIcs215VersionInput & { versionId: string }
): Promise<Ics215Version | null> {
  return updateLatestIcs215Version(input)
}

export function bundleToClientState(bundle: Ics215DocumentBundle): {
  form: Ics215FormState
  versions: Ics215Version[]
} {
  return {
    form: cloneIcs215FormState(bundle.document.form_data),
    versions: bundle.versions.map((version) => ({
      ...version,
      snapshot: cloneIcs215FormState(version.snapshot),
    })),
  }
}

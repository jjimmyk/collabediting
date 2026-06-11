import type { Ics201VersionSignature } from '@/features/ics201/types'
import type {
  Ics205DocumentBundle,
  Ics205DocumentRow,
  Ics205FormState,
  Ics205Version,
  Ics205VersionRow,
} from '@/features/ics205/types'
import {
  cloneIcs205FormState,
  createEmptyIcs205Form,
  formStateForDocument,
  mapIcs205VersionRow,
} from '@/features/ics205/utils'
import { getSupabaseClient } from '@/lib/supabase'

export type PersistIcs205VersionInput = {
  documentId: string
  snapshot: Ics205FormState
  authorId: string | null
  authorName: string
  authorColor: string
  signatures?: Ics201VersionSignature[]
}

export async function fetchOrCreateIcs205Document(
  workspaceId: string,
  input: {
    form?: Partial<Ics205FormState>
    authorId: string | null
    authorName: string
    authorColor: string
  }
): Promise<Ics205DocumentBundle | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data: existing, error: fetchError } = await supabase
    .from('ics205_documents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  let document = existing as Ics205DocumentRow | null

  if (!document) {
    const { data: created, error: createError } = await supabase
      .from('ics205_documents')
      .insert({
        workspace_id: workspaceId,
        form_data: createEmptyIcs205Form('pending', input.form),
      })
      .select('*')
      .single()

    if (createError || !created) {
      throw new Error(createError?.message ?? 'Could not create ICS-205 document.')
    }

    document = created as Ics205DocumentRow
    const documentId = document.id
    const form = formStateForDocument(documentId, {
      ...createEmptyIcs205Form(documentId, input.form),
    })

    const version = await insertIcs205Version({
      documentId,
      snapshot: form,
      authorId: input.authorId,
      authorName: input.authorName,
      authorColor: input.authorColor,
      signatures: [],
    })

    if (!version) {
      throw new Error('Could not create initial ICS-205 version.')
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

  const versions = await fetchIcs205Versions(document.id)

  return {
    document: {
      ...document,
      form_data: formStateForDocument(document.id, document.form_data),
    },
    versions,
  }
}

export async function fetchIcs205Versions(documentId: string): Promise<Ics205Version[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('ics205_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as Ics205VersionRow[]).map(mapIcs205VersionRow)
}

async function insertIcs205Version(
  input: PersistIcs205VersionInput
): Promise<Ics205Version | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = formStateForDocument(input.documentId, input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('ics205_versions')
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
    .from('ics205_documents')
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

  return mapIcs205VersionRow(versionRow as Ics205VersionRow)
}

export async function updateLatestIcs205Version(
  input: PersistIcs205VersionInput & { versionId: string }
): Promise<Ics205Version | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = formStateForDocument(input.documentId, input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('ics205_versions')
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
    .from('ics205_documents')
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

  return mapIcs205VersionRow(versionRow as Ics205VersionRow)
}

export async function appendIcs205Version(
  input: PersistIcs205VersionInput
): Promise<Ics205Version | null> {
  return insertIcs205Version(input)
}

export async function saveIcs205Draft(
  input: PersistIcs205VersionInput & { latestVersion: Ics205Version | null }
): Promise<Ics205Version | null> {
  const latest = input.latestVersion
  if (latest && latest.signatures.length === 0) {
    return updateLatestIcs205Version({
      ...input,
      versionId: latest.id,
    })
  }
  return appendIcs205Version(input)
}

export async function saveIcs205SignedReview(
  input: PersistIcs205VersionInput & { versionId: string }
): Promise<Ics205Version | null> {
  return updateLatestIcs205Version(input)
}

export function bundleToClientState(bundle: Ics205DocumentBundle): {
  form: Ics205FormState
  versions: Ics205Version[]
} {
  return {
    form: cloneIcs205FormState(bundle.document.form_data),
    versions: bundle.versions.map((version) => ({
      ...version,
      snapshot: cloneIcs205FormState(version.snapshot),
    })),
  }
}

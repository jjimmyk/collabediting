import type { Ics201VersionSignature } from '@/features/ics201/types'
import type {
  Ics209DocumentBundle,
  Ics209DocumentRow,
  Ics209FormState,
  Ics209Version,
  Ics209VersionRow,
} from '@/features/ics209/types'
import {
  cloneIcs209FormState,
  createEmptyIcs209Form,
  formStateForDocument,
  mapIcs209VersionRow,
} from '@/features/ics209/utils'
import { getSupabaseClient } from '@/lib/supabase'

export type PersistIcs209VersionInput = {
  documentId: string
  snapshot: Ics209FormState
  authorId: string | null
  authorName: string
  authorColor: string
  signatures?: Ics201VersionSignature[]
}

export async function fetchOrCreateIcs209Document(
  workspaceId: string,
  input: {
    form?: Partial<Ics209FormState>
    authorId: string | null
    authorName: string
    authorColor: string
  }
): Promise<Ics209DocumentBundle | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data: existing, error: fetchError } = await supabase
    .from('ics209_documents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  let document = existing as Ics209DocumentRow | null

  if (!document) {
    const { data: created, error: createError } = await supabase
      .from('ics209_documents')
      .insert({
        workspace_id: workspaceId,
        form_data: createEmptyIcs209Form('pending', input.form),
      })
      .select('*')
      .single()

    if (createError || !created) {
      throw new Error(createError?.message ?? 'Could not create ICS-209 document.')
    }

    document = created as Ics209DocumentRow
    const documentId = document.id
    const form = formStateForDocument(documentId, {
      ...createEmptyIcs209Form(documentId, input.form),
    })

    const version = await insertIcs209Version({
      documentId,
      snapshot: form,
      authorId: input.authorId,
      authorName: input.authorName,
      authorColor: input.authorColor,
      signatures: [],
    })

    if (!version) {
      throw new Error('Could not create initial ICS-209 version.')
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

  const versions = await fetchIcs209Versions(document.id)

  return {
    document: {
      ...document,
      form_data: formStateForDocument(document.id, document.form_data),
    },
    versions,
  }
}

export async function fetchIcs209Versions(documentId: string): Promise<Ics209Version[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('ics209_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as Ics209VersionRow[]).map(mapIcs209VersionRow)
}

async function insertIcs209Version(
  input: PersistIcs209VersionInput
): Promise<Ics209Version | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = formStateForDocument(input.documentId, input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('ics209_versions')
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
    .from('ics209_documents')
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

  return mapIcs209VersionRow(versionRow as Ics209VersionRow)
}

export async function updateLatestIcs209Version(
  input: PersistIcs209VersionInput & { versionId: string }
): Promise<Ics209Version | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = formStateForDocument(input.documentId, input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('ics209_versions')
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
    .from('ics209_documents')
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

  return mapIcs209VersionRow(versionRow as Ics209VersionRow)
}

export async function appendIcs209Version(
  input: PersistIcs209VersionInput
): Promise<Ics209Version | null> {
  return insertIcs209Version(input)
}

export async function saveIcs209Draft(
  input: PersistIcs209VersionInput & { latestVersion: Ics209Version | null }
): Promise<Ics209Version | null> {
  const latest = input.latestVersion
  if (latest && latest.signatures.length === 0) {
    return updateLatestIcs209Version({
      ...input,
      versionId: latest.id,
    })
  }
  return appendIcs209Version(input)
}

export async function saveIcs209SignedReview(
  input: PersistIcs209VersionInput & { versionId: string }
): Promise<Ics209Version | null> {
  return updateLatestIcs209Version(input)
}

export function bundleToClientState(bundle: Ics209DocumentBundle): {
  form: Ics209FormState
  versions: Ics209Version[]
} {
  return {
    form: cloneIcs209FormState(bundle.document.form_data),
    versions: bundle.versions.map((version) => ({
      ...version,
      snapshot: cloneIcs209FormState(version.snapshot),
    })),
  }
}

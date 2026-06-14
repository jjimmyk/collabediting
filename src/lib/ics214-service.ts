import type { Ics201VersionSignature } from '@/features/ics201/types'
import type {
  Ics214DocumentBundle,
  Ics214DocumentRow,
  Ics214FormState,
  Ics214Version,
  Ics214VersionRow,
} from '@/features/ics214/types'
import {
  cloneIcs214FormState,
  createEmptyIcs214Form,
  formStateForDocument,
  mapIcs214VersionRow,
} from '@/features/ics214/utils'
import { getSupabaseClient } from '@/lib/supabase'

export type PersistIcs214VersionInput = {
  documentId: string
  snapshot: Ics214FormState
  authorId: string | null
  authorName: string
  authorColor: string
  signatures?: Ics201VersionSignature[]
}

export async function fetchOrCreateIcs214Document(
  workspaceId: string,
  input: {
    form?: Partial<Ics214FormState>
    authorId: string | null
    authorName: string
    authorColor: string
  }
): Promise<Ics214DocumentBundle | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data: existing, error: fetchError } = await supabase
    .from('ics214_documents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  let document = existing as Ics214DocumentRow | null

  if (!document) {
    const { data: created, error: createError } = await supabase
      .from('ics214_documents')
      .insert({
        workspace_id: workspaceId,
        form_data: createEmptyIcs214Form('pending', input.form),
      })
      .select('*')
      .single()

    if (createError || !created) {
      throw new Error(createError?.message ?? 'Could not create ICS-214 document.')
    }

    document = created as Ics214DocumentRow
    const documentId = document.id
    const form = formStateForDocument(documentId, {
      ...createEmptyIcs214Form(documentId, input.form),
    })

    const version = await insertIcs214Version({
      documentId,
      snapshot: form,
      authorId: input.authorId,
      authorName: input.authorName,
      authorColor: input.authorColor,
      signatures: [],
    })

    if (!version) {
      throw new Error('Could not create initial ICS-214 version.')
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

  const versions = await fetchIcs214Versions(document.id)

  return {
    document: {
      ...document,
      form_data: formStateForDocument(document.id, document.form_data),
    },
    versions,
  }
}

export async function fetchIcs214Versions(documentId: string): Promise<Ics214Version[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('ics214_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as Ics214VersionRow[]).map(mapIcs214VersionRow)
}

async function insertIcs214Version(
  input: PersistIcs214VersionInput
): Promise<Ics214Version | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = formStateForDocument(input.documentId, input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('ics214_versions')
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
    .from('ics214_documents')
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

  return mapIcs214VersionRow(versionRow as Ics214VersionRow)
}

export async function updateLatestIcs214Version(
  input: PersistIcs214VersionInput & { versionId: string }
): Promise<Ics214Version | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = formStateForDocument(input.documentId, input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('ics214_versions')
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
    .from('ics214_documents')
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

  return mapIcs214VersionRow(versionRow as Ics214VersionRow)
}

export async function appendIcs214Version(
  input: PersistIcs214VersionInput
): Promise<Ics214Version | null> {
  return insertIcs214Version(input)
}

export async function saveIcs214Draft(
  input: PersistIcs214VersionInput & { latestVersion: Ics214Version | null }
): Promise<Ics214Version | null> {
  const latest = input.latestVersion
  if (latest && latest.signatures.length === 0) {
    return updateLatestIcs214Version({
      ...input,
      versionId: latest.id,
    })
  }
  return appendIcs214Version(input)
}

export async function saveIcs214SignedReview(
  input: PersistIcs214VersionInput & { versionId: string }
): Promise<Ics214Version | null> {
  return updateLatestIcs214Version(input)
}

export function bundleToClientState(bundle: Ics214DocumentBundle): {
  form: Ics214FormState
  versions: Ics214Version[]
} {
  return {
    form: cloneIcs214FormState(bundle.document.form_data),
    versions: bundle.versions.map((version) => ({
      ...version,
      snapshot: cloneIcs214FormState(version.snapshot),
    })),
  }
}

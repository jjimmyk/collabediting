import type { Ics201VersionSignature } from '@/features/ics201/types'
import type {
  Ics206DocumentBundle,
  Ics206DocumentRow,
  Ics206FormState,
  Ics206Version,
  Ics206VersionRow,
} from '@/features/ics206/types'
import {
  cloneIcs206FormState,
  createEmptyIcs206Form,
  formStateForDocument,
  mapIcs206VersionRow,
} from '@/features/ics206/utils'
import { getSupabaseClient } from '@/lib/supabase'

export type PersistIcs206VersionInput = {
  documentId: string
  snapshot: Ics206FormState
  authorId: string | null
  authorName: string
  authorColor: string
  signatures?: Ics201VersionSignature[]
}

export async function fetchOrCreateIcs206Document(
  workspaceId: string,
  input: {
    form?: Partial<Ics206FormState>
    authorId: string | null
    authorName: string
    authorColor: string
  }
): Promise<Ics206DocumentBundle | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data: existing, error: fetchError } = await supabase
    .from('ics206_documents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  let document = existing as Ics206DocumentRow | null

  if (!document) {
    const { data: created, error: createError } = await supabase
      .from('ics206_documents')
      .insert({
        workspace_id: workspaceId,
        form_data: createEmptyIcs206Form('pending', input.form),
      })
      .select('*')
      .single()

    if (createError || !created) {
      throw new Error(createError?.message ?? 'Could not create ICS-206 document.')
    }

    document = created as Ics206DocumentRow
    const documentId = document.id
    const form = formStateForDocument(documentId, {
      ...createEmptyIcs206Form(documentId, input.form),
    })

    const version = await insertIcs206Version({
      documentId,
      snapshot: form,
      authorId: input.authorId,
      authorName: input.authorName,
      authorColor: input.authorColor,
      signatures: [],
    })

    if (!version) {
      throw new Error('Could not create initial ICS-206 version.')
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

  const versions = await fetchIcs206Versions(document.id)

  return {
    document: {
      ...document,
      form_data: formStateForDocument(document.id, document.form_data),
    },
    versions,
  }
}

export async function fetchIcs206Versions(documentId: string): Promise<Ics206Version[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('ics206_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as Ics206VersionRow[]).map(mapIcs206VersionRow)
}

async function insertIcs206Version(
  input: PersistIcs206VersionInput
): Promise<Ics206Version | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = formStateForDocument(input.documentId, input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('ics206_versions')
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
    .from('ics206_documents')
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

  return mapIcs206VersionRow(versionRow as Ics206VersionRow)
}

export async function updateLatestIcs206Version(
  input: PersistIcs206VersionInput & { versionId: string }
): Promise<Ics206Version | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = formStateForDocument(input.documentId, input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('ics206_versions')
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
    .from('ics206_documents')
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

  return mapIcs206VersionRow(versionRow as Ics206VersionRow)
}

export async function appendIcs206Version(
  input: PersistIcs206VersionInput
): Promise<Ics206Version | null> {
  return insertIcs206Version(input)
}

export async function saveIcs206Draft(
  input: PersistIcs206VersionInput & { latestVersion: Ics206Version | null }
): Promise<Ics206Version | null> {
  const latest = input.latestVersion
  if (latest && latest.signatures.length === 0) {
    return updateLatestIcs206Version({
      ...input,
      versionId: latest.id,
    })
  }
  return appendIcs206Version(input)
}

export async function saveIcs206SignedReview(
  input: PersistIcs206VersionInput & { versionId: string }
): Promise<Ics206Version | null> {
  return updateLatestIcs206Version(input)
}

export function bundleToClientState(bundle: Ics206DocumentBundle): {
  form: Ics206FormState
  versions: Ics206Version[]
} {
  return {
    form: cloneIcs206FormState(bundle.document.form_data),
    versions: bundle.versions.map((version) => ({
      ...version,
      snapshot: cloneIcs206FormState(version.snapshot),
    })),
  }
}

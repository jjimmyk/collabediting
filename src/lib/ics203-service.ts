import type { Ics201VersionSignature } from '@/features/ics201/types'
import type {
  Ics203DocumentBundle,
  Ics203DocumentRow,
  Ics203FormState,
  Ics203Version,
  Ics203VersionRow,
} from '@/features/ics203/types'
import {
  cloneIcs203FormState,
  createEmptyIcs203Form,
  formStateForDocument,
  mapIcs203VersionRow,
} from '@/features/ics203/utils'
import { getSupabaseClient } from '@/lib/supabase'

export type PersistIcs203VersionInput = {
  documentId: string
  snapshot: Ics203FormState
  authorId: string | null
  authorName: string
  authorColor: string
  signatures?: Ics201VersionSignature[]
}

export async function fetchOrCreateIcs203Document(
  workspaceId: string,
  input: {
    form?: Partial<Ics203FormState>
    authorId: string | null
    authorName: string
    authorColor: string
  }
): Promise<Ics203DocumentBundle | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data: existing, error: fetchError } = await supabase
    .from('ics203_documents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  let document = existing as Ics203DocumentRow | null

  if (!document) {
    const { data: created, error: createError } = await supabase
      .from('ics203_documents')
      .insert({
        workspace_id: workspaceId,
        form_data: createEmptyIcs203Form('pending', input.form),
      })
      .select('*')
      .single()

    if (createError || !created) {
      throw new Error(createError?.message ?? 'Could not create ICS-203 document.')
    }

    document = created as Ics203DocumentRow
    const documentId = document.id
    const form = formStateForDocument(documentId, {
      ...createEmptyIcs203Form(documentId, input.form),
    })

    const version = await insertIcs203Version({
      documentId,
      snapshot: form,
      authorId: input.authorId,
      authorName: input.authorName,
      authorColor: input.authorColor,
      signatures: [],
    })

    if (!version) {
      throw new Error('Could not create initial ICS-203 version.')
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

  const versions = await fetchIcs203Versions(document.id)

  return {
    document: {
      ...document,
      form_data: formStateForDocument(document.id, document.form_data),
    },
    versions,
  }
}

export async function fetchIcs203Versions(documentId: string): Promise<Ics203Version[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('ics203_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as Ics203VersionRow[]).map(mapIcs203VersionRow)
}

async function insertIcs203Version(
  input: PersistIcs203VersionInput
): Promise<Ics203Version | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = formStateForDocument(input.documentId, input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('ics203_versions')
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
    .from('ics203_documents')
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

  return mapIcs203VersionRow(versionRow as Ics203VersionRow)
}

export async function updateLatestIcs203Version(
  input: PersistIcs203VersionInput & { versionId: string }
): Promise<Ics203Version | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = formStateForDocument(input.documentId, input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('ics203_versions')
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
    .from('ics203_documents')
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

  return mapIcs203VersionRow(versionRow as Ics203VersionRow)
}

export async function appendIcs203Version(
  input: PersistIcs203VersionInput
): Promise<Ics203Version | null> {
  return insertIcs203Version(input)
}

export async function saveIcs203Draft(
  input: PersistIcs203VersionInput & { latestVersion: Ics203Version | null }
): Promise<Ics203Version | null> {
  const latest = input.latestVersion
  if (latest && latest.signatures.length === 0) {
    return updateLatestIcs203Version({
      ...input,
      versionId: latest.id,
    })
  }
  return appendIcs203Version(input)
}

export async function saveIcs203SignedReview(
  input: PersistIcs203VersionInput & { versionId: string }
): Promise<Ics203Version | null> {
  return updateLatestIcs203Version(input)
}

export function bundleToClientState(bundle: Ics203DocumentBundle): {
  form: Ics203FormState
  versions: Ics203Version[]
} {
  return {
    form: cloneIcs203FormState(bundle.document.form_data),
    versions: bundle.versions.map((version) => ({
      ...version,
      snapshot: cloneIcs203FormState(version.snapshot),
    })),
  }
}

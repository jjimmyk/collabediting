import type { Ics201VersionSignature } from '@/features/ics201/types'
import type {
  Ics202DocumentBundle,
  Ics202DocumentRow,
  Ics202FormState,
  Ics202Version,
  Ics202VersionRow,
} from '@/features/ics202/types'
import {
  cloneIcs202FormState,
  createEmptyIcs202Form,
  formStateForDocument,
  mapIcs202VersionRow,
} from '@/features/ics202/utils'
import { getSupabaseClient } from '@/lib/supabase'

export type PersistIcs202VersionInput = {
  documentId: string
  snapshot: Ics202FormState
  authorId: string | null
  authorName: string
  authorColor: string
  signatures?: Ics201VersionSignature[]
}

export async function fetchOrCreateIcs202Document(
  workspaceId: string,
  input: {
    form?: Partial<Ics202FormState>
    authorId: string | null
    authorName: string
    authorColor: string
  }
): Promise<Ics202DocumentBundle | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data: existing, error: fetchError } = await supabase
    .from('ics202_documents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  let document = existing as Ics202DocumentRow | null

  if (!document) {
    const { data: created, error: createError } = await supabase
      .from('ics202_documents')
      .insert({
        workspace_id: workspaceId,
        form_data: createEmptyIcs202Form('pending', input.form),
      })
      .select('*')
      .single()

    if (createError || !created) {
      throw new Error(createError?.message ?? 'Could not create ICS-202 document.')
    }

    document = created as Ics202DocumentRow
    const documentId = document.id
    const form = formStateForDocument(documentId, {
      ...createEmptyIcs202Form(documentId, input.form),
    })

    const version = await insertIcs202Version({
      documentId,
      snapshot: form,
      authorId: input.authorId,
      authorName: input.authorName,
      authorColor: input.authorColor,
      signatures: [],
    })

    if (!version) {
      throw new Error('Could not create initial ICS-202 version.')
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

  const versions = await fetchIcs202Versions(document.id)

  return {
    document: {
      ...document,
      form_data: formStateForDocument(document.id, document.form_data),
    },
    versions,
  }
}

export async function fetchIcs202Versions(documentId: string): Promise<Ics202Version[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('ics202_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as Ics202VersionRow[]).map(mapIcs202VersionRow)
}

async function insertIcs202Version(
  input: PersistIcs202VersionInput
): Promise<Ics202Version | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = formStateForDocument(input.documentId, input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('ics202_versions')
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
    .from('ics202_documents')
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

  return mapIcs202VersionRow(versionRow as Ics202VersionRow)
}

export async function updateLatestIcs202Version(
  input: PersistIcs202VersionInput & { versionId: string }
): Promise<Ics202Version | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = formStateForDocument(input.documentId, input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('ics202_versions')
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
    .from('ics202_documents')
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

  return mapIcs202VersionRow(versionRow as Ics202VersionRow)
}

export async function appendIcs202Version(
  input: PersistIcs202VersionInput
): Promise<Ics202Version | null> {
  return insertIcs202Version(input)
}

export async function saveIcs202Draft(
  input: PersistIcs202VersionInput & { latestVersion: Ics202Version | null }
): Promise<Ics202Version | null> {
  const latest = input.latestVersion
  if (latest && latest.signatures.length === 0) {
    return updateLatestIcs202Version({
      ...input,
      versionId: latest.id,
    })
  }
  return appendIcs202Version(input)
}

export async function saveIcs202SignedReview(
  input: PersistIcs202VersionInput & { versionId: string }
): Promise<Ics202Version | null> {
  return updateLatestIcs202Version(input)
}

export function bundleToClientState(bundle: Ics202DocumentBundle): {
  form: Ics202FormState
  versions: Ics202Version[]
} {
  return {
    form: cloneIcs202FormState(bundle.document.form_data),
    versions: bundle.versions.map((version) => ({
      ...version,
      snapshot: cloneIcs202FormState(version.snapshot),
    })),
  }
}

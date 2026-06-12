import type { Ics201VersionSignature } from '@/features/ics201/types'
import type {
  IapDocumentBundle,
  IapDocumentRow,
  IapFormState,
  IapVersion,
  IapVersionRow,
} from '@/features/iap/types'
import {
  cloneIapFormState,
  createEmptyIapForm,
  formStateForDocument,
  mapIapVersionRow,
} from '@/features/iap/utils'
import { getSupabaseClient } from '@/lib/supabase'

export type PersistIapVersionInput = {
  documentId: string
  snapshot: IapFormState
  authorId: string | null
  authorName: string
  authorColor: string
  signatures?: Ics201VersionSignature[]
}

export async function fetchOrCreateIapDocument(
  workspaceId: string,
  input: {
    form?: Partial<IapFormState>
    authorId: string | null
    authorName: string
    authorColor: string
  }
): Promise<IapDocumentBundle | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data: existing, error: fetchError } = await supabase
    .from('iap_documents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  let document = existing as IapDocumentRow | null

  if (!document) {
    const { data: created, error: createError } = await supabase
      .from('iap_documents')
      .insert({
        workspace_id: workspaceId,
        form_data: createEmptyIapForm('pending', input.form),
      })
      .select('*')
      .single()

    if (createError || !created) {
      throw new Error(createError?.message ?? 'Could not create IAP document.')
    }

    document = created as IapDocumentRow
    const documentId = document.id
    const form = formStateForDocument(documentId, {
      ...createEmptyIapForm(documentId, input.form),
    })

    const version = await insertIapVersion({
      documentId,
      snapshot: form,
      authorId: input.authorId,
      authorName: input.authorName,
      authorColor: input.authorColor,
      signatures: [],
    })

    if (!version) {
      throw new Error('Could not create initial IAP version.')
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

  const versions = await fetchIapVersions(document.id)

  return {
    document: {
      ...document,
      form_data: formStateForDocument(document.id, document.form_data),
    },
    versions,
  }
}

export async function fetchIapVersions(documentId: string): Promise<IapVersion[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('iap_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as IapVersionRow[]).map(mapIapVersionRow)
}

async function insertIapVersion(input: PersistIapVersionInput): Promise<IapVersion | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = formStateForDocument(input.documentId, input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('iap_versions')
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
    .from('iap_documents')
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

  return mapIapVersionRow(versionRow as IapVersionRow)
}

export async function updateLatestIapVersion(
  input: PersistIapVersionInput & { versionId: string }
): Promise<IapVersion | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = formStateForDocument(input.documentId, input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('iap_versions')
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
    .from('iap_documents')
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

  return mapIapVersionRow(versionRow as IapVersionRow)
}

export async function appendIapVersion(
  input: PersistIapVersionInput
): Promise<IapVersion | null> {
  return insertIapVersion(input)
}

export async function saveIapDraft(
  input: PersistIapVersionInput & { latestVersion: IapVersion | null }
): Promise<IapVersion | null> {
  const latest = input.latestVersion
  if (latest && latest.signatures.length === 0) {
    return updateLatestIapVersion({
      ...input,
      versionId: latest.id,
    })
  }
  return appendIapVersion(input)
}

export async function saveIapSignedReview(
  input: PersistIapVersionInput & { versionId: string }
): Promise<IapVersion | null> {
  return updateLatestIapVersion(input)
}

export function bundleToClientState(bundle: IapDocumentBundle): {
  form: IapFormState
  versions: IapVersion[]
} {
  return {
    form: cloneIapFormState(bundle.document.form_data),
    versions: bundle.versions.map((version) => ({
      ...version,
      snapshot: cloneIapFormState(version.snapshot),
    })),
  }
}

import type { Ics201VersionSignature } from '@/features/ics201/types'
import type {
  Ics204DocumentBundle,
  Ics204DocumentRow,
  Ics204FormState,
  Ics204Version,
  Ics204VersionRow,
} from '@/features/ics204/types'
import {
  cloneIcs204FormState,
  createEmptyIcs204Form,
  formStateForDocument,
  mapIcs204VersionRow,
} from '@/features/ics204/utils'
import { getSupabaseClient } from '@/lib/supabase'

export type PersistIcs204VersionInput = {
  documentId: string
  snapshot: Ics204FormState
  authorId: string | null
  authorName: string
  authorColor: string
  signatures?: Ics201VersionSignature[]
}

export async function fetchIcs204DocumentsForWorkspace(
  workspaceId: string
): Promise<Ics204DocumentBundle[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data: documents, error: documentsError } = await supabase
    .from('ics204_documents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  if (documentsError) {
    throw new Error(documentsError.message)
  }

  const bundles: Ics204DocumentBundle[] = []
  for (const row of (documents ?? []) as Ics204DocumentRow[]) {
    const versions = await fetchIcs204Versions(row.id)
    bundles.push({
      document: {
        ...row,
        form_data: formStateForDocument(row.id, row.form_data),
      },
      versions,
    })
  }

  return bundles
}

export async function fetchIcs204Versions(documentId: string): Promise<Ics204Version[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('ics204_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as Ics204VersionRow[]).map(mapIcs204VersionRow)
}

export async function createIcs204Document(
  workspaceId: string,
  input: {
    form?: Partial<Ics204FormState>
    authorId: string | null
    authorName: string
    authorColor: string
  }
): Promise<Ics204DocumentBundle | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data: documentRow, error: documentError } = await supabase
    .from('ics204_documents')
    .insert({
      workspace_id: workspaceId,
      form_data: createEmptyIcs204Form('pending'),
    })
    .select('*')
    .single()

  if (documentError || !documentRow) {
    throw new Error(documentError?.message ?? 'Could not create ICS-204 document.')
  }

  const documentId = documentRow.id as string
  const form = formStateForDocument(documentId, {
    ...createEmptyIcs204Form(documentId),
    ...input.form,
  })

  const version = await insertIcs204Version({
    documentId,
    snapshot: form,
    authorId: input.authorId,
    authorName: input.authorName,
    authorColor: input.authorColor,
    signatures: [],
  })

  if (!version) {
    throw new Error('Could not create initial ICS-204 version.')
  }

  return {
    document: {
      ...(documentRow as Ics204DocumentRow),
      form_data: form,
      latest_version_id: version.id,
    },
    versions: [version],
  }
}

async function insertIcs204Version(
  input: PersistIcs204VersionInput
): Promise<Ics204Version | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = formStateForDocument(input.documentId, input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('ics204_versions')
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
    .from('ics204_documents')
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

  return mapIcs204VersionRow(versionRow as Ics204VersionRow)
}

export async function updateLatestIcs204Version(
  input: PersistIcs204VersionInput & { versionId: string }
): Promise<Ics204Version | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = formStateForDocument(input.documentId, input.snapshot)
  const signatures = input.signatures ?? []

  const { data: versionRow, error: versionError } = await supabase
    .from('ics204_versions')
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
    .from('ics204_documents')
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

  return mapIcs204VersionRow(versionRow as Ics204VersionRow)
}

export async function appendIcs204Version(
  input: PersistIcs204VersionInput
): Promise<Ics204Version | null> {
  return insertIcs204Version(input)
}

export async function saveIcs204Draft(
  input: PersistIcs204VersionInput & { latestVersion: Ics204Version | null }
): Promise<Ics204Version | null> {
  const latest = input.latestVersion
  if (latest && latest.signatures.length === 0) {
    return updateLatestIcs204Version({
      ...input,
      versionId: latest.id,
    })
  }
  return appendIcs204Version(input)
}

export async function saveIcs204SignedReview(
  input: PersistIcs204VersionInput & { versionId: string }
): Promise<Ics204Version | null> {
  return updateLatestIcs204Version(input)
}

export async function deleteIcs204Document(documentId: string): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { error } = await supabase.from('ics204_documents').delete().eq('id', documentId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function assignIcs204Document(
  documentId: string,
  input: {
    assignedUnit: string
    assignedBy: string | null
  }
): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { error } = await supabase
    .from('ics204_documents')
    .update({
      assigned_at: new Date().toISOString(),
      assigned_by: input.assignedBy,
      assigned_unit: input.assignedUnit,
      updated_at: new Date().toISOString(),
      updated_by: input.assignedBy,
    })
    .eq('id', documentId)

  if (error) {
    throw new Error(error.message)
  }
}

export function bundlesToClientState(bundles: Ics204DocumentBundle[]): {
  forms: Ics204FormState[]
  versionsById: Record<string, Ics204Version[]>
  assignedFormIds: Record<string, boolean>
} {
  const forms = bundles.map((bundle) => cloneIcs204FormState(bundle.document.form_data))
  const versionsById: Record<string, Ics204Version[]> = {}
  const assignedFormIds: Record<string, boolean> = {}
  for (const bundle of bundles) {
    versionsById[bundle.document.id] = bundle.versions.map((version) => ({
      ...version,
      snapshot: cloneIcs204FormState(version.snapshot),
    }))
    if (bundle.document.assigned_at) {
      assignedFormIds[bundle.document.id] = true
    }
  }
  return { forms, versionsById, assignedFormIds }
}

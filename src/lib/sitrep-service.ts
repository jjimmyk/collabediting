import { getSupabaseClient } from '@/lib/supabase'
import { cloneSitrepFormState, mapSitrepVersionRow } from '@/features/sitrep/utils'
import type {
  SitrepDocumentRow,
  SitrepFormState,
  SitrepScopeRef,
  SitrepSection,
  SitrepVersion,
  SitrepVersionRow,
  SitrepVersionSignature,
} from '@/features/sitrep/types'

export type SitrepDocumentBundle = {
  document: SitrepDocumentRow
  versions: SitrepVersion[]
}

export type PersistSitrepVersionInput = {
  documentId: string
  snapshot: SitrepFormState
  authorId: string | null
  authorName: string
  authorColor: string
  authorRole?: string
  signatures?: SitrepVersionSignature[]
  sectionId?: SitrepSection
  creatorName?: string
  creatorColor?: string
  creatorRole?: string
  creatorCreatedAt?: number
  submittedForReviewTo?: Array<{ name: string; role: string }>
  submittedForReviewAt?: number
  aiGeneratedSections?: SitrepSection[]
}

export type SitrepLiveSummary = {
  executiveSummary: string
  sitrepUpdatedBy: string
}

async function fetchSitrepVersions(documentId: string): Promise<SitrepVersion[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('sitrep_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as SitrepVersionRow[]).map(mapSitrepVersionRow)
}

async function fetchSitrepDocumentBundle(
  query: { column: 'workspace_id' | 'organization_id'; value: string; femaAorId?: string },
  initialForm: SitrepFormState,
  createPayload: Record<string, unknown>
): Promise<SitrepDocumentBundle | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  let request = supabase.from('sitrep_documents').select('*').eq(query.column, query.value)
  if (query.column === 'organization_id' && query.femaAorId) {
    request = request.eq('fema_aor_id', query.femaAorId)
  }

  const { data: existing, error: fetchError } = await request.maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  let document = existing as SitrepDocumentRow | null

  if (!document) {
    const { data: created, error: createError } = await supabase
      .from('sitrep_documents')
      .insert({
        ...createPayload,
        form_data: initialForm,
      })
      .select('*')
      .single()

    if (createError) {
      throw new Error(createError.message)
    }

    document = created as SitrepDocumentRow
  }

  const versions = await fetchSitrepVersions(document.id)

  return {
    document: {
      ...document,
      form_data: cloneSitrepFormState(document.form_data),
    },
    versions,
  }
}

export async function fetchOrCreateSitrepDocumentForScope(
  scopeRef: SitrepScopeRef,
  initialForm: SitrepFormState
): Promise<SitrepDocumentBundle | null> {
  if (scopeRef.kind === 'workspace') {
    return fetchSitrepDocumentBundle(
      { column: 'workspace_id', value: scopeRef.workspaceId },
      initialForm,
      { workspace_id: scopeRef.workspaceId }
    )
  }

  return fetchSitrepDocumentBundle(
    { column: 'organization_id', value: scopeRef.organizationId, femaAorId: scopeRef.femaAorId },
    initialForm,
    {
      organization_id: scopeRef.organizationId,
      fema_aor_id: scopeRef.femaAorId,
    }
  )
}

export async function persistSitrepVersion(
  input: PersistSitrepVersionInput
): Promise<SitrepVersion | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const snapshot = cloneSitrepFormState(input.snapshot)
  const signatures = input.signatures ?? []
  const creatorCreatedAt =
    input.creatorCreatedAt !== undefined
      ? new Date(input.creatorCreatedAt).toISOString()
      : null
  const submittedForReviewAt =
    input.submittedForReviewAt !== undefined
      ? new Date(input.submittedForReviewAt).toISOString()
      : null

  const { data: versionRow, error: versionError } = await supabase
    .from('sitrep_versions')
    .insert({
      document_id: input.documentId,
      author_id: input.authorId,
      author_name: input.authorName,
      author_color: input.authorColor,
      author_role: input.authorRole ?? '',
      snapshot,
      signatures,
      section_id: input.sectionId ?? null,
      creator_name: input.creatorName ?? input.authorName,
      creator_color: input.creatorColor ?? input.authorColor,
      creator_role: input.creatorRole ?? input.authorRole ?? '',
      creator_created_at: creatorCreatedAt,
      submitted_for_review_to: input.submittedForReviewTo ?? null,
      submitted_for_review_at: submittedForReviewAt,
      ai_generated_sections: input.aiGeneratedSections ?? null,
    })
    .select('*')
    .single()

  if (versionError) {
    throw new Error(versionError.message)
  }

  const { error: documentError } = await supabase
    .from('sitrep_documents')
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

  return mapSitrepVersionRow(versionRow as SitrepVersionRow)
}

export async function fetchSitrepLiveSummaryForAor(
  organizationId: string,
  femaAorId: string
): Promise<SitrepLiveSummary | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data: document, error: documentError } = await supabase
    .from('sitrep_documents')
    .select('id, form_data, latest_version_id')
    .eq('organization_id', organizationId)
    .eq('fema_aor_id', femaAorId)
    .maybeSingle()

  if (documentError) {
    throw new Error(documentError.message)
  }

  if (!document) {
    return null
  }

  const form = document.form_data as SitrepFormState
  let sitrepUpdatedBy = 'Unknown'

  if (document.latest_version_id) {
    const { data: version, error: versionError } = await supabase
      .from('sitrep_versions')
      .select('author_name, author_role')
      .eq('id', document.latest_version_id)
      .maybeSingle()

    if (versionError) {
      throw new Error(versionError.message)
    }

    if (version) {
      const role = (version.author_role as string | null)?.trim()
      sitrepUpdatedBy = role ? `${role} ${version.author_name}` : String(version.author_name)
    }
  }

  const executiveSummary = form.executiveSummary?.trim()
  if (!executiveSummary) {
    return null
  }

  return {
    executiveSummary:
      executiveSummary.length > 240 ? `${executiveSummary.slice(0, 237)}…` : executiveSummary,
    sitrepUpdatedBy,
  }
}

export function subscribeToSitrepChanges(
  documentId: string,
  handlers: {
    onDocumentUpdated?: (document: SitrepDocumentRow) => void
    onVersionInserted?: (version: SitrepVersion) => void
  }
): () => void {
  const supabase = getSupabaseClient()
  if (!supabase) return () => undefined

  const channel = supabase
    .channel(`sitrep-doc:${documentId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'sitrep_documents',
        filter: `id=eq.${documentId}`,
      },
      (payload) => {
        const row = payload.new as SitrepDocumentRow
        handlers.onDocumentUpdated?.({
          ...row,
          form_data: cloneSitrepFormState(row.form_data),
        })
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'sitrep_versions',
        filter: `document_id=eq.${documentId}`,
      },
      (payload) => {
        handlers.onVersionInserted?.(mapSitrepVersionRow(payload.new as SitrepVersionRow))
      }
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

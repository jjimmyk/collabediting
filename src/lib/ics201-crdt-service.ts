import type { Ics201SectionId } from '@/features/ics201/types'
import { decodeBytea, encodeBytea } from '@/lib/ics201-crdt-utils'
import { getSupabaseClient } from '@/lib/supabase'

type Ics201SectionCrdtRow = {
  document_id: string
  section_id: string
  state: string
  updated_at: string
}

export async function fetchSectionCrdtState(
  documentId: string,
  sectionId: Ics201SectionId
): Promise<Uint8Array | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('ics201_section_crdt')
    .select('state')
    .eq('document_id', documentId)
    .eq('section_id', sectionId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data?.state) return null
  return decodeBytea(data.state as string)
}

export async function persistSectionCrdtState(
  documentId: string,
  sectionId: Ics201SectionId,
  state: Uint8Array
): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const payload: Ics201SectionCrdtRow = {
    document_id: documentId,
    section_id: sectionId,
    state: encodeBytea(state),
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('ics201_section_crdt').upsert(payload, {
    onConflict: 'document_id,section_id',
  })

  if (error) {
    throw new Error(error.message)
  }
}
